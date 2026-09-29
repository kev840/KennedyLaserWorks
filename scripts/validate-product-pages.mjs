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
const errors = [];
const escape = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
const assert = (condition, message) => { if (!condition) errors.push(message); };
assert(files.length === active.length, `Expected ${active.length} pages, found ${files.length}`);
assert(new Set(expectedPaths).size === active.length, "Duplicate slugs");
const titles = new Set();
const canonicals = new Set();
for (const item of active) {
  const urlPath = productPath(item);
  const file = path.join(root, urlPath.slice(1));
  let html;
  try { html = await readFile(file, "utf8"); } catch { errors.push(`Missing ${urlPath}`); continue; }
  const canonical = `https://kennedylaserworks.com${urlPath}`;
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  assert(title?.includes(escape(item.displayTitle)), `${urlPath}: wrong title`);
  assert(!titles.has(title), `${urlPath}: duplicate title`);
  titles.add(title);
  assert(html.includes(`<link rel="canonical" href="${canonical}">`), `${urlPath}: wrong canonical`);
  assert(!canonicals.has(canonical), `${urlPath}: duplicate canonical`);
  canonicals.add(canonical);
  assert(html.includes(`<meta property="og:url" content="${canonical}">`), `${urlPath}: wrong Open Graph URL`);
  assert(html.includes('<meta name="robots" content="index,follow">'), `${urlPath}: not indexable`);
  assert(!html.includes("InStock"), `${urlPath}: unsupported availability claim`);
  assert(html.includes(`href="${item.etsyUrl}"`), `${urlPath}: Etsy destination mismatch`);
  assert(html.includes(`<h1>${escape(item.displayTitle)}</h1>`), `${urlPath}: product heading missing`);
  assert(sitemap.includes(`<loc>${canonical}</loc>`), `${urlPath}: sitemap entry missing`);
  const schemaMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  try {
    const schema = JSON.parse(schemaMatch?.[1] || "");
    assert(schema["@type"] === "Product" && schema.url === canonical && schema.name === item.displayTitle, `${urlPath}: wrong Product JSON-LD`);
    assert(!schema.offers && !schema.aggregateRating, `${urlPath}: unsupported Product JSON-LD`);
  } catch { errors.push(`${urlPath}: invalid Product JSON-LD`); }
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
assert(!/<loc>[^<]*product\.html\?/.test(sitemap), "Dynamic product URL in sitemap");
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
else console.log(`Validated ${active.length} generated product pages, unique titles/canonicals, Product JSON-LD, assets, Etsy URLs, and sitemap entries.`);
