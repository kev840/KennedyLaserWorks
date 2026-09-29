# Kennedy Laser Works — RC1 Launch Checklist

Certification date: July 22, 2026

Release candidate: RC1

Production origin: `https://kennedylaserworks.com`

## Release decision

✔ The website code is ready to deploy as an RC1 build. Automated validation, responsive browser testing, keyboard interaction testing, image loading checks, and local Lighthouse audits are complete.

Production launch remains conditional on completing the host- and business-owned tasks under **Remaining manual tasks** and confirming the deployed HTTPS build with the post-deployment checks below.

## Completed items

### Code and behavior

- ✔ Reviewed all nine HTML documents, all CSS bundles, and all JavaScript files.
- ✔ Removed unused placeholder artwork and reduced duplicated/dead presentation rules.
- ✔ Verified 65 active Etsy listings, 21 populated catalog categories, and 130 optimized product image files.
- ✔ Verified all local page, stylesheet, script, image, icon, and font references.
- ✔ Verified JavaScript syntax for every source and validation script.
- ✔ Confirmed no horizontal overflow, missing primary landmarks, broken images, or hidden loaded images across the responsive test matrix.
- ✔ Confirmed the browser console is clean during the final interaction pass.
- ✔ Confirmed progressive images settle correctly on cold loads and cached reloads.
- ✔ Confirmed image error fallbacks remove loading states and preserve the layout.
- ✔ Added a branded, useful `404.html` page with `noindex` metadata.
- ✔ Added and documented local font files and licenses.
- ✔ Split homepage and collection-specific CSS from shared styles to reduce route cost.
- ✔ Optimized high-impact raster and logo assets while retaining fallbacks.
- ✔ Removed unused large placeholder image files from the release.
- ✔ Added stronger repository validators for metadata, headings, structured data, links, image dimensions, canonical URLs, social metadata, the no-JavaScript class, and sitemap membership.

### User experience

- ✔ Responsive navigation opens, closes with Escape, locks background scrolling, and restores focus.
- ✔ Catalog search supports multiple data fields, practical typo matching, highlighted terms, live counts, active filter indicators, and URL state.
- ✔ Product filters, clear controls, and mobile filter disclosure work without removing existing functionality.
- ✔ Quick View includes product details, personalization guidance, timing guidance, local pickup information, Etsy checkout, and related products.
- ✔ Quick View and the image lightbox open smoothly, close with Escape, retain keyboard navigation, and restore focus.
- ✔ Product and related-product images maintain their aspect ratio without stretching.
- ✔ Contact and custom-project forms use native validation, sensible length limits, current minimum dates, clear status messaging, and no public phone field.
- ✔ Motion remains restrained and `prefers-reduced-motion` is respected.
- ✔ Touch controls and catalog filter checkboxes meet comfortable mobile sizing.

### Accessibility

- ✔ One primary `main` landmark exists on every page.
- ✔ Skip links, navigation labels, heading hierarchy, form labels, accessible names, live regions, and dialog labels were reviewed.
- ✔ Dialog focus containment, Escape behavior, and focus restoration were tested.
- ✔ Color contrast fixes were applied to trust, pickup, and catalog-category treatments.
- ✔ Loaded imagery is not left hidden, transparent, blurred, or covered by a loading state.
- ✔ Meaningful images have alt text; decorative marks are hidden from assistive technology.
- ✔ JavaScript-disabled pages retain readable content and visible imagery.

### SEO

- ✔ Every canonical page has a unique title and meta description.
- ✔ Canonicals, Open Graph URLs, Open Graph images, Twitter cards, and social images use the production origin.
- ✔ Local business and breadcrumb structured data are present where appropriate.
- ✔ `sitemap.xml` contains exactly the eight indexable canonical pages and no query-string filter URLs.
- ✔ `robots.txt` references the production sitemap.
- ✔ The 404 page is excluded from indexing.
- ✔ Breadcrumb navigation is present on interior pages.

### Security and privacy review

- ✔ External new-window links use `noopener`/`noreferrer` where applicable.
- ✔ Catalog content is escaped before insertion into HTML.
- ✔ Forms use browser validation and bounded text fields before sending a Basin inquiry.
- ✔ No secrets, payment fields, authentication data, or customer data stores are present in the static site.
- ✔ Checkout remains on Etsy rather than being imitated locally.
- ✔ Modal focus management was tested for keyboard traps.

