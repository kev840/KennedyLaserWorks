import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const catalog = JSON.parse(read("data/products.json"));
const categoryData = JSON.parse(read("data/categories.json"));
const products = catalog.products;
const allowedCategories = new Set(categoryData.categories.map((category) => category.slug));
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

assert(products.length === 65, `Expected 65 live listings; found ${products.length}.`);
assert(Boolean(catalog.catalogSnapshotDate), "Catalog snapshot date is missing.");
assert(catalog.sourceShop === "https://kennedylaserworks.etsy.com/", "Unexpected source shop URL.");
assert(new Set(products.map((product) => product.id)).size === products.length, "Product IDs must be unique.");
assert(new Set(products.map((product) => product.etsyListingId)).size === products.length, "Etsy listing IDs must be unique.");
assert(new Set(products.map((product) => product.etsyUrl)).size === products.length, "Etsy listing URLs must be unique.");

for (const product of products) {
  const label = product.displayTitle || product.id;
  assert(product.listingStatus === "active" && product.active === true, `${label}: listing is not marked active.`);
  assert(Boolean(product.etsyTitle && product.displayTitle && product.priceDisplay), `${label}: title or price is missing.`);
  assert(product.etsyUrl.includes(`/listing/${product.etsyListingId}/`), `${label}: listing URL does not match its ID.`);
  assert(/^\$\d/.test(product.priceDisplay), `${label}: displayed price is malformed.`);
  assert(product.priceSnapshotDate === catalog.catalogSnapshotDate, `${label}: price snapshot date is inconsistent.`);
  assert(product.sample !== true, `${label}: a sample flag remains.`);
  assert(product.customerFavorite !== true, `${label}: customer-favorite claim is not verified.`);
  assert(Array.isArray(product.categories) && product.categories.length > 0, `${label}: no category assigned.`);
  product.categories.forEach((category) => assert(allowedCategories.has(category), `${label}: unknown category ${category}.`));
  for (const imagePath of [product.primaryImage, product.imageFallback]) {
    const absolute = path.join(root, imagePath);
    assert(fs.existsSync(absolute), `${label}: missing image ${imagePath}.`);
    if (fs.existsSync(absolute)) assert(fs.statSync(absolute).size > 1_000, `${label}: image file appears invalid: ${imagePath}.`);
  }
  assert(product.imageWidth > 0 && product.imageHeight > 0, `${label}: image dimensions are missing.`);
}

const htmlFiles = fs.readdirSync(root).filter((file) => file.endsWith(".html"));
for (const file of htmlFiles) {
  const html = read(file);
  assert(!/sample catalog|sample product|placeholder artwork|review import pending/i.test(html), `${file}: public sample or placeholder language remains.`);
  assert(!/862[\s.-]*253[\s.-]*3278/.test(html), `${file}: public phone number must not be shown.`);
  const localReferences = [...html.matchAll(/(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)].map((match) => match[1]);
  localReferences.filter((reference) => !/^(?:https?:|mailto:|tel:|data:)/.test(reference)).forEach((reference) => {
    const target = path.resolve(root, reference);
    assert(target.startsWith(root) && fs.existsSync(target), `${file}: missing local reference ${reference}.`);
  });
}

if (errors.length) {
  console.error(`Catalog validation failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const usedCategories = new Set(products.flatMap((product) => product.categories));
console.log(`Validated ${products.length} active listings, ${usedCategories.size} populated categories, ${products.length * 2} optimized image files, and ${htmlFiles.length} HTML pages.`);
