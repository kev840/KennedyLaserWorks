import { access, readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = (await readdir(rootDirectory)).filter((file) => file.endsWith(".html"));
const failures = [];
const localReferencePattern = /(?:href|src)="([^"#]+)"/g;
const externalLinks = new Set();
const productionOrigin = "https://kennedylaserworks.com";
const canonicalUrls = new Set();

for (const page of pages) {
  const markup = await readFile(path.join(rootDirectory, page), "utf8");
  const isNonIndexablePage = /<meta name="robots" content="noindex,follow">/.test(markup);
  const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicateIds.length) failures.push(`${page}: duplicate IDs (${duplicateIds.join(", ")})`);

  const requiredPatterns = [
    [/<title>[^<]+<\/title>/, "title"],
    [/<meta name="description" content="[^"]+">/, "meta description"],
    [/<meta property="og:title" content="[^"]+">/, "Open Graph title"],
    [/<meta name="theme-color" content="#[0-9a-fA-F]{6}">/, "theme color"],
    [/<main(?:\s|>)/, "main landmark"],
    [/<nav class="breadcrumbs" aria-label="Breadcrumb">|<main[^>]+id="main-content"[^>]*>\s*<section class="hero/, "breadcrumb or homepage hero"]
  ];
  requiredPatterns.forEach(([pattern, label]) => { if (!pattern.test(markup)) failures.push(`${page}: missing ${label}`); });
  if (!/<html[^>]+class="no-js"/.test(markup) || !/classList\.replace\("no-js",\s*"js"\)/.test(markup)) failures.push(`${page}: missing resilient JavaScript capability class`);
  if (/replace with production|add the production|add the final production/i.test(markup)) failures.push(`${page}: unresolved deployment placeholder comment`);
  if (isNonIndexablePage) {
    if (page === "404.html" && !/<meta name="robots" content="noindex,follow">/.test(markup)) failures.push("404.html: missing noindex directive");
  } else {
    const expectedCanonical = `${productionOrigin}${page === "index.html" ? "/" : `/${page}`}`;
    const canonical = markup.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
    if (canonical !== expectedCanonical) failures.push(`${page}: canonical must be ${expectedCanonical}`);
    if (canonicalUrls.has(canonical)) failures.push(`${page}: duplicate canonical ${canonical}`);
    canonicalUrls.add(canonical);
    if (!markup.includes(`<meta property="og:url" content="${expectedCanonical}">`)) failures.push(`${page}: missing absolute Open Graph URL`);
    const ogImage = markup.match(/<meta property="og:image" content="([^"]+)">/)?.[1];
    const twitterImage = markup.match(/<meta name="twitter:image" content="([^"]+)">/)?.[1];
    if (!ogImage?.startsWith(`${productionOrigin}/`)) failures.push(`${page}: Open Graph image must be absolute`);
    if (twitterImage !== ogImage) failures.push(`${page}: Twitter image must match the Open Graph image`);
    if (!/<meta name="twitter:card" content="summary_large_image">/.test(markup)) failures.push(`${page}: missing Twitter card`);
  }
  if (/href="tel:/.test(markup)) failures.push(`${page}: public phone link found`);

  for (const match of markup.matchAll(/<img\b[^>]*>/g)) {
    const image = match[0];
    if (!/\salt="[^"]*"/.test(image)) failures.push(`${page}: image missing alt text`);
    if (!/\swidth="\d+"/.test(image) || !/\sheight="\d+"/.test(image)) failures.push(`${page}: image missing intrinsic dimensions`);
  }

  for (const match of markup.matchAll(/<a\b[^>]*href="(https?:[^"]+)"[^>]*>/g)) {
    const link = match[0];
    try { externalLinks.add(new URL(match[1]).origin); } catch { failures.push(`${page}: invalid external URL ${match[1]}`); }
    if (/target="_blank"/.test(link) && !/rel="[^"]*noopener[^"]*"/.test(link)) failures.push(`${page}: external new-tab link missing noopener`);
  }

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
if (/<loc>[^<]*\?/.test(sitemap)) failures.push("sitemap.xml: filtered query URLs should not compete with the canonical collection page");
for (const canonical of canonicalUrls) {
  if (!sitemap.includes(`<loc>${canonical}</loc>`)) failures.push(`sitemap.xml: missing canonical URL ${canonical}`);
}

for (const file of await readdir(path.join(rootDirectory, "css"))) {
  if (!file.endsWith(".css")) continue;
  const stylesheet = await readFile(path.join(rootDirectory, "css", file), "utf8");
  for (const match of stylesheet.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    if (/^(?:data:|https?:)/.test(match[1])) continue;
    try { await access(path.resolve(rootDirectory, "css", match[1])); } catch { failures.push(`css/${file}: missing local asset ${match[1]}`); }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated metadata, structured data, headings, images, links, IDs, and local references across ${pages.length} HTML pages (${externalLinks.size} external origins).`);
}
