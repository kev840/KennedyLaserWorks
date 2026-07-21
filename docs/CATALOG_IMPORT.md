# Catalog Import Guide

The current catalog proves the interface with explicitly labeled sample records. Do not remove the sample label until a record has been verified against a current Etsy listing.

## Import checklist

1. Export or collect current Etsy listing data with permission.
2. Copy optimized listing images into `assets/images/products/`.
3. Add one object per listing to `data/products.json`.
4. Use the exact current Etsy listing URL and displayed price.
5. Assign taxonomy values found in `data/categories.json`.
6. Set `active: true` only for available listings.
7. Set `sample: false` only after title, price, URL, and imagery are verified.
8. Preview through a local HTTP server and test every filter and external link.

## Reviews

Replace the review empty state only with verified customer review text. Record the Etsy source URL, review date, rating, and product context internally. Do not alter meaning, invent names, or publish private customer details. The current placeholder cards in `reviews.html` are structural only and are visibly labeled.

## Removing samples

Sample records can be deleted directly from the `products` array without changing HTML or JavaScript. Remove sample image files only after a repository-wide reference check.
