# Kennedy Laser Works — Phase 1 audit findings

Audit source commit: `45499bf04ff3a0dffe626e5e345e795bbb4d1d69`. Repository files are the source of truth; the live homepage was also checked on 2026-10-18. This is an editorial and usability review, not an implementation.

## Coverage and counts

- 76 customer-facing pages inspected: 66 generated product pages and 10 other pages. The fallback product template was inspected separately.
- 9 custom-project detail records inspected in `data/custom-projects.json`; three have proposed copy changes.
- 118 individually reviewable proposals. 33 carry exact previously approved wording or behavior; 71 fall under previously approved Edit 5 and have been reviewed individually; 14 are new findings.
- 66 product body descriptions have proposed edits. The Heritage Family Name Plaque now has a separately reviewable new proposal; its source content remains unchanged. Five additional product SEO descriptions have separate proposals.

## Phase 2 decision record

The October 18 owner export is preserved byte-for-byte in `owner-decisions-source.json`. Its 118 decisions include 87 approved suggestions, two rejected suggestions, 27 custom alternatives (25 pending final approval), and two undecided items. All IDs, source fingerprints, custom text, and notes match the current audit. `preserved-decisions.json` adds proofread alternatives and functional implementation plans while retaining the owner's original text and final-approval status. `phase2-approval-review.md` presents all 25 pending alternatives for comparison. The review app opens on items needing attention, and every decision remains in exports.

## Issue categories

| Category | Suggestions |
|---|---:|
| Gallery narration | 72 |
| Voice | 20 |
| Navigation | 9 |
| Redundancy | 6 |
| Forced links | 5 |
| Layout | 3 |
| Product clarity | 2 |
| Imagery | 1 |

## Page-by-page breakdown

The individual originals, proposals, reasons, warnings, and source fingerprints are in `audit-data.json` and the review app. A zero means inspected with no proposed change.

