import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { productPath } from "./product-url.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, "..");
const baseUrl = (process.env.SITE_URL || "https://kennedylaserworks.com").replace(/\/$/, "");
const catalog = JSON.parse(await readFile(path.join(rootDirectory, "data/products.json"), "utf8"));
const pagePaths = ["/", "/collections.html", "/custom-projects.html", "/custom-work.html", "/about.html", "/reviews.html", "/contact.html", "/privacy.html", "/terms.html", ...catalog.products.filter((product) => product.active && product.listingStatus === "active").map(productPath)];
const escapeXml = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const entries = pagePaths.map((pagePath) => `  <url><loc>${escapeXml(`${baseUrl}${pagePath}`)}</loc></url>`).join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Generated from the current canonical site pages. -->
${entries}
</urlset>
`;

await writeFile(path.join(rootDirectory, "sitemap.xml"), sitemap, "utf8");
console.log(`Generated ${pagePaths.length} canonical sitemap URLs for ${baseUrl}.`);
