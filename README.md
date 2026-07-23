# Kennedy Laser Works

Production-oriented static website for Kennedy Laser Works, a made-to-order laser engraving and cutting business in Budd Lake, New Jersey.

## Current catalog

The catalog contains all 65 active Etsy listings captured on 2026-07-22. Every product record includes the verified Etsy listing title, a concise display title, displayed price snapshot, exact listing URL, an ordered image gallery, taxonomy, and only those personalization/custom flags supported by the listing title.

Product photography is stored locally as ordered optimized WebP galleries with aligned JPEG fallbacks and intrinsic dimensions. The first image remains the catalog-card image. Checkout, current options, and final pricing remain on Etsy.

## Architecture

- Eight canonical HTML pages, a data-backed non-indexed product detail page, and a branded non-indexed 404 page
- `css/style.css`: design tokens and foundational components
- `css/pages.css`: catalog, quick-view, seasonal, form, and interior-page components
- `css/responsive.css`: tablet and mobile layout changes
- `css/animations.css`: restrained motion with reduced-motion support
- `js/app.js`: progressive image state, reduced-motion-aware reveal behavior, and copyright year
- `js/seasonal.js`: one homepage data request that supplies seasonal products, collection tiles, featured designs, and custom-work examples
- `js/product-gallery.js`: shared ordered-image normalization, picture markup, and next-image preloading
- `js/catalog.js`: JSON-backed search, compound filters, URL state, card hover galleries, Quick View, lightbox, and ItemList schema
- `js/product.js`: dedicated product gallery, swipe/keyboard controls, lightbox, related products, and Product schema
- `data/products.json`: verified listing snapshot
- `data/categories.json`: reusable category taxonomy
- `scripts/import-etsy-catalog.mjs`: Etsy Open API import, ordered image download, JPEG/WebP optimization, and atomic catalog updates
- `scripts/validate-catalog.mjs`: catalog, ordered gallery, claim, and local-path validation

## Preview locally

The catalog uses `fetch()`, so serve the site over HTTP from the repository root:

```text
python -m http.server 8000
```

Then open `http://localhost:8000/`.

## Validate

Run:

```text
npm run validate
```

The validators check the expected 65 unique active listings, price snapshot consistency, Etsy URL/ID matching, taxonomy, ordered gallery metadata, every local JPEG/WebP variant, public sample language, the no-public-phone rule, metadata, and local HTML references.

## Catalog behavior

Visitors can search across display titles, full Etsy titles, descriptions, categories, occasions, recipients, and tags. Category, season, occasion, recipient, price, personalization, and custom-option filters can be combined. State is encoded in query parameters so a result set can be bookmarked or shared.

Cards retain the primary image and crossfade to the second image only on precise hover devices. Quick View and dedicated product details provide thumbnails, previous/next controls, keyboard navigation, swipe gestures, progressive loading, and a full-screen lightbox while Etsy remains the final destination for configuration and secure checkout. Prices are explicitly disclosed as a static snapshot.

## Homepage architecture

The homepage is arranged as a persuasive storefront while preserving the shared design system:

1. Product-led hero with Collections, Custom Work, and Etsy paths
2. Five service and fulfillment trust points
3. Four live seasonal products
4. Non-empty collection tiles with live product counts
5. Up to six verified customer favorites or editorially featured designs
6. Real-product custom-work showcase
7. Budd Lake process story and workshop photography
8. Meet the Maker preview
9. Etsy reputation, arranged local pickup, and final conversion choices

The hero uses one prioritized WebP/JPEG product image and two lazy-loaded supporting images. All imagery below the fold is lazy-loaded.

## Seasonal behavior

`js/seasonal.js` maps each month to a label, headline, introduction, and relevant category slugs. Broad utility categories such as Home Décor and Personalized Gifts do not outrank the specific seasonal categories. Product selection follows this order:

1. Editorially featured products matching the current season
2. Other matching products
3. Verified customer favorites, if such a flag is ever supported
4. Recently added products when `dateAdded` is available; otherwise stable catalog order

The final fallback prevents an empty homepage. Featured homepage designs come from `customerFavorite: true` when verified, followed by `featured: true`. The current snapshot has no verified customer-favorite flags, so the section is accurately titled “Customer Favorites and Featured Designs.”

## Homepage photography

Every public homepage image is real product or workshop photography already owned by Kennedy Laser Works. No visible artwork placeholders remain. A dedicated portrait of Kevin has not been supplied; the Meet the Maker preview therefore uses real finished-work photography, while the Budd Lake story uses the available workshop image.

## Reviews

The website does not reproduce or invent review text or ratings. Review calls-to-action lead to Etsy, where feedback remains connected to a verified purchase.

## Deployment

This framework-free site can be hosted on GitHub Pages, Netlify, Cloudflare Pages, Vercel static hosting, or conventional file hosting. Production canonicals, social metadata, crawler directives, and the sitemap use `https://kennedylaserworks.com`; update them together if the final domain changes. See `docs/DEPLOYMENT.md` and `docs/CATALOG_IMPORT.md`.