| Page | Source | Suggestions |
|---|---|---:|
| Home | index.html | 1 |
| Collections | collections.html | 3 |
| Custom Work | custom-work.html | 11 |
| Reviews | reviews.html | 2 |
| About | about.html | 12 |
| Contact | contact.html | 8 |
| Custom Projects | custom-projects.html | 4 |
| Privacy | privacy.html | 0 |
| Terms | terms.html | 0 |
| Page not found | 404.html | 0 |
| Product fallback template | product.html | 0 |
| Personalized Heritage Family Name Plaque | data/products.json → products/personalized-heritage-family-name-plaque.html | 2 |
| Shamrock Door Hanger | data/products.json → products/shamrock-door-hanger-1862372498.html | 1 |
| Sláinte Shamrock Wall Hanging | data/products.json → products/slainte-shamrock-wall-hanging-1862376778.html | 1 |
| Kiss Me I'm Irish Sign | data/products.json → products/kiss-me-i-m-irish-sign-1877180521.html | 1 |
| Lucky Clover Door Hanger | data/products.json → products/lucky-clover-door-hanger-1866684180.html | 1 |
| Shenanigans Shamrock Sign | data/products.json → products/shenanigans-shamrock-sign-1866686448.html | 1 |
| Shamrock Door Corner Pair | data/products.json → products/shamrock-door-corner-pair-1876924045.html | 1 |
| Easter Bunny Welcome Sign | data/products.json → products/easter-bunny-welcome-sign-1882522569.html | 1 |
| Easter Bunny Door Hanger | data/products.json → products/easter-bunny-door-hanger-1883039621.html | 1 |
| Carrot Bunny Welcome Sign | data/products.json → products/carrot-bunny-welcome-sign-1870389588.html | 1 |
| He Is Risen Easter Sign | data/products.json → products/he-is-risen-easter-sign-1868853834.html | 1 |
| Spring Bunny Door Hanger | data/products.json → products/spring-bunny-door-hanger-1870390726.html | 1 |
| Hip Hop Easter Sign | data/products.json → products/hip-hop-easter-sign-1884571887.html | 1 |
| Easter Chick Sign | data/products.json → products/easter-chick-sign-1870393112.html | 1 |
| Personalized Wooden Rose | data/products.json → products/personalized-wooden-rose-1861595697.html | 2 |
| Personalized Rose & Heart Stand | data/products.json → products/personalized-rose-heart-stand-1848995784.html | 1 |
| Wooden Rose Bouquet & Vase | data/products.json → products/wooden-rose-bouquet-vase-1850465654.html | 1 |
| Personalized Wooden Flower Bouquet | data/products.json → products/personalized-wooden-flower-bouquet-1850475366.html | 2 |
| Personalized Mom Sunflower Sign | data/products.json → products/personalized-mom-sunflower-sign-1885903579.html | 1 |
| Personalized Valentine Gift Card Holder | data/products.json → products/personalized-valentine-gift-card-holder-1870692117.html | 1 |
| Custom Rose Vase | data/products.json → products/custom-rose-vase-1849696848.html | 1 |
| Personalized Sunshine Sign | data/products.json → products/personalized-sunshine-sign-1884780928.html | 1 |
| Cedar Anniversary Plaque | data/products.json → products/cedar-anniversary-plaque-1532033461.html | 1 |
| Personalized Acacia Cutting Board | data/products.json → products/personalized-acacia-cutting-board-1788982364.html | 1 |
| Cherry Wood Scripture Plaque | data/products.json → products/cherry-wood-scripture-plaque-1883936482.html | 1 |
| Baby's First Christmas Ornament | data/products.json → products/baby-s-first-christmas-ornament-4419416776.html | 1 |
| Baby Birth Stats Christmas Plaque | data/products.json → products/baby-birth-stats-christmas-plaque-4419409067.html | 1 |
| Christmas Red Truck Sign | data/products.json → products/christmas-red-truck-sign-4416978452.html | 1 |
| Santa & Tree Christmas Sign | data/products.json → products/santa-tree-christmas-sign-4416978641.html | 1 |
| Santa Stop Here Sign | data/products.json → products/santa-stop-here-sign-4416967967.html | 1 |
| Winter Cabin Christmas Sign | data/products.json → products/winter-cabin-christmas-sign-4416948895.html | 1 |
| JOY Christmas Wreath Sign | data/products.json → products/joy-christmas-wreath-sign-4416934607.html | 1 |
| Gingerbread House Welcome Sign | data/products.json → products/gingerbread-house-welcome-sign-4387533985.html | 1 |
| Gingerbread Mug Ornament | data/products.json → products/gingerbread-mug-ornament-4388098488.html | 1 |
| Scripture Cross Ornament | data/products.json → products/scripture-cross-ornament-4411996661.html | 2 |
| Personalized Snowflake Ornament | data/products.json → products/personalized-snowflake-ornament-1803229743.html | 1 |
| Hand-Painted Santa Ornament | data/products.json → products/hand-painted-santa-ornament-1812525171.html | 2 |
| Multi-Layer Year Ornament | data/products.json → products/multi-layer-year-ornament-1789669600.html | 1 |
| Trump “Daddy's Home” Ornament | data/products.json → products/trump-daddy-s-home-ornament-1822156267.html | 1 |
| Trump 2024 Ornament | data/products.json → products/trump-2024-ornament-1822162411.html | 1 |
| Laser-Cut Wooden Decorative Box | data/products.json → products/laser-cut-wooden-decorative-box-1807980228.html | 1 |
| Personalized Memorial Angel Wings Ornament | data/products.json → products/personalized-memorial-angel-wings-ornament-1788571932.html | 1 |
| Personalized Reindeer Ornament | data/products.json → products/personalized-reindeer-ornament-1802696847.html | 1 |
| Star-Inspired Sci-Fi Sign | data/products.json → products/star-inspired-sci-fi-sign-4358215881.html | 1 |
| Dark Galactic Helmet Art | data/products.json → products/dark-galactic-helmet-art-4358161160.html | 1 |
| Astromech Droid Wall Art | data/products.json → products/astromech-droid-wall-art-4358199201.html | 1 |
| Galactic Soldier Helmet Sign | data/products.json → products/galactic-soldier-helmet-sign-4358191831.html | 1 |
| Bounty Hunter Helmet Wall Art | data/products.json → products/bounty-hunter-helmet-wall-art-4358139752.html | 1 |
| Hello Fall Coffee Sign | data/products.json → products/hello-fall-coffee-sign-4369100262.html | 1 |
| Hello Fall Pumpkin Sign | data/products.json → products/hello-fall-pumpkin-sign-4369106717.html | 1 |
| Buffalo Plaid Pumpkin Sign | data/products.json → products/buffalo-plaid-pumpkin-sign-4367356545.html | 1 |
| Welcome Fall Truck Sign | data/products.json → products/welcome-fall-truck-sign-4358228565.html | 1 |
| Home Sweet Haunted Home Sign | data/products.json → products/home-sweet-haunted-home-sign-4365036709.html | 1 |
| Trick or Treat Ghost Sign | data/products.json → products/trick-or-treat-ghost-sign-4365034883.html | 1 |
| Halloween Spider & Bat Welcome Sign | data/products.json → products/halloween-spider-bat-welcome-sign-4365032439.html | 1 |
| Haunted House Welcome Sign | data/products.json → products/haunted-house-welcome-sign-4365030081.html | 1 |
| Salem Broom Co. Sign | data/products.json → products/salem-broom-co-sign-4363030172.html | 1 |
| Gothic Spider Web Welcome Sign | data/products.json → products/gothic-spider-web-welcome-sign-4363024932.html | 1 |
| Coastal Adirondack Relax Sign | data/products.json → products/coastal-adirondack-relax-sign-4363044963.html | 1 |
| Dental Office Welcome Sign | data/products.json → products/dental-office-welcome-sign-1894832635.html | 1 |
| Lavender Om Lotus Wall Art | data/products.json → products/lavender-om-lotus-wall-art-1879838368.html | 1 |
| F-Bomb Desk Accessory | data/products.json → products/f-bomb-desk-accessory-1877081874.html | 1 |
| Cash Is King Business Sign | data/products.json → products/cash-is-king-business-sign-1876931456.html | 1 |
| Personalized Thin Blue Line Plaque | data/products.json → products/personalized-thin-blue-line-plaque-1788479534.html | 1 |
| Personalized Sports Phone Holder | data/products.json → products/personalized-sports-phone-holder-1800371919.html | 1 |
| Custom Engraved Pencils | data/products.json → products/custom-engraved-pencils-1535491922.html | 2 |
| Home / Collections | Cross-page or generated project detail | 1 |
| Shared footer | Cross-page or generated project detail | 1 |
| Custom Projects: The Wisloffs Family Heritage Sign | Cross-page or generated project detail | 1 |
| Custom Projects: Squirtle | Cross-page or generated project detail | 1 |
| Custom Projects: Dundon Thank-You Plaque | Cross-page or generated project detail | 1 |

