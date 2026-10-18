import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { productPath } from "./product-url.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(await readFile(path.join(root, "data/products.json"), "utf8"));
const active = catalog.products.filter((item) => item.active && item.listingStatus === "active");
const expectedPaths = active.map(productPath);
const files = (await readdir(path.join(root, "products"))).filter((file) => file.endsWith(".html"));
const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
const collections = await readFile(path.join(root, "collections.html"), "utf8");
const home = await readFile(path.join(root, "index.html"), "utf8");
const errors = [];
const escape = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
const assert = (condition, message) => { if (!condition) errors.push(message); };
assert(files.length === active.length, `Expected ${active.length} pages, found ${files.length}`);
assert(new Set(expectedPaths).size === active.length, "Duplicate slugs");
const titles = new Set();
const canonicals = new Set();
const descriptions = new Set();
const bodyDescriptions = new Set();
const incomingProductLinks = new Map(expectedPaths.map((urlPath) => [urlPath, 0]));
for (const item of active) {
  const urlPath = productPath(item);
  const file = path.join(root, urlPath.slice(1));
  let html;
  try { html = await readFile(file, "utf8"); } catch { errors.push(`Missing ${urlPath}`); continue; }
  const canonical = `https://kennedylaserworks.com${urlPath}`;
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  assert(title?.includes(escape(item.seoTitle || item.displayTitle)), `${urlPath}: wrong title`);
  assert(!titles.has(title), `${urlPath}: duplicate title`);
  titles.add(title);
  assert(html.includes(`<link rel="canonical" href="${canonical}">`), `${urlPath}: wrong canonical`);
  assert(!canonicals.has(canonical), `${urlPath}: duplicate canonical`);
  canonicals.add(canonical);
  assert(html.includes(`<meta property="og:url" content="${canonical}">`), `${urlPath}: wrong Open Graph URL`);
  assert(html.includes('<meta name="robots" content="index,follow">'), `${urlPath}: not indexable`);
  if (!item.structuredOffer) assert(!html.includes("InStock"), `${urlPath}: unsupported availability claim`);
  assert(html.includes(`href="${item.etsyUrl}"`), `${urlPath}: Etsy destination mismatch`);
  if (item.suppressWebsitePricing) {
    assert(!/\$\d/.test(html), `${urlPath}: hardcoded price remains on pricing-suppressed page`);
    assert(html.includes("View Current Pricing &amp; Purchase on Etsy"), `${urlPath}: current-pricing Etsy CTA missing`);
  }
  assert(html.includes(`<h1>${escape(item.displayTitle)}</h1>`), `${urlPath}: product heading missing`);
  assert(item.longDescription?.trim().split(/\s+/).length >= 20, `${urlPath}: distinctive body copy missing`);
  assert(!bodyDescriptions.has(item.longDescription), `${urlPath}: duplicate body copy`);
  bodyDescriptions.add(item.longDescription);
  assert(item.seoDescription?.trim().length >= 65 && item.seoDescription.length <= 180, `${urlPath}: SEO description missing or too long`);
  assert(!descriptions.has(item.seoDescription), `${urlPath}: duplicate SEO description`);
  descriptions.add(item.seoDescription);
  assert(html.includes(`<meta name="description" content="${escape(item.seoDescription)}">`), `${urlPath}: SEO description not rendered`);
  assert(item.imageMetadata?.every((image) => image.alt?.trim().length > 24 && !/\bview\s+\d+\b/i.test(image.alt)), `${urlPath}: generic image alt text remains`);
  assert(!/\$\d/.test(html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "")), `${urlPath}: visible product price remains`);
  assert(sitemap.includes(`<loc>${canonical}</loc>`), `${urlPath}: sitemap entry missing`);
  assert(collections.includes(`href="${urlPath.slice(1)}"`), `${urlPath}: static collections-directory link missing`);
  for (const match of html.matchAll(/href="(products\/[^"#?]+\.html)"/g)) {
    const relatedPath = `/${match[1]}`;
    if (incomingProductLinks.has(relatedPath)) incomingProductLinks.set(relatedPath, incomingProductLinks.get(relatedPath) + 1);
  }
  const schemaMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  try {
    const schema = JSON.parse(schemaMatch?.[1] || "");
    const graph = schema["@graph"];
    const primary = graph?.find((entry) => entry["@id"] === `${canonical}#primary`);
    const breadcrumb = graph?.find((entry) => entry["@type"] === "BreadcrumbList");
    assert(Array.isArray(graph) && primary?.url === canonical && primary?.name === item.displayTitle, `${urlPath}: wrong primary JSON-LD entity`);
    assert(breadcrumb?.itemListElement?.length === 3, `${urlPath}: breadcrumb JSON-LD missing`);
    if (item.structuredOffer) {
      assert(primary?.["@type"] === "Product", `${urlPath}: purchasable page must use Product JSON-LD`);
      assert(primary?.offers?.["@type"] === "Offer", `${urlPath}: offer missing`);
      assert(primary?.offers?.price === item.structuredOffer.price && primary?.offers?.priceCurrency === item.structuredOffer.priceCurrency, `${urlPath}: offer price does not match catalog data`);
      assert(primary?.offers?.url === item.etsyUrl, `${urlPath}: offer URL does not match Etsy listing`);
    } else {
      assert(primary?.["@type"] === "WebPage", `${urlPath}: showcase page must use WebPage JSON-LD`);
      assert(!graph.some((entry) => entry["@type"] === "Product"), `${urlPath}: unsupported Product JSON-LD remains`);
    }
  } catch { errors.push(`${urlPath}: invalid structured data`); }
  for (const match of html.matchAll(/(?:href|src|srcset)="([^"#]+)"/g)) {
    const reference = match[1].split(/[?#]/)[0];
    if (/^(?:https?:|mailto:|data:)/.test(reference)) continue;
    try { await access(path.join(root, reference)); } catch { errors.push(`${urlPath}: missing ${reference}`); }
  }
  for (const match of html.matchAll(/href="#([^"]+)"/g)) {
    assert(html.includes(`id="${match[1]}"`), `${urlPath}: missing #${match[1]} anchor`);
  }
  for (const match of html.matchAll(/href="([^"#]+)#([^"]+)"/g)) {
    if (/^(?:https?:|mailto:)/.test(match[1])) continue;
    try {
      const target = await readFile(path.join(root, match[1].split("?")[0]), "utf8");
      assert(target.includes(`id="${decodeURIComponent(match[2])}"`), `${urlPath}: broken ${match[1]}#${match[2]} anchor`);
    } catch { errors.push(`${urlPath}: missing anchor target ${match[1]}`); }
  }
}
for (const file of files) assert(expectedPaths.includes(`/products/${file}`), `Orphaned product page: ${file}`);
for (const [urlPath, count] of incomingProductLinks) assert(count >= 2, `${urlPath}: only ${count} incoming links from product pages`);
const featuredHtml = home.match(/<!-- HOME_PRODUCT_LINKS_START -->([\s\S]*?)<!-- HOME_PRODUCT_LINKS_END -->/)?.[1] || "";
const featuredPaths = [...featuredHtml.matchAll(/href="(products\/[^"#?]+\.html)"/g)].map((match) => match[1]);
assert(new Set(featuredPaths).size === 6, "Homepage must expose six distinct featured product links in initial HTML");
assert((collections.match(/href="products\/[^"#?]+\.html"/g) || []).length >= active.length, "Collections directory links missing");
assert(!/<loc>[^<]*product\.html\?/.test(sitemap), "Dynamic product URL in sitemap");
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
else console.log(`Validated ${active.length} generated product pages, unique content and metadata, image descriptions, price-free page display, at least two product-page incoming links each, structured data, assets, Etsy URLs, and sitemap entries.`);