## Responsive and manual test coverage

The final page matrix covered all nine pages at these viewport widths:

- ✔ 320 px
- ✔ 360 px
- ✔ 390 px
- ✔ 412 px
- ✔ 768 px
- ✔ 1024 px
- ✔ 1440 px
- ✔ 1920 px

Result: 72 of 72 page/width combinations passed the automated layout smoke test with no horizontal overflow, missing primary landmarks, broken loaded images, or hidden loaded images.

Customer journeys exercised:

- ✔ First visit from the homepage to collections and Etsy.
- ✔ Returning catalog visitor using filters and URL state.
- ✔ Christmas ornament discovery using typo-tolerant search.
- ✔ Wedding, memorial, patriotic, home décor, and custom-work filtering.
- ✔ Quick View, related product, and lightbox flows.
- ✔ Mobile navigation and narrow-screen catalog browsing.
- ✔ Slow/lazy image loading followed by cached refresh behavior.
- ✔ Keyboard-only navigation through menus, dialogs, lightbox controls, and forms.
- ✔ Custom inquiry validation and file-selection flows.
- ✔ Branded 404 recovery path.

## Lighthouse results

Local Lighthouse was run against the static RC1 build. The local test server intentionally does not provide production compression, long-lived caching, HTTP/2 or HTTP/3, or CDN delivery, so production scores must be confirmed after deployment.

| Page / run | Performance | Accessibility | Best Practices | SEO | Key metrics |
| --- | ---: | ---: | ---: | ---: | --- |
| Homepage, best verified RC1 run | 99 | 100 | 100 | 100 | LCP 2.0 s, TBT 0 ms, CLS 0 |
| Homepage, complete controlled local-mirror run | 95 | 100 | 100 | 100 | LCP 2.7 s, TBT 0 ms, CLS 0 |
| Collections, final critical-CSS run | 98 | 100 | 100 | 100 | LCP 2.0 s, TBT 0 ms, CLS 0.004 |

The requested 98/100/100/100 target is achieved for the catalog and in the best verified homepage run. Because homepage performance varies on the network-backed local environment, the launch gate is the median of three Lighthouse runs against the production HTTPS URL, with production caching and compression enabled.

## Remaining manual tasks

### Required before public launch

- [ ] Confirm the final domain, DNS records, HTTPS certificate, and `www`/apex redirect policy.
- [ ] Configure the host to return `404.html` with an actual HTTP 404 status.
- [ ] Enable Brotli or gzip compression for HTML, CSS, JavaScript, SVG, JSON, and fonts.
- [ ] Set version-aware long-lived caching for immutable images and fonts; keep HTML and catalog JSON refreshable.
- [ ] Add production security headers: Content-Security-Policy, Referrer-Policy, X-Content-Type-Options, and Permissions-Policy. Add HSTS only after HTTPS and redirect behavior are confirmed.
- [ ] Test the deployed site on a case-sensitive host so file-path capitalization cannot fail.
- [ ] Verify the Etsy shop, every sampled listing, Facebook page, and email address from the deployed site.
- [ ] Confirm local-pickup wording, production-time guidance, pricing-snapshot date, and any pickup discount directly with the business owner.
- [ ] Obtain business/legal review of `privacy.html` and `terms.html`; the current copy is practical website content, not legal advice.
- [ ] Run three mobile and three desktop Lighthouse audits on the production HTTPS URL and record the median results.
- [ ] Submit the deployed sitemap in Google Search Console and confirm robots/canonical indexing behavior.

### Genuine business assets that would improve trust

No visible artwork placeholders remain; current public artwork uses genuine supplied product or workshop imagery. The following are optional content upgrades and must use real, approved business assets:

- [ ] Add a dedicated maker portrait when one is supplied; do not label product or workshop photography as a portrait.
- [ ] Add more workshop/process photography showing design, laser work, assembly, painting, sanding, and hand finishing.
- [ ] Add alternate product/gallery photographs for individual listings where available.
- [ ] Add verified product-specific dimensions, materials, and normal production ranges to the catalog data.
- [ ] Replace generic short catalog summaries with approved product-specific descriptions.
- [ ] Add customer quotations only with permission and a verifiable source; until then, keep reviews linked to current Etsy feedback.

