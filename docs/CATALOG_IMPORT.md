# Catalog Refresh Guide

## Current source and provenance

The current `data/products.json` snapshot was captured from the public Kennedy Laser Works Etsy shop on 2026-07-22 with the shop owner's permission. It contains 65 unique active listings.

For each listing, the capture verified:

- Etsy listing ID and exact public URL
- full Etsy card title
- displayed price
- primary listing image
- active presence in the shop's complete two-page inventory

Concise display titles and taxonomy are editorial website fields. They do not replace the original title, which remains preserved as `etsyTitle`.

## Refresh procedure

1. Capture every active shop page and record a snapshot date.
2. Verify the listing count and uniqueness by Etsy listing ID and URL.
3. Preserve the exact Etsy title, displayed price, listing URL, and primary image source.
4. Update concise display titles only when they remain faithful to the listing.
5. Assign category, occasion, recipient, and season slugs from `data/categories.json` based only on listing evidence.
6. Set personalization or custom availability only when the listing title or verified listing details support it.
7. Download the owner's listing photographs and generate local WebP and JPEG variants.
8. Remove inactive products rather than leaving dead Etsy links in the public collection.
9. Update `catalogSnapshotDate` and each `priceSnapshotDate` together.
10. Run `node scripts/validate-catalog.mjs`, then test search, filters, quick-view, and Etsy links through HTTP.

## Pricing policy

Website prices are a dated static snapshot, never a promise. Etsy is the final authority for current price, variations, availability, shipping, and checkout.

## Categories with no current match

Taxonomy can retain useful future categories, but the public filter menu is generated only from categories used by active listings. This prevents empty or fabricated collections. In this snapshot, no active listing could be truthfully classified as a pet memorial or graduation/retirement product.

## Reviews and favorites

Do not invent review text, ratings, customer names, or customer-favorite badges. The site links to Etsy for current verified feedback. `customerFavorite` remains `null` unless a reliable source supports the claim.
