# Phase 2 implementation record — October 18, 2026

The source of authority is `implementation-decisions.json`, an unchanged copy of the owner's final export. Its 118 stable decision IDs and source fingerprints were checked against base commit `45499bf04ff3a0dffe626e5e345e795bbb4d1d69` before editing. All source file hashes and fingerprints matched.

## Decisions

- Implemented 88 approved suggestions and 27 custom entries with final approval (115 items).
- Left `product-37-seo-description` unchanged because its final approval is pending.
- Preserved the two rejected items, `new-custom-projects-ending-repetition` and `new-shared-footer-slogan`.
- Applied 66 approved product descriptions and four approved product SEO decisions through `data/products.json`; regenerated all 66 product pages.
- Applied three custom project narrative changes through `data/custom-projects.json`.
- Linked seven Custom Work project pills, including a new Holidays catalog filter for 41 genuinely seasonal products. The broad Holidays category is excluded from related-product scoring to keep recommendations specific.
- Updated approved page copy and removals on Home, Collections, Custom Work, Custom Projects, About, Reviews, and Contact. Reused the existing contact form for the local pickup path; a preexisting message is never overwritten.

## Editorial and technical adaptations

- Three owner-approved SEO descriptions (`product-15-seo-description`, `product-18-seo-description`, and `product-35-seo-description`) exceeded the site's 170-character metadata limit. Their metadata was condensed to 154, 158, and 168 characters respectively, preserving the product details and intent. The full approved wording remains in the authoritative decision export.
- The rose and bouquet copy avoids absolute claims about fading or lasting forever; the wooden items can be described as never wilting or suitable for continued display.
- The approved Haunted House description has fewer than the prior arbitrary 24-word validation threshold. The distinctiveness minimum was lowered to 20 words while uniqueness, metadata, links, and generated-page checks remain in force.

## Verification

Site, catalog, product-page, and gallery-schema validators passed. All 66 generated pages passed unique-content, metadata, structured-data, incoming-link, and price-free display checks. JavaScript syntax and JSON parsing passed. `git diff --check` passed. Local Chromium checks at 1600×950, 768×1024, and 390×844 showed no horizontal overflow or browser exceptions; the desktop Collections hero measured 255px. The Holidays filter returned 41 products, a plaque search returned five, and the Contact pickup prompt preserved entered text. The existing Basin endpoint, BasinJS, Turnstile, file upload, and success handling were left intact. A live form submission was not attempted from localhost because production Turnstile may restrict it.

This implementation was committed locally only. It was not pushed or deployed.
