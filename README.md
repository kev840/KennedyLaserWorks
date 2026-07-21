# Kennedy Laser Works

Production-oriented static website for Kennedy Laser Works, a made-to-order laser engraving and cutting business in Budd Lake, New Jersey.

## Architecture

- Eight semantic HTML pages with one visual system and consistent navigation/footer
- `css/style.css`: design tokens and foundational components
- `css/pages.css`: interior-page, catalog, form, and content components
- `css/responsive.css`: tablet and mobile layout changes
- `css/animations.css`: restrained motion with reduced-motion support
- `js/navigation.js`: accessible mobile navigation and sticky-header state
- `js/app.js`: reveal behavior, rotating featured collection, and copyright year
- `js/seasonal.js`: documented month-to-promotion homepage schedule
- `js/catalog.js`: JSON-backed search, filters, product rendering, and missing-image handling
- `js/form.js`: transparent mailto quote-request workflow
- `data/products.json`: replaceable product records
- `data/categories.json`: catalog taxonomy

## Preview locally

The JSON catalog must be served over HTTP because browsers normally block `fetch()` from `file://` pages.

From the repository root, run either:

```text
python -m http.server 8000
```

or any static-site preview server, then open `http://localhost:8000/`. Opening `index.html` directly still displays every page, but the collections grid shows a helpful server-required message.

## Update product data

Edit `data/products.json`. Each record supports `id`, `title`, `shortDescription`, `priceDisplay`, `etsyUrl`, `primaryImage`, `alternateImages`, `categories`, `occasions`, `recipients`, `seasons`, `tags`, `personalized`, `customAvailable`, `featured`, `customerFavorite`, `dateAdded`, `active`, and `sample`.

Use verified listing titles, prices, images, and Etsy URLs. Set `sample` to `false` only for verified records. See `docs/CATALOG_IMPORT.md`.

## Seasonal rotation

The `seasonalSchedule` object in `js/seasonal.js` maps every calendar month to a label, headline, and three collection links. Edit that object to shift promotion lead times without changing homepage HTML. All collections remain accessible in `collections.html` regardless of seasonal promotion.

## Replace sample content

The catalog records currently have `sample: true` and are visibly labeled. Replace them with verified Etsy records, then remove unused sample images only after confirming no page references them. Reviews remain an explicit empty state until verified Etsy reviews are supplied.

## Deployment

This is a framework-free static site and can be hosted on GitHub Pages, Netlify, Cloudflare Pages, Vercel static hosting, conventional cPanel hosting, or another static host. Confirm the production domain and uncomment/add canonical tags before launch. See `docs/DEPLOYMENT.md`.

## GoDaddy Website Builder limitations

GoDaddy Website Builder generally does not provide direct deployment of an arbitrary multi-file static site with custom JSON and JavaScript architecture. Rebuilding this site inside its visual editor would lose the maintainable file structure and may limit catalog filtering, source control, and deployment automation. If the domain remains registered at GoDaddy, it can point to a separate static host through DNS. Conventional GoDaddy web hosting with file upload is different from Website Builder and may host these files.

## Recommended hosting

GitHub Pages is suitable for a simple public repository workflow. Netlify or Cloudflare Pages are recommended when preview deployments, redirects, custom headers, or easy form integrations may be useful later. Checkout should continue on Etsy.