## Known limitations

- Contact and custom-project forms send multipart inquiries and reference files to Basin through BasinJS. The production public Turnstile site key is present on both forms; production submission testing remains open.
- Each form accepts up to five JPG, PNG, WEBP, or PDF reference files of 10 MB or less per file; Basin handles the uploads.
- Etsy remains the authoritative source for current pricing, variants, inventory, shipping, checkout, and verified reviews.
- Most catalog products currently have one approved primary image, so lightbox navigation only becomes multi-image when additional gallery data is supplied.
- Product dimensions, material details, and item-specific production times are omitted when not verified rather than invented.
- Local static-server Lighthouse runs do not measure production cache, compression, CDN, or TLS behavior.
- `content-visibility` is a progressive performance enhancement; unsupported browsers receive the full layout without losing content.

## Browser compatibility

Supported production baseline:

- Current and previous major Chrome releases.
- Current and previous major Microsoft Edge releases.
- Current and previous major Firefox releases.
- Current and previous major Safari releases on macOS and iOS.
- Safari 15.4 or newer for native dialog behavior.

Graceful fallbacks are present for reduced motion, missing IntersectionObserver support, JavaScript-disabled browsing, unavailable WebP sources, and unsupported progressive CSS enhancements. A physical iPhone/iPad and one macOS Safari device should still be included in the post-deployment smoke test.

## Deployment checklist

- [ ] Deploy from the certified RC1 commit with a clean working tree.
- [ ] Preserve the repository directory structure and file-name casing.
- [ ] Configure HTTPS, redirects, compression, caching, MIME types, 404 handling, and security headers.
- [ ] Confirm the production origin in canonicals, social metadata, structured data, sitemap, and robots output.
- [ ] Open all eight canonical URLs and the 404 route directly.
- [ ] Confirm CSS, JavaScript, local fonts, the logo mark, product JSON, and product images return HTTP 200.
- [ ] Confirm invalid URLs return HTTP 404 rather than a soft-404 HTTP 200.
- [ ] Exercise search, each filter group, active chips, clear filters, Quick View, related products, and lightbox controls.
- [ ] Submit both inquiry forms from the production domain and verify Basin notifications, file attachments, and on-page success/error states.
- [ ] Test every footer/navigation link and a representative sample of Etsy product links.
- [ ] Check browser console and network panel for errors, mixed content, redirects, or missing assets.
- [ ] Run Lighthouse three times per target page and record median mobile results.
- [ ] Verify at 320, 390, 768, 1024, 1440, and 1920 px on the deployed build.
- [ ] Verify keyboard-only navigation, visible focus, Escape behavior, and focus restoration.
- [ ] Verify on a throttled mobile connection and with a warm browser cache.
- [ ] Submit `sitemap.xml`, request indexing for the homepage, and monitor Search Console after launch.

## Post-launch monitoring

- [ ] Recheck Etsy links and the catalog snapshot on a regular schedule.
- [ ] Monitor 404s, console errors, Core Web Vitals, and Search Console coverage.
- [ ] Refresh seasonal ordering and catalog metadata when products change.
- [ ] Revalidate the site after every content, asset, domain, or hosting change.

## Suggested future enhancements

- Review Basin submission notifications and export customer records as needed; do not treat the form inbox as permanent storage.
- Automate catalog verification against an approved source while keeping Etsy authoritative.
- Add responsive image widths/AVIF variants if the product photography source set expands.
- Add consented, source-linked testimonials and richer project case studies when genuine material is available.
- Add privacy-respecting analytics only after defining a real measurement need and updating privacy disclosures.

## Final RC1 acceptance

- ✔ Automated site validation passes.
- ✔ Catalog validation passes.
- ✔ JavaScript syntax validation passes.
- ✔ Git whitespace/error validation passes.
- ✔ Responsive matrix passes 72/72 combinations.
- ✔ Browser console is clean in the final tested journeys.
- ✔ Accessibility and SEO local audit categories score 100.
- ✔ No known code-level release blocker remains.

RC1 is approved for deployment, subject to the required host configuration and live-URL verification tasks above.
