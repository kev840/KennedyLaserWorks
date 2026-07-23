import { createRequire } from "node:module";
import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "data", "products.json");
const backupPath = path.join(root, "data", "products.import-backup.json");
const imageDirectory = path.join(root, "assets", "images", "products");
const argumentsSet = new Set(process.argv.slice(2));
const normalizeOnly = argumentsSet.has("--normalize-only");
const dryRun = argumentsSet.has("--dry-run");
const API_BASE = "https://openapi.etsy.com/v3/application";
const SHOP_NAME = process.env.ETSY_SHOP_NAME || "KennedyLaserWorks";
const CONCURRENCY = Math.max(1, Math.min(6, Number(process.env.ETSY_IMPORT_CONCURRENCY) || 3));
const MAX_IMAGE_EDGE = Math.max(794, Math.min(2000, Number(process.env.ETSY_IMAGE_MAX_EDGE) || 1200));
const IMAGE_ROTATIONS = new Map([
  ["6704286019", 270]
]);

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));

const toWebPath = (absolutePath) => path.relative(root, absolutePath).split(path.sep).join("/");
const deriveFallback = (source) => /\.webp$/i.test(source) ? source.replace(/\.webp$/i, ".jpg") : source;
const slugify = (value) => String(value || "product").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "product";
const snapshotDate = () => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const legacyImage = (image, product, index) => {
  if (typeof image === "string") return { webp: image, fallback: deriveFallback(image), alt: `${product.displayTitle}${index ? ` — view ${index + 1}` : ""}` };
  return {
    webp: image?.src || image?.webp || image?.primaryImage || image?.fallback,
    fallback: image?.fallback || image?.imageFallback || deriveFallback(image?.src || image?.webp || ""),
    alt: image?.alt || `${product.displayTitle}${index ? ` — view ${index + 1}` : ""}`,
    width: image?.width,
    height: image?.height,
    rank: image?.rank,
    remoteSource: image?.remoteSource,
    etsyImageId: image?.etsyImageId
  };
};

const normalizeProductImages = (product) => {
  const current = Array.isArray(product.images) && product.images.length
    ? product.images.map((image, index) => legacyImage(image, product, index))
    : [
      legacyImage({ src: product.primaryImage, fallback: product.imageFallback, alt: product.displayTitle, width: product.imageWidth, height: product.imageHeight, remoteSource: product.remoteImageSource }, product, 0),
      ...(product.alternateImages || []).map((image, index) => legacyImage(image, product, index + 1))
    ];
  const metadata = current.map((image, index) => ({
    width: product.imageMetadata?.[index]?.width || image.width || product.imageWidth || 794,
    height: product.imageMetadata?.[index]?.height || image.height || product.imageHeight || 794,
    alt: product.imageMetadata?.[index]?.alt || image.alt,
    rank: product.imageMetadata?.[index]?.rank || image.rank || index + 1,
    ...(product.imageMetadata?.[index]?.etsyImageId || image.etsyImageId ? { etsyImageId: String(product.imageMetadata?.[index]?.etsyImageId || image.etsyImageId) } : {}),
    ...(product.imageMetadata?.[index]?.remoteSource || image.remoteSource ? { remoteSource: product.imageMetadata?.[index]?.remoteSource || image.remoteSource } : {})
  }));
  product.images = current.map((image) => image.webp);
  product.imageFallbacks = current.map((image) => image.fallback || deriveFallback(image.webp));
  product.imageMetadata = metadata;
  product.primaryImage = product.images[0];
  product.imageFallback = product.imageFallbacks[0];
  product.remoteImageSource = metadata[0]?.remoteSource || product.remoteImageSource;
  product.imageWidth = metadata[0]?.width || product.imageWidth;
  product.imageHeight = metadata[0]?.height || product.imageHeight;
  product.alternateImages = product.images.slice(1).map((source, index) => ({
    src: source,
    fallback: product.imageFallbacks[index + 1],
    ...product.imageMetadata[index + 1]
  }));
  return product;
};

catalog.products.forEach(normalizeProductImages);

