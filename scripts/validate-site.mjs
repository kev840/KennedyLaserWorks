import { access, readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = (await readdir(rootDirectory)).filter((file) => file.endsWith(".html"));
const failures = [];
const localReferencePattern = /(?:href|src)="([^"#]+)"/g;

for (const page of pages) {
  const markup = await readFile(path.join(rootDirectory, page), "utf8");
  const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicateIds.length) failures.push(`${page}: duplicate IDs (${duplicateIds.join(", ")})`);

  const requiredPatterns = [
    [/<title>[^<]+<\/title>/, "title"],
    [/<meta name="description" content="[^"]+">/, "meta description"],
    [/<meta property="og:title" content="[^"]+">/, "Open Graph title"],
    [/<meta name="twitter:card" content="[^"]+">/, "Twitter card"],
    [/<main(?:\s|>)/, "main landmark"],
    [/<nav class="breadcrumbs" aria-label="Breadcrumb">|<main[^>]+id="main-content"[^>]*>\s*<section class="hero/, "breadcrumb or homepage hero"]
  ];
  requiredPatterns.forEach(([pattern, label]) => { if (!pattern.test(markup)) failures.push(`${page}: missing ${label}`); });
  if (/href="tel:/.test(markup)) failures.push(`${page}: public phone link found`);

  for (const match of markup.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(match[1]); } catch (error) { failures.push(`${page}: invalid JSON-LD (${error.message})`); }
  }

  for (const match of markup.matchAll(localReferencePattern)) {
    const reference = match[1];
    if (/^(?:https?:|mailto:|data:)/.test(reference)) continue;
    const cleanReference = reference.split("?")[0];
    if (!cleanReference) continue;
    try { await access(path.resolve(rootDirectory, cleanReference)); } catch { failures.push(`${page}: missing local reference ${cleanReference}`); }
  }
}

const robots = await readFile(path.join(rootDirectory, "robots.txt"), "utf8");
const sitemap = await readFile(path.join(rootDirectory, "sitemap.xml"), "utf8");
if (!/Sitemap:\s+https:\/\//.test(robots)) failures.push("robots.txt: missing absolute sitemap URL");
if (!/<urlset[^>]+sitemaps\.org/.test(sitemap)) failures.push("sitemap.xml: invalid urlset declaration");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated metadata, structured data, landmarks, IDs, and local references across ${pages.length} HTML pages.`);
}