## Findings that drive the recommendations

1. **Photo narration is widespread.** 64 of 66 catalog long descriptions contain terms such as “gallery,” “photo,” “photographed,” or “example.” Each product was reviewed individually; all 66 body descriptions have a proposed change, including the owner’s five named products. Five SEO descriptions independently refer to photographs. Generated product HTML comes from `data/products.json`, so later approved copy changes belong there before regeneration.
2. **Several page sections repeat or force unrelated product links.** About repeats its craftsmanship/process points; Reviews has a redundant explanation and unrelated product links; Custom Work and Custom Projects include explanatory links that interrupt the page’s purpose. The owner-approved About, Contact, and Reviews changes are preserved as atomic decisions. Natural catalog and related-product links remain available.
3. **Custom Work category pills are inert.** Seven `<li>` labels appear in pill styling but have no link/action. Destination proposals use existing catalog filters or the inquiry form. The owner requested a broader Holidays destination; its catalog membership awaits review and final approval.
4. **The current catalog anchor offset is smaller than requested.** `css/showroom.css` uses `scroll-margin-top: calc(var(--header-height) + 1rem)`. The owner-approved proposal adjusts the homepage-category landing position without changing filters or grid behavior.
5. **The Heritage card’s first hover uses gallery image 2.** `js/catalog.js` uses `gallery[1]`; image 2 is an unfinished board. The owner requested image 6. That image shows the finished plaque held in front of its digital design; the holder’s identity is not proven by the photo.
6. **Contact’s route is visually diluted.** Three alternative contact cards appear before the website form, and multiple links sit beside it. The owner-approved plan moves the unchanged Basin form immediately below a shorter hero. The direct-email route in the footer, Privacy, and Terms needs a separate policy decision if it is ever changed.

## Claims and choices requiring confirmation

