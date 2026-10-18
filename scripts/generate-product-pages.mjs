import { readFile, writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { productPath } from "./product-url.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = (process.env.SITE_URL || "https://kennedylaserworks.com").replace(/\/$/, "");
const catalog = JSON.parse(await readFile(path.join(root, "data/products.json"), "utf8"));
const categories = JSON.parse(await readFile(path.join(root, "data/categories.json"), "utf8"));
const labels = new Map(categories.categories.map(({ slug, label }) => [slug, label]));
const products = catalog.products.filter((item) => item.active && item.listingStatus === "active");
const template = await readFile(path.join(root, "product.html"), "utf8");
const escape = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
const summary = (item) => item.shortDescription?.trim() || `${item.displayTitle} from Kennedy Laser Works.`;
const title = (item) => `${item.seoTitle || item.displayTitle} | Kennedy Laser Works`;
const description = (item) => item.seoDescription?.trim() || `${summary(item)} Handcrafted in Budd Lake, New Jersey by Kennedy Laser Works.`;
const image = (item, index) => ({
  webp: item.images[index], fallback: item.imageFallbacks[index],
  alt: item.imageMetadata[index]?.alt || `${item.displayTitle}${index ? ` — view ${index + 1}` : ""}`,
  width: item.imageMetadata[index]?.width || item.imageWidth || 794,
  height: item.imageMetadata[index]?.height || item.imageHeight || 794
});
const picture = (value, decorative = false, loading = "lazy") => `<picture${decorative ? ' aria-hidden="true"' : ""}><source srcset="${escape(value.webp)}" type="image/webp"><img class="progressive-image" src="${escape(value.fallback)}" alt="${decorative ? "" : escape(value.alt)}" loading="${loading}" decoding="async" width="${value.width}" height="${value.height}"${decorative ? ' aria-hidden="true"' : ""}></picture>`;
const factRows = (item) => [
  item.bestFor && ["Best for", item.bestFor],
  item.personalizationGuidance ? ["Personalization", item.personalizationGuidance] : item.personalized === true && ["Personalization", "Available; see Etsy for current choices."],
  item.variantOverview && ["Options", item.variantOverview],
  item.dimensions && ["Dimensions", Array.isArray(item.dimensions) ? item.dimensions.join(", ") : item.dimensions],
  item.materials && ["Materials", Array.isArray(item.materials) ? item.materials.join(", ") : item.materials],
  item.displayUse && ["Display", item.displayUse],
  item.productionInformation && ["Production", item.productionInformation],
  ["Local pickup", "Available by advance arrangement in Budd Lake, New Jersey. Contact us before ordering."]
].filter(Boolean).map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join("");
const intersectionCount = (left = [], right = []) => left.filter((value) => right.includes(value)).length;
const recommendationScore = (source, candidate) => (
  intersectionCount(source.categories, candidate.categories) * 5
  + intersectionCount(source.seasons, candidate.seasons) * 4
  + intersectionCount(source.occasions, candidate.occasions) * 3
  + intersectionCount(source.recipients, candidate.recipients) * 3
  + intersectionCount(source.tags, candidate.tags)
);
// Build the related-product graph once, then give underlinked products a place
// on the most relevant existing product pages. Every link is present in HTML.
const relatedById = new Map(products.map((source) => [source.id, products
  .filter((candidate) => candidate.id !== source.id)
  .map((candidate) => ({ candidate, score: recommendationScore(source, candidate) }))
  .filter(({ score }) => score > 0)
  .sort((left, right) => right.score - left.score || left.candidate.displayTitle.localeCompare(right.candidate.displayTitle))
  .slice(0, 4)
  .map(({ candidate }) => candidate.id)
]));
// Distinctive pieces need links from pages a shopper would actually compare.
// These pairings use photographed design or intended use rather than broad tags.
const curatedLinks = [
  ["Personalized Wooden Rose", "Personalized Wooden Flower Bouquet"],
  ["Wooden Rose Bouquet & Vase", "Personalized Wooden Flower Bouquet"],
  ["Custom Engraved Pencils", "Laser-Cut Wooden Decorative Box"],
  ["F-Bomb Desk Accessory", "Laser-Cut Wooden Decorative Box"],
  ["Personalized Snowflake Ornament", "Multi-Layer Year Ornament"],
  ["Hand-Painted Santa Ornament", "Multi-Layer Year Ornament"],
  ["Lavender Om Lotus Wall Art", "Coastal Adirondack Relax Sign"],
  ["Welcome Fall Truck Sign", "Coastal Adirondack Relax Sign"],
  ["Cherry Wood Scripture Plaque", "Scripture Cross Ornament"],
  ["He Is Risen Easter Sign", "Scripture Cross Ornament"],
  ["Scripture Cross Ornament", "He Is Risen Easter Sign"],
  ["Gingerbread House Welcome Sign", "Gingerbread Mug Ornament"],
  ["Santa & Tree Christmas Sign", "Gingerbread Mug Ornament"]
];
for (const [sourceName, targetName] of curatedLinks) {
  const source = products.find((item) => item.displayTitle === sourceName);
  const target = products.find((item) => item.displayTitle === targetName);
  if (!source || !target) throw new Error(`Missing curated related product: ${sourceName} → ${targetName}`);
  const ids = relatedById.get(source.id);
  if (ids.includes(target.id)) continue;
  const weakest = ids.map((id) => ({ id, score: recommendationScore(source, products.find((item) => item.id === id)) }))
    .sort((left, right) => left.score - right.score || left.id.localeCompare(right.id))[0];
  if (!weakest) throw new Error(`No related slot for ${sourceName}`);
  ids[ids.indexOf(weakest.id)] = target.id;
}
const inbound = new Map(products.map((item) => [item.id, 0]));
for (const ids of relatedById.values()) for (const id of ids) inbound.set(id, inbound.get(id) + 1);
for (const target of products) {
  while (inbound.get(target.id) < 2) {
    const choices = products
      .filter((source) => source.id !== target.id && !relatedById.get(source.id).includes(target.id) && recommendationScore(source, target) > 0)
      .flatMap((source) => relatedById.get(source.id)
        .filter((id) => inbound.get(id) > 2)
        .map((replaceId) => ({ source, replaceId, targetScore: recommendationScore(source, target), replacedScore: recommendationScore(source, products.find((item) => item.id === replaceId)) })))
      .sort((left, right) => right.targetScore - left.targetScore || left.replacedScore - right.replacedScore || left.source.displayTitle.localeCompare(right.source.displayTitle));
    if (!choices.length) throw new Error(`Cannot give ${target.displayTitle} two relevant incoming product links.`);
    const { source, replaceId } = choices[0];
    const ids = relatedById.get(source.id);
    ids[ids.indexOf(replaceId)] = target.id;
    inbound.set(replaceId, inbound.get(replaceId) - 1);
    inbound.set(target.id, inbound.get(target.id) + 1);
  }
}
const relatedMarkup = (item) => {
  const related = relatedById.get(item.id).map((id) => products.find((other) => other.id === id));
  if (!related.length) return "";
  return `<section class="section product-related" aria-labelledby="related-title"><div class="container"><p class="section-kicker">More handcrafted pieces</p><h2 id="related-title">You May Also Like</h2><div class="product-related__grid">${related.map((other) => `<a href="${escape(productPath(other).slice(1))}">${picture(image(other, 0))}<span><small>${escape(labels.get(other.categories[0]) || other.categories[0])}</small>${escape(other.displayTitle)}</span></a>`).join("")}</div></div></section>`;
};
const body = (item) => {
  const gallery = item.images.map((_, index) => image(item, index));
  return `<div class="container product-detail__layout"><section class="product-detail__gallery" aria-label="${escape(item.displayTitle)} image gallery" data-product-gallery><div class="product-detail__main"><button class="product-detail__zoom" type="button" data-open-lightbox="0" aria-label="${gallery.length > 1 ? "View all photos for" : "View photo of"} ${escape(item.displayTitle)}">${picture(gallery[0], false, "eager")}<span>${gallery.length > 1 ? "View All Photos" : "View Photo"}</span></button>${gallery.length > 1 ? `<button class="gallery-arrow gallery-arrow--previous" type="button" data-gallery-prev aria-label="Previous product image">←</button><button class="gallery-arrow gallery-arrow--next" type="button" data-gallery-next aria-label="Next product image">→</button><span class="gallery-position" data-gallery-position aria-live="polite">1 of ${gallery.length}</span>` : ""}</div>${gallery.length > 1 ? `<div class="product-detail__thumbnails" aria-label="Choose a product image">${gallery.map((value, index) => `<button type="button" data-gallery-index="${index}" class="${index === 0 ? "is-current" : ""}" aria-label="Show image ${index + 1} of ${gallery.length}" aria-pressed="${index === 0}">${picture(value, true)}</button>`).join("")}</div>` : ""}</section><article class="product-detail__copy"><p class="section-kicker">${escape(labels.get(item.categories[0]) || item.categories[0])}</p><h1>${escape(item.displayTitle)}</h1><p class="product-detail__description">${escape(summary(item))}</p>${item.longDescription && item.longDescription !== summary(item) ? `<p>${escape(item.longDescription)}</p>` : ""}<p class="product-detail__price">${escape(item.priceSummary || "See Etsy for current pricing, options, and availability.")}</p><dl class="quick-view__facts">${factRows(item)}</dl><div class="product-detail__actions"><a class="button button--forest" href="${escape(item.etsyUrl)}" target="_blank" rel="noopener">${escape(item.purchaseLabel || "Purchase on Etsy")} <span aria-hidden="true">↗</span></a>${item.customAvailable === true ? '<a class="arrow-link" href="custom-work.html#inquiry">Request a custom quote <span aria-hidden="true">→</span></a>' : ""}<a class="arrow-link" href="contact.html">Ask a question <span aria-hidden="true">→</span></a></div></article></div>${relatedMarkup(item)}`;
};

const breadcrumbSchema = (item, canonical) => ({
  "@type": "BreadcrumbList",
  "@id": `${canonical}#breadcrumb`,
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${base}/` },
    { "@type": "ListItem", position: 2, name: "Collections", item: `${base}/collections.html` },
    { "@type": "ListItem", position: 3, name: item.displayTitle, item: canonical }
  ]
});

const pageSchema = (item, canonical) => {
  const common = {
    "@id": `${canonical}#primary`,
    name: item.displayTitle,
    description: item.structuredOffer ? summary(item) : description(item),
    image: item.images.map((source) => `${base}/${source}`),
    url: canonical
  };
  if (item.structuredOffer) {
    return {
      "@type": "Product",
      ...common,
      brand: { "@type": "Brand", name: "Kennedy Laser Works" },
      material: Array.isArray(item.materials) ? item.materials.join(", ") : item.materials,
      offers: {
        "@type": "Offer",
        url: item.etsyUrl,
        priceCurrency: item.structuredOffer.priceCurrency,
        price: item.structuredOffer.price,
        availability: item.structuredOffer.availability
      }
    };
  }
  return {
    "@type": "WebPage",
    ...common,
    isPartOf: { "@type": "WebSite", "@id": `${base}/#website`, name: "Kennedy Laser Works", url: `${base}/` },
    breadcrumb: { "@id": `${canonical}#breadcrumb` }
  };
};

const slugs = products.map(productPath);
if (new Set(slugs).size !== slugs.length) throw new Error("Duplicate product slug");
if (new Set(products.map(title)).size !== products.length) throw new Error("Duplicate product page title");
const directory = path.join(root, "products");
await mkdir(directory, { recursive: true });
for (const item of products) {
  const urlPath = productPath(item);
  const canonical = `${base}${urlPath}`;
  const socialImage = `${base}/${item.primaryImage}`;
  const schema = { "@context": "https://schema.org", "@graph": [pageSchema(item, canonical), breadcrumbSchema(item, canonical)] };
  const rendered = template
    .replace("<!doctype html>", "<!-- Generated from data/products.json by scripts/generate-product-pages.mjs. -->\n<!doctype html>")
    .replace('<meta name="viewport"', '<base href="../">\n  <meta name="viewport"')
    .replace('<title>Product Details | Kennedy Laser Works</title>', `<title>${escape(title(item))}</title>`)
    .replace(/<meta name="description" content="[^"]+">/, `<meta name="description" content="${escape(description(item))}">\n  <link rel="canonical" href="${canonical}">`)
    .replace('<meta name="robots" content="noindex,follow">', '<meta name="robots" content="index,follow">')
    .replace(/<meta property="og:title" content="[^"]+">/, `<meta property="og:title" content="${escape(title(item))}">`)
    .replace(/<meta property="og:description" content="[^"]+">/, `<meta property="og:description" content="${escape(description(item))}">`)
    .replace('<meta property="og:type" content="website">', `<meta property="og:type" content="product">\n  <meta property="og:url" content="${canonical}">`)
    .replace(/<meta property="og:image" content="[^"]+">/, `<meta property="og:image" content="${socialImage}">`)
    .replace(/<meta name="twitter:title" content="[^"]+">/, `<meta name="twitter:title" content="${escape(title(item))}">`)
    .replace(/<meta name="twitter:description" content="[^"]+">/, `<meta name="twitter:description" content="${escape(description(item))}">`)
    .replace(/<meta name="twitter:image" content="[^"]+">/, `<meta name="twitter:image" content="${socialImage}">\n  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>`)
    .replace('<span data-product-crumb>Product details</span>', `<span data-product-crumb>${escape(item.displayTitle)}</span>`)
    .replace('<div data-product-page aria-live="polite"><div class="container product-detail__loading"><p>Loading handcrafted piece…</p></div></div>', `<div data-product-page data-static-product-id="${escape(item.id)}">${body(item)}</div>`);
  await writeFile(path.join(root, urlPath.slice(1)), rendered, "utf8");
}
for (const file of await readdir(directory)) {
  if (file.endsWith(".html") && !slugs.includes(`/products/${file}`)) {
    const content = await readFile(path.join(directory, file), "utf8");
    if (content.startsWith("<!-- Generated from data/products.json by scripts/generate-product-pages.mjs. -->")) await unlink(path.join(directory, file));
  }
}
const collectionsPath = path.join(root, "collections.html");
const directoryStart = "<!-- PRODUCT_LINK_DIRECTORY_START -->";
const directoryEnd = "<!-- PRODUCT_LINK_DIRECTORY_END -->";
const directoryLinks = `<ul>${products.map((item) => `<li><a href="${escape(productPath(item).slice(1))}">${escape(item.displayTitle)}</a></li>`).join("")}</ul>`;
const spotlightCards = (names) => `<div class="seo-product-links">${names.map((name) => {
  const item = products.find((product) => product.displayTitle === name);
  if (!item) throw new Error(`Spotlight product is missing: ${name}`);
  return `<a href="${escape(productPath(item).slice(1))}">${picture(image(item, 0))}<span>${escape(item.displayTitle)}</span></a>`;
}).join("")}</div>`;
const replaceBlock = (html, start, end, markup) => {
  if (!html.includes(start) || !html.includes(end)) throw new Error(`Missing static product link markers: ${start}`);
  return html.replace(new RegExp(`${start}[\\s\\S]*?${end}`), `${start}\n          ${markup}\n          ${end}`);
};
const collections = await readFile(collectionsPath, "utf8");
const updatedCollections = replaceBlock(collections, directoryStart, directoryEnd, directoryLinks);
await writeFile(collectionsPath, updatedCollections, "utf8");
const homePath = path.join(root, "index.html");
const home = await readFile(homePath, "utf8");
await writeFile(homePath, replaceBlock(home, "<!-- HOME_PRODUCT_LINKS_START -->", "<!-- HOME_PRODUCT_LINKS_END -->",
  spotlightCards(["Personalized Heritage Family Name Plaque", "Baby Birth Stats Christmas Plaque", "Personalized Mom Sunflower Sign", "Astromech Droid Wall Art", "Cedar Anniversary Plaque", "Laser-Cut Wooden Decorative Box"])), "utf8");
console.log(`Generated ${products.length} static product pages.`);
