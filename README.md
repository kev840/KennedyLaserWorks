# Kennedy Laser Works

Production-oriented static website for Kennedy Laser Works, a made-to-order laser engraving and cutting business in Budd Lake, New Jersey.

## Current catalog

Phase 4 imports all 65 active Etsy listings captured on 2026-07-22. Every product record includes the verified Etsy listing title, a concise display title, displayed price snapshot, exact listing URL, primary listing photograph, taxonomy, and only those personalization/custom flags supported by the listing title.

Product photography is stored locally as optimized WebP with an optimized JPEG fallback. Checkout, current options, and final pricing remain on Etsy.

## Architecture

- Eight semantic HTML pages with one responsive visual system
- `css/style.css`: design tokens and foundational components
- `css/pages.css`: catalog, quick-view, seasonal, form, and interior-page components
- `css/responsive.css`: tablet and mobile layout changes
- `css/animations.css`: restrained motion with reduced-motion support
- `js/app.js`: reveal behavior, rotating real-product feature, and copyright year
- `js/seasonal.js`: month-aware real-product promotion with documented fallbacks
- `js/catalog.js`: JSON-backed search, compound filters, URL state, filter chips, quick-view, and ItemList schema
- `data/products.json`: verified listing snapshot
- `data/categories.json`: reusable category taxonomy
- `scripts/validate-catalog.mjs`: catalog, image, claim, and local-path validation

## Preview locally

The catalog uses `fetch()`, so serve the site over HTTP from the repository root:

```text
python -m http.server 8000
```

Then open `http://localhost:8000/`.

## Validate

Run:

```text
node scripts/validate-catalog.mjs
```

The validator checks the expected 65 unique active listings, price snapshot consistency, Etsy URL/ID matching, taxonomy, all 130 local image variants, public sample language, the no-public-phone rule, and local HTML references.

## Catalog behavior

Visitors can search across display titles, full Etsy titles, descriptions, categories, occasions, recipients, and tags. Category, season, occasion, recipient, price, personalization, and custom-option filters can be combined. State is encoded in query parameters so a result set can be bookmarked or shared.

Quick-view dialogs keep discovery on-site while Etsy remains the final destination for configuration and secure checkout. Prices are explicitly disclosed as a static snapshot.

## Seasonal behavior

`js/seasonal.js` maps each month to three relevant category slugs. Product selection follows this order:

1. Editorially featured products matching the current season
2. Other matching products
3. Verified customer favorites, if such a flag is ever supported
4. Current Etsy catalog order

The final fallback prevents an empty homepage. No `dateAdded` or customer-favorite claims are made because those fields were not reliably available in the public listing capture.

## Reviews

The website does not reproduce or invent review text or ratings. Review calls-to-action lead to Etsy, where feedback remains connected to a verified purchase.

## Deployment

This framework-free site can be hosted on GitHub Pages, Netlify, Cloudflare Pages, Vercel static hosting, or conventional file hosting. Confirm the production domain and add canonical tags before launch. See `docs/DEPLOYMENT.md` and `docs/CATALOG_IMPORT.md`.