- Confirm the currently supported name, color, wording, year, sport, and accessory options noted on product items against the live Etsy listings before publishing changes.
- For the Heritage hover image, photo 6 visibly shows a hand holding the finished plaque; the holder’s identity is unverified.
- The owner chose a broad Holidays destination for the Holiday decor pill. Confirm final product membership, especially general fall, political, and patriotic pieces, before adding the new category.
- Confirm whether the one-of-a-kind gifts pill should lead to the inquiry form.
- Confirm whether local-pickup inquiries should exclusively use the website form or retain direct email as an alternate route.
- Confirm the 10% local pickup discount and nationwide shipping eligibility before changing policy or promise language. No policy edit is proposed.

Item-specific warnings:

- **Personalized Heritage Family Name Plaque — Collections card first hover photograph:** The photo visibly includes a hand holding the plaque; the person’s identity is not verifiable from the image. Do not describe the holder as the owner without confirmation.
- **Shamrock Door Hanger — Product description:** Owner wording mentions a front door. Confirm exterior suitability before publishing that wording.
- **Spring Bunny Door Hanger — Product description:** The owner’s wording mentions a front door. The catalog does not establish weather resistance or outdoor suitability; confirm placement guidance before publishing.
- **Personalized Wooden Rose — Product description:** Name and color options require confirmation against the active Etsy listing.
- **Wooden Rose Bouquet & Vase — Product description:** Exact heart wording options require confirmation against the active Etsy listing.
- **Personalized Wooden Flower Bouquet — Product description:** Available flower colors and personalization options require confirmation.
- **Personalized Acacia Cutting Board — Product description:** The original references an established date only in the pictured example; verify whether that date can be ordered.
- **Cherry Wood Scripture Plaque — Product description:** Owner specifically requested customer-supplied scripture; verify any text-length, licensing, and layout limits before publishing.
- **Baby's First Christmas Ornament — Product description:** Verify that both name and year are currently offered.
- **Baby Birth Stats Christmas Plaque — Product description:** Verify which birth details are currently supported.
- **Multi-Layer Year Ornament — Product description:** The gallery shows more than one year, but current year choices are not established in the catalog; verify the live listing before publishing.
- **Trump “Daddy's Home” Ornament — Product description:** The catalog title refers to 2024, while the primary photograph appears to show 2025. Verify the active listing and exact year before publishing copy.
- **Personalized Memorial Angel Wings Ornament — Product description:** Verify current memorial personalization and color choices. The owner’s wording specifies a name plus birth and passing dates. The current catalog confirms personalization but does not specify those exact fields; confirm the live listing before publishing.
- **Dental Office Welcome Sign — Product description:** The owner’s wording says the practice name can be customized. The current catalog does not list personalization for this product; confirm that option before publishing.
- **Cash Is King Business Sign — Product description:** Confirm the sign’s exact printed wording against the product photographs.
- **Personalized Sports Phone Holder — Product description:** Verify current sport silhouette choices.
- **Custom Engraved Pencils — Product description:** Verify whether the wooden case is included or optional.
- **Personalized Wooden Rose — SEO description:** Name and color options require confirmation against the active Etsy listing. The catalog confirms a name in the design but not specifically in the stem; the statement that the piece will never fade also needs review before publishing.
- **Personalized Wooden Flower Bouquet — SEO description:** Available flower colors and personalization options require confirmation. “Will last forever” is the owner's original wording and is a literal durability claim; review or soften it before publishing.
- **Custom Engraved Pencils — SEO description:** Verify whether the wooden case is included or optional.
- **Custom Work — Project category: Holiday decor:** There is currently no Holidays category. Review the proposed membership across St. Patrick’s Day, Easter, Valentine’s Day, Mother’s Day, Father’s Day, Halloween/fall, and Christmas/winter. Keep general fall, political, and patriotic pieces only where they genuinely fit.
- **Custom Work — Project category: One-of-a-kind gifts:** Destination is the inquiry form, not a filtered catalog. Confirm this matches owner intent.
- **Contact — Local pickup button:** The current button opens email. Owner-approved Edit 9 says the website form is the main contact route; confirm whether email should remain an alternate pickup route.

## What remains untouched

The production HTML, catalog, generator, scripts, styles, policies, forms, SEO metadata, Etsy links, and deployed website were not edited in Phase 1. The proposals are in the separate `audit/website-copy-review` directory. No changes were committed, pushed, or deployed.