const writeCatalog = async () => {
  const temporaryPath = `${catalogPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  await rename(temporaryPath, catalogPath);
};

if (normalizeOnly) {
  if (!dryRun) await writeCatalog();
  console.log(`${dryRun ? "Would normalize" : "Normalized"} gallery arrays for ${catalog.products.length} products.`);
  process.exit(0);
}

const apiKey = process.env.ETSY_API_KEY;
if (!apiKey) {
  console.error("ETSY_API_KEY is required. Copy .env.example to a private environment file or set the variable in your shell; never commit the credential.");
  process.exit(1);
}

let sharp;
try {
  sharp = require("sharp");
} catch {
  console.error("The image optimizer is unavailable. Run `npm install` before importing the Etsy catalog.");
  process.exit(1);
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const request = async (url, options = {}, attempt = 1) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      "user-agent": "KennedyLaserWorksCatalogImporter/1.0",
      ...(url.startsWith(API_BASE) ? { "x-api-key": apiKey } : {}),
      ...(options.headers || {})
    },
    signal: AbortSignal.timeout(30_000)
  });
  if ((response.status === 429 || response.status >= 500) && attempt < 4) {
    await wait(500 * (2 ** (attempt - 1)));
    return request(url, options, attempt + 1);
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText} from ${url}: ${body.slice(0, 300)}`);
  }
  return response;
};

const apiJson = async (resource) => (await request(`${API_BASE}${resource}`)).json();

const resolveShopId = async () => {
  if (process.env.ETSY_SHOP_ID) return process.env.ETSY_SHOP_ID;
  const response = await apiJson(`/shops?shop_name=${encodeURIComponent(SHOP_NAME)}&limit=100`);
  const shop = response.results?.find((item) => item.shop_name?.toLowerCase() === SHOP_NAME.toLowerCase());
  if (!shop) throw new Error(`Could not resolve Etsy shop ${SHOP_NAME}. Set ETSY_SHOP_ID explicitly.`);
  return String(shop.shop_id);
};

const activeListings = async (shopId) => {
  const listings = [];
  for (let offset = 0; ; offset += 100) {
    const page = await apiJson(`/shops/${shopId}/listings/active?limit=100&offset=${offset}`);
    listings.push(...(page.results || []));
    if (listings.length >= page.count || !page.results?.length) return listings;
  }
};

const moneyDisplay = (money, fallback) => {
  if (!money || !Number.isFinite(Number(money.amount)) || !Number.isFinite(Number(money.divisor))) return fallback;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: money.currency_code || "USD" }).format(Number(money.amount) / Number(money.divisor));
};

const imageFileBase = (product, index) => {
  const firstBase = path.basename(product.primaryImage || "", path.extname(product.primaryImage || "")) || `${product.etsyListingId}-${slugify(product.displayTitle)}`;
  return index === 0 ? firstBase : `${firstBase}-${String(index + 1).padStart(2, "0")}`;
};

const optimizeImage = async (buffer, jpgPath, webpPath, rotation = 0) => {
  let pipeline = sharp(buffer).rotate();
  if (rotation) pipeline = pipeline.rotate(rotation);
  pipeline = pipeline.resize({ width: MAX_IMAGE_EDGE, height: MAX_IMAGE_EDGE, fit: "inside", withoutEnlargement: true });
  const { data: jpg, info } = await pipeline.clone().flatten({ background: "#eee8dd" }).jpeg({ quality: 84, progressive: true, mozjpeg: true }).toBuffer({ resolveWithObject: true });
  const webp = await pipeline.clone().webp({ quality: 80, effort: 5, smartSubsample: true }).toBuffer();
  if (!dryRun) await Promise.all([writeFile(jpgPath, jpg), writeFile(webpPath, webp)]);
  return { width: info.width, height: info.height };
};

