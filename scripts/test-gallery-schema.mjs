import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(path.join(root, "js", "product-gallery.js"), "utf8");
const galleryStyles = await readFile(path.join(root, "css", "collections.css"), "utf8");
const preloaded = [];
class TestImage {
  set src(value) { preloaded.push(value); }
}
const context = { window: {}, Image: TestImage };
vm.createContext(context);
vm.runInContext(source, context);
const tools = context.window.KLWProductGallery;

const product = {
  displayTitle: "Gallery Test Product",
  primaryImage: "assets/images/products/test.webp",
  imageFallback: "assets/images/products/test.jpg",
  imageWidth: 900,
  imageHeight: 700,
  images: ["assets/images/products/test.webp", "assets/images/products/test-02.webp", "assets/images/products/test-03.webp"],
  imageFallbacks: ["assets/images/products/test.jpg", "assets/images/products/test-02.jpg", "assets/images/products/test-03.jpg"],
  imageMetadata: [
    { width: 900, height: 700, alt: "Primary view", rank: 1 },
    { width: 700, height: 900, alt: "Second view", rank: 2 },
    { width: 800, height: 800, alt: "Third view", rank: 3 }
  ]
};

const gallery = tools.images(product);
assert.equal(gallery.length, 3, "All canonical gallery images should be retained.");
assert.deepEqual(gallery.map((image) => image.rank), [1, 2, 3], "Gallery order should match stored Etsy rank.");
assert.equal(gallery[1].fallback, product.imageFallbacks[1], "Fallback arrays should remain index-aligned.");
assert.equal(gallery[1].width, 700, "Per-image intrinsic dimensions should be retained.");
assert.match(tools.picture(gallery[1]), /loading="lazy"/);
assert.match(tools.picture(gallery[1]), /width="700" height="900"/);
assert.match(tools.picture(gallery[1], { decorative: true }), /alt=""/);

tools.preloadNext(gallery, 0);
assert.deepEqual(preloaded, [gallery[1].webp], "Only the immediately following image should preload.");

const legacy = tools.images({ displayTitle: "Legacy", primaryImage: "legacy.webp", imageFallback: "legacy.jpg", imageWidth: 794, imageHeight: 794, alternateImages: [] });
assert.equal(legacy.length, 1, "Single-image legacy products should remain unchanged.");
assert.equal(legacy[0].fallback, "legacy.jpg");

assert.match(galleryStyles, /\.quick-view__main-image picture\s*\{[^}]*display:\s*grid[^}]*min-height:\s*0/s, "Quick View pictures must establish a stable, constrained viewport.");
assert.match(galleryStyles, /\.quick-view__main-image img\s*\{[^}]*object-fit:\s*contain[^}]*object-position:\s*center/s, "Quick View images must remain fully visible and centered.");
assert.match(galleryStyles, /\.product-detail__zoom img\s*\{[^}]*object-fit:\s*contain[^}]*object-position:\s*center/s, "Product-detail images must remain fully visible and centered.");
assert.match(galleryStyles, /\.product-lightbox img\s*\{[^}]*object-fit:\s*contain[^}]*object-position:\s*center/s, "Lightbox images must remain fully visible and centered.");
assert.doesNotMatch(galleryStyles, /(?:quick-view__main-image|product-detail__zoom|product-lightbox)[^{]*\{[^}]*object-fit:\s*cover/s, "Full-size gallery images must never use cover cropping.");

console.log("Validated canonical multi-image galleries, uncropped contain-mode presentation, next-image preloading, and single-image backward compatibility.");
