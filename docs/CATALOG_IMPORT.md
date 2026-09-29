# Catalog Refresh Guide

## Current source and provenance

The current `data/products.json` snapshot was captured from the public Kennedy Laser Works Etsy shop on 2026-07-22 with the shop owner's permission. It contains 65 unique active listings.

For each listing, the capture verified:

- Etsy listing ID and exact public URL
- full Etsy card title
- displayed price
- every listing image in Etsy rank order
- active presence in the shop's complete two-page inventory

Concise display titles and taxonomy are editorial website fields. They do not replace the original title, which remains preserved as `etsyTitle`.

## Refresh procedure

1. Register an Etsy application and keep its `keystring:shared_secret` value in the private `ETSY_API_KEY` environment variable. Never commit it.
2. Run `npm install` once to install the pinned image optimizer.
3. Run `npm run catalog:import` from the repository root.
4. The importer resolves the shop, verifies that active Etsy membership matches the curated catalog, retrieves every listing image, and sorts images by Etsy `rank`.
5. Each source photograph is downloaded once and converted into an optimized local JPEG fallback and responsive WebP with a maximum 1200-pixel edge.
6. The importer writes ordered `images`, `imageFallbacks`, and `imageMetadata` arrays. The first entry also remains `primaryImage` for backward compatibility.
7. Existing concise titles and editorial taxonomy remain intact. If Etsy contains a new or removed listing, the import stops with an exact reconciliation list rather than inventing categories.
8. After a successful import, run `npm run products:generate` to refresh static product pages and the sitemap, then `npm run validate`. Test cards, Quick View, a generated product page, thumbnails, arrows, swipe gestures, keyboard navigation, and the full-screen lightbox through HTTP.

Optional environment controls:

- `ETSY_SHOP_NAME` defaults to `KennedyLaserWorks`.
- `ETSY_SHOP_ID` skips shop-name lookup when the numeric ID is known.
- `ETSY_IMPORT_CONCURRENCY` controls parallel listing work from 1–6; the default is 3.
- `ETSY_IMAGE_MAX_EDGE` controls the optimized maximum edge from 794–2000 pixels; the default is 1200.

Use `npm run catalog:normalize-images` to migrate older single-image catalog records into the gallery schema without contacting Etsy. This compatibility command does not discover additional Etsy images.

Use `npm run catalog:import -- --dry-run` to retrieve and optimize into memory without replacing `data/products.json` or writing image files.

## Pricing policy

Website prices are a dated static snapshot, never a promise. Etsy is the final authority for current price, variations, availability, shipping, and checkout.

## Categories with no current match

Taxonomy can retain useful future categories, but the public filter menu is generated only from categories used by active listings. This prevents empty or fabricated collections. In this snapshot, no active listing could be truthfully classified as a pet memorial or graduation/retirement product.

## Reviews and favorites

Do not invent review text, ratings, customer names, or customer-favorite badges. The site links to Etsy for current verified feedback. `customerFavorite` remains `null` unless a reliable source supports the claim.