const importProductImages = async (product, listing) => {
  const response = await apiJson(`/listings/${product.etsyListingId}/images`);
  const etsyImages = [...(response.results || [])].sort((left, right) => Number(left.rank) - Number(right.rank));
  if (!etsyImages.length) throw new Error(`${product.displayTitle}: Etsy returned no listing images.`);
  const records = [];
  for (let index = 0; index < etsyImages.length; index += 1) {
    const image = etsyImages[index];
    const remoteSource = image.url_fullxfull || image.url_570xN;
    if (!remoteSource) throw new Error(`${product.displayTitle}: image rank ${image.rank} has no downloadable URL.`);
    const base = imageFileBase(product, index);
    const jpgPath = path.join(imageDirectory, `${base}.jpg`);
    const webpPath = path.join(imageDirectory, `${base}.webp`);
    const buffer = Buffer.from(await (await request(remoteSource)).arrayBuffer());
    const dimensions = await optimizeImage(buffer, jpgPath, webpPath, IMAGE_ROTATIONS.get(String(image.listing_image_id)) || 0);
    records.push({
      webp: toWebPath(webpPath),
      fallback: toWebPath(jpgPath),
      width: dimensions.width,
      height: dimensions.height,
      alt: image.alt_text?.trim() || `${product.displayTitle}${index ? ` — view ${index + 1}` : ""}`,
      rank: Number(image.rank) || index + 1,
      etsyImageId: String(image.listing_image_id),
      remoteSource
    });
  }
  product.etsyTitle = listing.title || product.etsyTitle;
  product.etsyUrl = listing.url || product.etsyUrl;
  product.priceDisplay = moneyDisplay(listing.price, product.priceDisplay);
  product.priceSnapshotDate = catalog.catalogSnapshotDate;
  product.images = records.map((record) => record.webp);
  product.imageFallbacks = records.map((record) => record.fallback);
  product.imageMetadata = records.map(({ webp, fallback, ...metadata }) => metadata);
  product.primaryImage = records[0].webp;
  product.imageFallback = records[0].fallback;
  product.remoteImageSource = records[0].remoteSource;
  product.imageWidth = records[0].width;
  product.imageHeight = records[0].height;
  product.alternateImages = records.slice(1).map(({ webp, ...record }) => ({ src: webp, ...record }));
  console.log(`${product.displayTitle}: imported ${records.length} ordered image${records.length === 1 ? "" : "s"}.`);
};

const mapLimit = async (items, limit, callback) => {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await callback(items[index], index);
    }
  });
  await Promise.all(workers);
};

try {
  await mkdir(imageDirectory, { recursive: true });
  const shopId = await resolveShopId();
  const listings = await activeListings(shopId);
  const listingMap = new Map(listings.map((listing) => [String(listing.listing_id), listing]));
  const catalogIds = new Set(catalog.products.filter((product) => product.active).map((product) => String(product.etsyListingId)));
  const missingFromCatalog = listings.filter((listing) => !catalogIds.has(String(listing.listing_id)));
  const inactiveInCatalog = catalog.products.filter((product) => product.active && !listingMap.has(String(product.etsyListingId)));
  if (missingFromCatalog.length || inactiveInCatalog.length) {
    const details = [
      ...missingFromCatalog.map((listing) => `New active Etsy listing needs editorial catalog fields: ${listing.listing_id} — ${listing.title}`),
      ...inactiveInCatalog.map((product) => `Catalog product is no longer active on Etsy: ${product.etsyListingId} — ${product.displayTitle}`)
    ];
    throw new Error(`Catalog membership differs from Etsy. Resolve these records before importing images:\n${details.map((detail) => `- ${detail}`).join("\n")}`);
  }
  catalog.catalogSnapshotDate = snapshotDate();
  catalog.imagePolicy = {
    format: `Ordered local WebP and JPEG galleries, maximum ${MAX_IMAGE_EDGE}px edge`,
    source: "All listing photographs returned by Etsy Open API v3 in Etsy rank order"
  };
  await mapLimit(catalog.products.filter((product) => product.active), CONCURRENCY, (product) => importProductImages(product, listingMap.get(String(product.etsyListingId))));
  if (!dryRun) {
    await copyFile(catalogPath, backupPath);
    await writeCatalog();
  }
  const totalImages = catalog.products.reduce((total, product) => total + product.images.length, 0);
  console.log(`${dryRun ? "Verified" : "Imported"} ${totalImages} images for ${catalog.products.length} active Etsy listings. Catalog order and Etsy image rank are preserved.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
