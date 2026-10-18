// Builds the offline review data from the current catalog and hand-reviewed proposals.
// This script writes only inside audit/website-copy-review.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { productPath } from '../../scripts/product-url.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const base = 'https://kennedylaserworks.com';
const catalog = JSON.parse(await readFile(path.join(root, 'data/products.json'), 'utf8'));
const projects = JSON.parse(await readFile(path.join(root, 'data/custom-projects.json'), 'utf8'));
const fileCache = new Map();
const readSource = async (sourcePath) => {
  if (!fileCache.has(sourcePath)) fileCache.set(sourcePath, await readFile(path.join(root, sourcePath), 'utf8'));
  return fileCache.get(sourcePath);
};
const hash = (value) => createHash('sha256').update(value).digest('hex');
const items = [];
const pageInventory = [
  ['Home', 'index.html'], ['Collections', 'collections.html'], ['Custom Work', 'custom-work.html'],
  ['Reviews', 'reviews.html'], ['About', 'about.html'], ['Contact', 'contact.html'],
  ['Custom Projects', 'custom-projects.html'], ['Privacy', 'privacy.html'],
  ['Terms', 'terms.html'], ['Page not found', '404.html']
].map(([name, sourcePath]) => ({ name, url: `${base}/${sourcePath === 'index.html' ? '' : sourcePath}`, sourcePath, inspected: true }));
pageInventory.push({ name: 'Product fallback template', url: `${base}/product.html`, sourcePath: 'product.html', inspected: true, note: 'Template reviewed; current product URLs are pre-generated from data/products.json.' });

async function add({ id, page, url, section, category, type = 'text', sourcePath, sourceKey, original, proposed, reason, warning = '', priorApproval = '', scope = '' }) {
  if (items.some((item) => item.id === id)) throw new Error(`Duplicate item: ${id}`);
  const source = await readSource(sourcePath);
  let sourceLine = null;
  if (sourcePath.endsWith('.html') || sourcePath.endsWith('.js') || sourcePath.endsWith('.css')) {
    const token = sourceKey && source.includes(sourceKey) ? sourceKey : original;
    const at = source.indexOf(token);
    if (at >= 0) sourceLine = source.slice(0, at).split('\n').length;
  } else if (sourcePath.endsWith('.json')) {
    const at = source.indexOf(JSON.stringify(original).slice(1, -1));
    if (at >= 0) sourceLine = source.slice(0, at).split('\n').length;
  }
  if (!source.includes(original) && !(sourceKey && source.includes(sourceKey)) && !sourcePath.endsWith('.json')) {
    throw new Error(`Original missing in ${sourcePath}: ${id}`);
  }
  items.push({ id, page, url, section, category, type, original, proposed, reason, warning,
    priorApproval, scope, source: { path: sourcePath, key: sourceKey || '', line: sourceLine,
      fingerprint: hash(`${sourcePath}\n${sourceKey || ''}\n${original}`), fileSha256: hash(source) } });
}
const site = (id, page, sourcePath, section, category, original, proposed, reason, extra = {}) =>
  add({ id, page, url: `${base}/${sourcePath === 'index.html' ? '' : sourcePath}`, section, category,
    sourcePath, original, proposed, reason, ...extra });

// The nine owner-approved directions remain individually reversible. "scope" means
// the direction was approved, while this audit's newly drafted wording still needs review.
await site('approved-01-custom-headline', 'Custom Work', 'custom-work.html', 'Collaboration heading', 'Voice',
  'Your meaning guides the design.', "Have an Idea? Let's Make It Real.",
  'Owner-approved, more direct invitation.', { priorApproval: 'exact', sourceKey: 'id="collaboration-title"' });
await site('approved-02-collections-headline', 'Collections', 'collections.html', 'Hero heading', 'Voice',
  'Find a piece worth making yours.', 'Made by Hand. Personalized for You.',
  'Owner-approved replacement.', { priorApproval: 'exact', sourceKey: 'showroom-catalog-hero' });
await site('approved-02-collections-height', 'Collections', 'css/showroom.css', 'Hero height', 'Layout',
  '.page-hero.showroom-catalog-hero { padding: calc(var(--header-height) + 2.5rem) 0 2.5rem; }',
  'Make the Collections hero approximately 220–260px tall on desktop and adjust responsive sizing. Preserve filtering, search, counts, and catalog behavior.',
  'Owner-approved reduction of excess vertical space.', { type: 'layout', priorApproval: 'exact', url: `${base}/collections.html`, sourceKey: '.page-hero.showroom-catalog-hero' });
await site('approved-03-category-landing', 'Home / Collections', 'css/showroom.css', 'Category destination', 'Navigation',
  '#catalog { scroll-margin-top: calc(var(--header-height) + 1rem); }',
  'When a homepage category link opens a filtered Collections view, position the catalog about one-quarter viewport lower than it currently lands, while keeping the sticky header clear. Preserve filtering and the grid/sidebar.',
  'Owner-observed destination alignment issue; adjust the catalog anchor offset after checking responsive viewport behavior.',
  { type: 'behavior', priorApproval: 'exact', url: `${base}/collections.html#catalog` });
await add({ id: 'approved-04-heritage-hover', page: 'Personalized Heritage Family Name Plaque',
  url: `${base}/products/personalized-heritage-family-name-plaque.html`, section: 'Collections card first hover photograph',
  category: 'Imagery', type: 'behavior', sourcePath: 'js/catalog.js', sourceKey: 'gallery[1]',
  original: 'gallery[1]', proposed: 'For this one catalog card, use gallery image 6 of 7 (index 5) as the hover photograph. Keep the primary image and all seven gallery images in their existing order.',
  reason: 'The current first hover is an unfinished board; image 6 shows the finished plaque held in front of its digital design.',
  warning: 'The photo visibly includes a hand holding the plaque; the person’s identity is not verifiable from the image. Do not describe the holder as the owner without confirmation.', priorApproval: 'exact' });

// Edit 5: each product description was inspected. The approved *direction* is
// recorded below, but these specific new sentences are intentionally undecided.
const productRewrites = [
  'Celebrate the places that helped make your family yours. This cherry wood plaque brings a family name together with two to four hand-painted country flags and an optional established year, making it a meaningful wedding, anniversary, or housewarming gift.',
  'Welcome St. Patrick’s Day with a cheerful greeting at your entryway. This shamrock door hanger brings a bit of Irish spirit to seasonal decorating and makes a fun gift for someone who loves the holiday.',
  'Raise a toast to Irish heritage with a Sláinte wall hanging. Sláinte means “health,” so this piece brings a warm wish to your St. Patrick’s Day decorating or a gift for a friend who would appreciate it.',
  'Let your St. Patrick’s Day decorations show their sense of humor. The “Kiss Me I’m Irish” sign is a playful way to celebrate the holiday and share a laugh with guests.',
  'Set the mood for St. Patrick’s Day before guests even step inside. This clover-themed hanger adds a festive greeting to an entryway or holiday display.',
  'Start the St. Patrick’s Day shenanigans before the party does. This playful shamrock sign feels right at home in a festive gathering or beside the rest of your Irish holiday decorations.',
  'Frame an indoor doorway with a little Irish luck. These two shamrock corner accents give St. Patrick’s Day decorating a fresh spot beyond the usual wall sign.',
  'Give family and friends a sweet spring welcome. This Easter bunny sign adds a friendly greeting to an entryway or seasonal display without needing a special occasion beyond the holiday itself.',
  'Let the Easter bunny greet everyone who visits. This door hanger makes a cheerful addition to spring decorations and a fun gift for someone who loves celebrating Easter.',
  '“Every Bunny Welcome” says exactly what this Easter sign is for. Bring it into an entryway or family space where its playful message can welcome the season.',
  'Keep the message of Easter at the center of your seasonal decorating. This “He Is Risen” sign offers a meaningful way to celebrate the holiday at home or to give a faith-centered gift.',
  'Welcome spring with a bunny sign that can stay up beyond Easter morning. Its friendly greeting suits an entryway, a family room, or a springtime gift.',
  'Let the Easter decorations have a little fun. The bright “Hip Hop” message makes this sign a playful choice for a family celebration or a gift for someone who loves the season.',
  'That little “hi” is enough to make a spring display feel cheerful. This Easter chick sign brings a lighthearted welcome to a room or a gift for someone who enjoys seasonal decor.',
  'Flowers are lovely, but a rose with their name on it feels especially personal. This laser-cut wooden rose makes a sweet gift for Valentine’s Day, a birthday, or just because. Check Etsy for the name and color choices currently offered.',
  'Put a heartfelt message where someone can see it every day. This personalized rose-and-heart stand makes a small, meaningful gift for Valentine’s Day, an anniversary, or anyone you want to remind that they are loved.',
  'Give roses with a message that can stay on display. This wooden bouquet and vase pairs roses with hearts that can carry personalized wording, making it a thoughtful Valentine’s Day or anniversary gift. Confirm the wording choices currently offered on Etsy.',
  'Brighten someone’s day with flowers made to stay on display beyond the occasion. This personalized wooden bouquet is a cheerful birthday, Mother’s Day, or just-because gift. See Etsy for the design and personalization choices currently offered.',
  'Tell Mom she is your sunshine in a way she can put on display. This personalized sunflower sign turns a familiar sentiment into a Mother’s Day keepsake with wording chosen for her.',
  'Make a gift card feel more personal this Valentine’s Day. This wooden holder gives your card a place beside an engraved message, so the presentation becomes part of the gift. Check Etsy for current wording choices.',
  'Say something meaningful with roses and words chosen for the person receiving them. This wooden rose vase display suits Valentine’s Day, an anniversary, or a just-because gift; check Etsy for the wording choices currently offered.',
  'For the grandma, mom, or aunt who brightens your days, a personalized sunshine sign says it with a smile. Give it for Mother’s Day, a birthday, or simply to remind her how much she means to you.',
  'An anniversary is more than a number. This engraved cedar plaque gives a shared milestone a place in the home and makes a personal gift for the person who has lived every day of it with you.',
  'A family name can turn a useful kitchen piece into a gift with a story. This custom-engraved acacia cutting board is well suited to weddings, housewarmings, and anniversaries. Confirm the name and date choices currently offered on Etsy.',
  'Choose a scripture or Bible passage that speaks to the person receiving this cherry wood plaque. You can supply the passage you would like engraved; Psalm 91 is simply the example shown. Confirm text length and layout details before ordering.',
  'Mark a baby’s first Christmas with a keepsake for the family tree. This ornament can carry a name and year, giving parents or grandparents a small reminder of a very big holiday.',
  'A first Christmas deserves its own place among the family keepsakes. This standing plaque brings a baby’s name and birth details together in a display that can come out again each holiday season. Confirm which details can be personalized before ordering.',
  'The red truck carrying a tree makes this sign feel like Christmas is on its way. Bring it into a family room or holiday display for a familiar, cheerful seasonal scene.',
  'Give your Christmas decorating a little storybook cheer. This Santa-and-tree sign makes a welcoming piece for a family space where the holiday excitement is already building.',
  'Make Santa feel expected. The “Santa Stop Here” sign is a playful addition to Christmas decorating, especially for a home with little ones watching for his arrival.',
  'For anyone who loves a quiet winter scene, this cabin sign brings that feeling into Christmas decorating. It makes a welcoming addition to a cozy room or a gift for someone who looks forward to the season all year.',
  'Put a simple note of joy into your Christmas decorating. This wooden wreath sign gives the familiar word a prominent place in a holiday display or a gift for someone who loves traditional seasonal pieces.',
  'Welcome guests with all the charm of a gingerbread house, minus the baking. This Christmas sign brings a playful holiday greeting to a family room or entryway.',
  'Give the tree a little gingerbread cheer. This wooden mug ornament makes a sweet addition to a family’s Christmas collection or a small gift for someone who loves holiday treats.',
  'Make room for a quiet expression of faith on the Christmas tree. These wooden cross ornaments pair short scripture or faith-themed words with a design that can be given as a meaningful holiday gift. See Etsy for the versions currently offered.',
  'A name makes a Christmas ornament feel like it belongs to one particular person. This personalized snowflake can become part of a family tradition or a small gift for someone you want to remember each holiday season.',
  'A Santa ornament with a name and year makes a fun annual keepsake. This hand-painted piece can brighten a holiday display or become a personal stocking stuffer; check Etsy for current options.',
  'Remember a year that mattered with a place for it on the Christmas tree. This layered ornament pairs the year with a winter cabin scene; check Etsy for the years currently offered.',
  'For someone who enjoys political keepsakes with a sense of humor, this “Daddy’s Home” ornament makes a conversation piece on the tree. Check the Etsy listing for the exact year and design currently offered.',
  'For a Trump supporter who collects election memorabilia, this engraved wooden ornament offers a way to mark the 2024 campaign at Christmas. It makes a distinctive gift for someone whose holiday collection reflects that moment.',
  'Give pens, small supplies, or keepsakes a place of their own. This laser-cut wooden box brings tree motifs to a desk or shelf and makes a useful small gift for someone who appreciates handmade details.',
  'Keep a loved one’s memory close during the holidays. This angel-wings ornament offers a gentle place for a remembrance message and can become part of an annual Christmas tradition. Confirm current personalization and color choices on Etsy.',
  'Put a familiar name on a very cheerful reindeer. This painted wooden ornament makes a playful gift for a child or a personal addition to a family holiday display; check Etsy for current name choices.',
  'Turn a fan room into a little tribute to a favorite space saga. This layered wood sign adds a bold focal point for someone who likes their sci-fi collectibles out where they can be enjoyed.',
  'For the fan who keeps one foot on the dark side, this helmet wall art brings a familiar sci-fi mood to a media room or game space. It gives a favorite villain a place beyond the screen.',
  'Give your favorite little droid a place in the room. This layered astromech wall art adds character to a game space, themed bedroom, or display of sci-fi favorites.',
  'A sci-fi collection could use an unmistakable helmet at its center. This layered galactic soldier sign brings a bold fan favorite to a wall without needing a whole galaxy of space.',
  'A playful nod to the galaxy’s most determined bounty hunters, this helmet wall art makes a striking piece for a fan’s room or collection. Pair it with other sci-fi favorites or let it have the wall to itself.',
  'If fall mornings mean hot coffee and crisp air to you, this “Hello Fall” sign fits right in. Bring it into a kitchen or seasonal display to welcome the coziest part of the year.',
  'Welcome pumpkin season with a sign that feels cheerful rather than spooky. This “Hello Fall” piece makes an easy starting point for decorating an entryway or family room for autumn.',
  'For the person who waits all year for cider, sweaters, and falling leaves, this plaid pumpkin sign says fall has arrived. Give it a place with your autumn decor or gift it to a fellow fall enthusiast.',
  'Make autumn decorating feel like a trip to the pumpkin patch. The “Welcome Fall” truck sign brings a warm seasonal greeting to a room or entryway.',
  'Your Halloween decorating can have a little haunted-house humor without losing its homey feel. This “Home Sweet Haunted Home” sign is ready to join a playful spooky-season display.',
  'Set a playful mood for Halloween before the trick-or-treaters arrive. This ghost sign brings a familiar holiday greeting to an indoor entryway or party display.',
  'Give the entryway a theatrical Halloween warning. “Enter If You Dare” makes this spider-and-bat sign a fun choice for a spooky party or seasonal display.',
  'Guests have been warned—and welcomed. This haunted-house sign adds a mischievous “Enter at Your Own Risk” message to Halloween decorating.',
  'Imagine a little broom shop in Salem that only opens in October. This “Salem Broom Co.” sign brings that playful witchy story to a Halloween display or a gift for someone who loves the season.',
  'For Halloween decorating that leans spooky rather than silly, this spider-web welcome sign sets the tone. It makes a dramatic greeting for an indoor entryway or themed gathering.',
  'Bring that “sit and unwind” feeling into a room you use every day. This Adirondack chair sign suits a coastal-inspired space or a gift for someone who is happiest near the water.',
  'Make patients feel welcome before they take a seat. This smiling-tooth sign gives a dental office a friendly touch that children and adults can enjoy.',
  'Create a quiet focal point in a yoga or meditation space. This lavender Om lotus wall art offers a gentle visual reminder to pause and make room for calm.',
  'For the coworker who has said everything except the word, this wooden F-Bomb is a cheeky desk gift. It brings a bit of humor to a work space without needing an instruction manual.',
  'If your business prefers cash payments, this sign gives customers a clear explanation at checkout. Its message is direct and easy to spot beside a register or payment terminal.',
  'Honor an officer’s service with a plaque made personal by their name. This Thin Blue Line design makes a meaningful gift for a retirement, milestone, or thank-you.',
  'Give a sports fan or athlete a place for their phone that is unmistakably theirs. This wooden holder pairs a sport silhouette with an engraved name, making a practical gift for a birthday, team milestone, or graduation. Confirm current sport choices on Etsy.',
  'A name or short message can make an everyday pencil feel surprisingly personal. These custom engraved pencils suit teacher gifts, team events, or a desk shared by many people. Check Etsy for current pencil and case choices.'
];
if (productRewrites.length !== 66) throw new Error(`Expected 66 product rewrite entries, got ${productRewrites.length}`);
const productWarnings = new Map([
  [15, 'Name and color options require confirmation against the active Etsy listing.'],
  [17, 'Exact heart wording options require confirmation against the active Etsy listing.'],
  [18, 'Available flower colors and personalization options require confirmation.'],
  [24, 'The original references an established date only in the pictured example; verify whether that date can be ordered.'],
  [25, 'Owner specifically requested customer-supplied scripture; verify any text-length, licensing, and layout limits before publishing.'],
  [26, 'Verify that both name and year are currently offered.'],
  [27, 'Verify which birth details are currently supported.'],
  [39, 'The catalog title refers to 2024, while the primary photograph appears to show 2025. Verify the active listing and exact year before publishing copy.'],
  [42, 'Verify current memorial personalization and color choices.'],
  [63, 'Confirm the sign’s exact printed wording against the product photographs.'],
  [65, 'Verify current sport silhouette choices.'],
  [66, 'Verify whether the wooden case is included or optional.']
]);
for (let index = 0; index < catalog.products.length; index++) {
  const product = catalog.products[index];
  const url = `${base}${productPath(product)}`;
  pageInventory.push({ name: product.displayTitle, url, sourcePath: 'data/products.json', generatedPath: productPath(product).slice(1), inspected: true });
  const proposed = productRewrites[index];
  if (!proposed) continue;
  await add({ id: `product-${String(index + 1).padStart(2, '0')}-description`, page: product.displayTitle,
    url, section: 'Product description', category: /gallery|photo|photograph|pictured|close view|styled|reverse/i.test(product.longDescription) ? 'Gallery narration' : 'Product clarity',
    sourcePath: 'data/products.json', sourceKey: `products[${index}].longDescription`, original: product.longDescription, proposed,
    reason: 'Replace photo-by-photo narration or caveats with a direct description of the piece and its customer use. Keep the existing title, short description, product facts, images, Etsy link, and generated SEO metadata for separate review.',
    warning: productWarnings.get(index + 1) || '', priorApproval: 'scope', scope: 'Previously approved Edit 5: site-wide copy direction; this exact replacement is a new proposal.' });
}

const seoRewrites = new Map([
  [15, 'Personalized wooden rose with a name worked into the design. See Etsy for current name and color choices.'],
  [18, 'Personalized wooden flower bouquet in a vase. See Etsy for current design and personalization choices.'],
  [35, 'Wooden scripture cross ornaments with faith-themed words and designs. See Etsy for current options.'],
  [37, 'Hand-painted Santa ornament with personalized name and year examples. See Etsy for current options.'],
  [66, 'Custom engraved pencils with name or message lettering. See Etsy for current pencil and case options.']
]);
for (const [number, proposed] of seoRewrites) {
  const product = catalog.products[number - 1];
  await add({ id: `product-${String(number).padStart(2, '0')}-seo-description`, page: product.displayTitle,
    url: `${base}${productPath(product)}`, section: 'SEO description', category: 'Gallery narration',
    sourcePath: 'data/products.json', sourceKey: `products[${number - 1}].seoDescription`, original: product.seoDescription, proposed,
    reason: 'Search snippets should describe the product and current ordering path, not call attention to photographs.',
    warning: productWarnings.get(number) || '', priorApproval: 'scope', scope: 'Previously approved Edit 5: site-wide copy direction; this exact replacement is a new proposal.' });
}

// Owner-approved About and Contact wording is kept verbatim and split into atomic decisions.
const aboutApproved = [
  ['hero-intro', 'Hero introduction', 'Kennedy Laser Works is a small Budd Lake maker business where thoughtful design and laser precision meet patient, hands-on finishing.', "I'm the owner and craftsman behind Kennedy Laser Works. I create custom laser-engraved signs, personalized gifts, plaques, and one-of-a-kind pieces using a combination of laser technology and traditional woodworking techniques.\n\nFrom designing and engraving to sanding, painting, and finishing, I take pride in making each piece something you'll be proud to give or display."],
  ['meet-kevin', 'Meet Kevin body', 'Kevin creates made-to-order pieces at Kennedy Laser Works in Budd Lake, New Jersey. From design to the final finish, every piece is created with attention to detail using a blend of laser precision and hand craftsmanship.', "I create custom, made-to-order pieces at Kennedy Laser Works, combining laser engraving with traditional woodworking techniques. From the initial design to the final finish, I personally handle each project with attention to detail.\n\nWhether you have a finished design, a rough idea, or just an occasion in mind, I'll work with you to create something special.\n\nMy goal is simple: to create something personal, meaningful, and made just for you."],
  ['craft-headline', 'Craftsmanship heading', 'Precision makes the detail possible. Hands make it personal.', 'Laser-Cut Precision. Hand-Finished Quality.'],
  ['precision', 'Laser Precision card', 'Digital layout and controlled cutting or engraving create the clean lines, repeatable details, and careful placement each design needs.', 'I use laser technology to cut and engrave detailed designs with accuracy and consistency.'],
  ['finishing', 'Hand Finishing card', 'Many projects continue beyond the laser. Assembly, painting, layering, cleanup, detailing, and final inspection receive hands-on attention where the piece requires it.', 'I personally assemble, sand, paint, and finish each piece as needed.'],
  ['service', 'Personal Service card', 'Made-to-order work leaves room to discuss wording, timing, purpose, and the small choices that make a piece feel specific to its recipient.', "I'll work with you to choose the design, wording, and details that make your project uniquely yours."],
  ['new-jersey', 'Made in New Jersey card', 'Kennedy Laser Works operates from a workshop in Budd Lake, New Jersey. Local pickup is available by advance arrangement, while eligible work can ship nationwide.', 'Every piece is made in my New Jersey workshop. Local pickup is available by arrangement, and shipping is available nationwide for eligible items.'],
  ['closing-headline', 'Closing heading', 'Local craftsmanship, wherever you are.', 'Handcrafted in New Jersey. Shipped Nationwide.'],
  ['closing-text', 'Closing supporting text', 'Arrange local pickup in Budd Lake or have your completed piece shipped nationwide.', 'Every piece is made in my workshop. Local pickup is available by arrangement, and eligible orders can be shipped anywhere in the United States.']
];
for (const [suffix, section, original, proposed] of aboutApproved) await site(`approved-08-${suffix}`, 'About', 'about.html', section, 'Voice', original, proposed,
  'Owner-approved first-person About copy. Preserve the existing buttons and accurate pickup/shipping information.',
  { priorApproval: 'exact', ...(suffix === 'closing-headline' ? { sourceKey: '<h2>Local craftsmanship,<br><em>wherever you are.</em></h2>' } : {}) });
await site('approved-08-remove-redundant-meet-copy', 'About', 'about.html', 'Meet Kevin remaining paragraphs', 'Redundancy',
  'The goal is straightforward: make a piece that feels specific to its person and purpose.',
  'Remove this sentence and the adjacent “Custom work can begin…” paragraph after inserting the approved Meet Kevin copy. Keep the shipping and pickup paragraph and Share Your Idea button.',
  'The approved body replaces these repetitive paragraphs.', { type: 'remove', priorApproval: 'exact' });
await site('approved-08-remove-forced-links', 'About', 'about.html', 'Meet Kevin product links', 'Forced links',
  'See how that work appears in a cherry wood scripture plaque or a personalized sunshine sign.', 'Remove this sentence; retain natural product links elsewhere in catalog and related-product sections.',
  'The links interrupt the maker story.', { type: 'remove', priorApproval: 'exact', sourceKey: 'See how that work appears in a <a' });
await site('approved-08-remove-workshop-approach', 'About', 'about.html', 'Workshop Approach section', 'Redundancy',
  'Precision is only the beginning.', 'Remove the entire Workshop Approach section, including its three cards.',
  'Its points repeat the craftsmanship section immediately above.', { type: 'remove', priorApproval: 'exact' });
await site('approved-07-remove-reviews-explainer', 'Reviews', 'reviews.html', 'Google reviews paragraph', 'Redundancy',
  'These short excerpts come from public Google reviews. Read each full review and the current feedback on the business listing.',
  'Remove this paragraph. Keep the verified excerpts, reviewer attribution, and both Google review buttons.',
  'The buttons already provide the needed context.', { type: 'remove', priorApproval: 'exact' });
const contactApproved = [
  ['hero-headline', 'Hero heading', 'Start with a conversation.', "Have Something in Mind? Let's Talk!"],
  ['hero-intro', 'Hero introduction', 'Ask about a current piece, share a custom idea, or arrange local pickup in Budd Lake. A clear plan can begin with only a few details.', "Have a question about one of my products or an idea for something custom? I'd love to hear about it. Tell me what you're looking for, and we'll go from there."],
  ['form-headline', 'Form heading', 'Tell us what you’re imagining.', 'Tell Me About Your Project'],
  ['form-intro', 'Form introduction', 'Tell me about your project, attach any reference images or files, and send your request directly to Kennedy Laser Works.', "Have a custom idea or a question about something you've seen on my website? Fill out the form with a few details, and I'll get back to you to discuss your project."]
];
for (const [suffix, section, original, proposed] of contactApproved) await site(`approved-09-${suffix}`, 'Contact', 'contact.html', section, 'Voice', original, proposed,
  'Owner-approved wording. The existing Basin form submission remains unchanged.',
  { priorApproval: 'exact', ...(suffix === 'hero-headline' ? { sourceKey: '<h1>Start with a <em>conversation.</em></h1>' } : {}) });
await site('approved-09-shorten-hero', 'Contact', 'contact.html', 'Hero size', 'Layout',
  '<section class="page-hero">', 'Reduce the oversized Contact hero and place the existing form directly below it.',
  'Makes the primary contact action visible sooner.', { type: 'layout', priorApproval: 'exact' });
await site('approved-09-remove-contact-cards', 'Contact', 'contact.html', 'Three easy ways to connect section', 'Redundancy',
  'Three easy ways to connect.', 'Remove the entire Email, Etsy, and Facebook card section. Keep Etsy and Facebook links in the footer.',
  'The site form should be the main contact path.', { type: 'remove', priorApproval: 'exact' });
await site('approved-09-remove-side-links', 'Contact', 'contact.html', 'Links beside form', 'Forced links',
  'Email directly; See the custom process; Browse starting points; See a personalized family plaque.', 'Remove Email directly, Browse starting points, and the unrelated family plaque link. The optional custom-process link may remain below the form.',
  'These side links distract from the form. Preserve all fields, attachments, validation, Turnstile, Basin, and confirmations.', { type: 'remove', priorApproval: 'exact', sourceKey: '<ul><li><a href="mailto:kennedylaserworks@gmail.com">Email directly</a>' });

const pillTargets = [
  ['Wedding signs', 'collections.html?category=weddings-anniversaries#catalog'],
  ['Memorial pieces', 'collections.html?category=memorial-keepsakes#catalog'],
  ['Family signs', 'collections.html?category=family-gifts#catalog'],
  ['Business logos and signs', 'collections.html?category=business-office#catalog'],
  ['Awards and plaques', 'collections.html?search=plaque#catalog'],
  ['Holiday decor', 'collections.html?category=holidays#catalog'],
  ['One-of-a-kind gifts', 'custom-work.html#inquiry']
];
for (let i = 0; i < pillTargets.length; i++) {
  const [label, target] = pillTargets[i];
  await site(`approved-06-pill-${i + 1}`, 'Custom Work', 'custom-work.html', `Project category: ${label}`, 'Navigation',
    `<li>${label}</li>`, label === 'Holiday decor'
      ? 'Keep the “Holiday decor” label and make it a keyboard-accessible link to collections.html?category=holidays#catalog. Add a Holidays category to the existing catalog configuration and assign it to verified holiday-related products across the year, while retaining their current categories.'
      : `Make this pill a keyboard-accessible link to ${target}.`,
    'The current pill visually resembles a control but is an inert list item.',
    { type: 'behavior', priorApproval: 'exact', warning: label === 'Holiday decor' ? 'There is currently no Holidays category. Review the proposed membership across St. Patrick’s Day, Easter, Valentine’s Day, Mother’s Day, Father’s Day, Halloween/fall, and Christmas/winter. Keep general fall, political, and patriotic pieces only where they genuinely fit.' : label === 'One-of-a-kind gifts' ? 'Destination is the inquiry form, not a filtered catalog. Confirm this matches owner intent.' : '' });
}
await site('approved-06-pill-spacing', 'Custom Work', 'custom-work.html', 'Project category spacing', 'Layout',
  'Projects with a purpose', 'Reduce excessive empty space below the category pills while keeping a clear break before project examples.',
  'Owner-observed vertical spacing issue.', { type: 'layout', priorApproval: 'exact' });

// New findings on site-wide and supporting content. These are undecided.
await site('new-home-hero-generic', 'Home', 'index.html', 'Hero supporting text', 'Voice',
  'Personalized wood signs, engraved gifts, and one-of-a-kind creations, handcrafted with attention to every detail.',
  'Custom signs, engraved gifts, and keepsakes made to order in Budd Lake, New Jersey.',
  'The original repeats the headline and a generic quality claim. The proposed line gives location and ordering context.');
await site('new-collections-hero-explainer', 'Collections', 'collections.html', 'Hero supporting text', 'Voice',
  'Every item links to its own detail page; current ordering options live on Etsy.',
  'Open a piece to see its details, then visit Etsy for current ordering options.',
  'The current sentence describes site mechanics; the replacement is a clearer customer instruction.');
await site('new-custom-work-collaboration', 'Custom Work', 'custom-work.html', 'Collaboration paragraph', 'Voice',
  'A custom project works best as a conversation. You bring the occasion, recipient, wording, references, and practical needs. Kennedy Laser Works helps turn those details into a clear direction that can be produced and finished with care.',
  'Tell me about the occasion, who it is for, and any wording or images you have in mind. I’ll help work out the design and practical details with you.',
  'First person is more natural for the owner-operated business.');
await site('new-custom-work-forced-links', 'Custom Work', 'custom-work.html', 'Examples introduction', 'Forced links',
  'Explore the details of an engraved acacia cutting board, cedar anniversary plaque, or custom engraved pencils before sharing your idea. The photographed examples below still link to Etsy for current ordering options.',
  'Remove this extra paragraph. The example cards directly below already link to those products on Etsy.',
  'The sentence repeats the cards and pushes visitors toward unrelated examples.', { type: 'remove', sourceKey: 'Explore the details of an <a' });
await site('new-reviews-forced-links', 'Reviews', 'reviews.html', 'Etsy review callout', 'Forced links',
  'Browse the Heritage Family Name Plaque or memorial angel wings ornament to see the craftsmanship behind individual pieces.',
  'Remove this sentence; keep the Etsy reviews button.',
  'Product links do not help visitors evaluate the reviews here.', { type: 'remove', sourceKey: 'Browse the <a' });
await site('new-custom-projects-hero-overlap', 'Custom Projects', 'custom-projects.html', 'Hero introduction', 'Redundancy',
  'Using laser precision, layered construction, engraving, hand finishing, and traditional craftsmanship, your idea becomes something uniquely yours.',
  'Remove this sentence; the preceding and following hero lines already explain the offer and invite visitors to browse.',
  'Reduces repeated craft terminology.', { type: 'remove' });
await site('new-custom-projects-forced-links', 'Custom Projects', 'custom-projects.html', 'Portfolio introduction', 'Forced links',
  'For current product examples, see the personalized Heritage Family Name Plaque and laser-cut wooden decorative box.',
  'Remove this sentence. Keep the main Collections link in shared navigation.',
  'The custom-project gallery is the useful next step in this section.', { type: 'remove', sourceKey: 'For current product examples, see the <a' });
await site('new-custom-projects-gallery-narration', 'Custom Projects', 'custom-projects.html', 'Process copy', 'Gallery narration',
  "The galleries above show more than just finished photos. Where available, you'll also see the original reference, work in progress, construction details, and the finished piece.",
  'A custom piece can start with an image, a sketch, or an idea. I’ll talk through what can be made and how to bring it together.',
  'Focus on how the customer can start rather than enumerating gallery photographs.');
await site('new-custom-projects-ending-repetition', 'Custom Projects', 'custom-projects.html', 'Final callout', 'Redundancy',
  "Custom means exactly that. It doesn't have to be something I've made before.",
  'Remove this sentence; the two preceding paragraphs already make the point.',
  'Shortens the final call to action.', { type: 'remove' });
await site('new-shared-footer-slogan', 'Shared footer', 'index.html', 'Brand tagline on all page footers', 'Voice',
  'Laser Precision. Personalized Perfection.', 'Custom signs and engraved gifts, made in Budd Lake, New Jersey.',
  'The current two-line slogan is generic. If approved, update all page footers and the product generator/template together.',
  { scope: 'All 76 customer-facing HTML pages and product template; one shared-content decision, not 76 separate edits.', sourceKey: 'Laser Precision.<br>Personalized Perfection.' });
await site('new-contact-pickup-path', 'Contact', 'contact.html', 'Local pickup button', 'Navigation',
  'Arrange Local Pickup', 'Have the button open the existing contact form with a clear local-pickup prompt; keep the current email link in the footer for visitors who prefer it.',
  'The page otherwise directs inquiries through the website form. This proposal would make the pickup CTA consistent with that flow.',
  { type: 'behavior', warning: 'The current button opens email. Owner-approved Edit 9 says the website form is the main contact route; confirm whether email should remain an alternate pickup route.' });

// Customer-facing custom-project detail content is generated from JSON.
const projectChanges = [
  [0, 1, 'The design brings together the flags of Norway, Italy, Ireland, and Germany. The details are laser engraved in solid cherry wood, while hand painting and finishing complete the sign.', 'Gallery narration'],
  [7, 2, 'Remove this gallery-tour paragraph. The preceding paragraphs already explain the transformation from supplied artwork into the finished wood piece.', 'Gallery narration'],
  [5, 1, 'I designed and engraved this wooden thank-you plaque as a one-of-a-kind appreciation gift.', 'Voice']
];
for (const [projectIndex, paragraphIndex, proposed, category] of projectChanges) {
  const project = projects.projects[projectIndex];
  await add({ id: `new-project-${projectIndex + 1}-${paragraphIndex + 1}`, page: `Custom Projects: ${project.title}`,
    url: `${base}/custom-projects.html?project=${project.id || project.slug || ''}`, section: `Project description paragraph ${paragraphIndex + 1}`,
    category, type: projectIndex === 7 ? 'remove' : 'text', sourcePath: 'data/custom-projects.json',
    sourceKey: `projects[${projectIndex}].description[${paragraphIndex}]`, original: project.description[paragraphIndex], proposed,
    reason: category === 'Gallery narration' ? 'The gallery itself shows the stages; the written description should focus on the project.' : 'Use first person for the owner’s process.' });
}

const baseCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const ownerDecisionBytes = await readFile(path.join(here, 'owner-decisions-source.json'));
const ownerExport = JSON.parse(ownerDecisionBytes.toString('utf8'));
if (ownerExport.schemaVersion !== 1 || ownerExport.baseCommit !== baseCommit || !Array.isArray(ownerExport.decisions)) {
  throw new Error('Owner decision source is for a different audit or site commit; reconcile it before rebuilding.');
}
const oldById = new Map();
for (const decision of ownerExport.decisions) {
  if (oldById.has(decision.id)) throw new Error(`Duplicate owner decision: ${decision.id}`);
  oldById.set(decision.id, decision);
}
const unmatchable = ownerExport.decisions.filter((decision) => {
  const item = items.find((candidate) => candidate.id === decision.id);
  return !item || decision.sourceFingerprint !== item.source.fingerprint || decision.sourceFileSha256 !== item.source.fileSha256;
});
if (unmatchable.length) throw new Error(`Owner decisions require manual reconciliation: ${unmatchable.map((entry) => entry.id).join(', ')}`);

const phase2Proofreads = JSON.parse(await readFile(path.join(here, 'phase2-proofreads.json'), 'utf8'));
const pendingCustomIds = ownerExport.decisions.filter((decision) => decision.decision === 'custom' && decision.finalApproval === 'pending').map((decision) => decision.id);
if (pendingCustomIds.length !== Object.keys(phase2Proofreads).length || pendingCustomIds.some((id) => !phase2Proofreads[id])) {
  throw new Error('Every pending custom decision must have exactly one proofread version or implementation plan.');
}
for (const id of pendingCustomIds) {
  const item = items.find((candidate) => candidate.id === id);
  const entry = phase2Proofreads[id];
  if (item.type === 'text' ? !entry.polishedText || entry.implementationPlan : !entry.implementationPlan || entry.polishedText) {
    throw new Error(`Wrong Phase 2 review type for ${id}`);
  }
}
const decisionSnapshot = {};
for (const item of items) {
  const previous = oldById.get(item.id);
  const phase2 = phase2Proofreads[item.id];
  item.proposalUpdate = previous ? (previous.proposed === item.proposed ? '' : 'Updated suggestion since your last review') : 'New suggestion in this revision';
  if (previous && previous.proposed !== item.proposed) item.previousProposed = previous.proposed;
  if (phase2?.implementationPlan) item.implementationPlan = phase2.implementationPlan;
  if (phase2?.verificationNote) item.warning = [item.warning, phase2.verificationNote].filter(Boolean).join(' ');
  if (item.id === 'product-02-description') item.warning = [item.warning, 'Owner wording mentions a front door. Confirm exterior suitability before publishing that wording.'].filter(Boolean).join(' ');
  decisionSnapshot[item.id] = previous ? {
    decision: previous.decision,
    customText: previous.customText || '',
    polishedText: phase2?.polishedText || previous.polishedText || '',
    implementationPlan: phase2?.implementationPlan || previous.implementationPlan || '',
    finalApproval: previous.finalApproval === 'approved' ? 'approved' : (previous.decision === 'custom' ? 'pending' : 'not-required'),
    notes: previous.notes || ''
  } : { decision: 'undecided', customText: '', polishedText: '', implementationPlan: '', finalApproval: 'not-required', notes: '' };
}
const data = { schemaVersion: 1, reviewRevision: 3, generatedAt: new Date().toISOString(), baseCommit,
  ownerExportedAt: ownerExport.exportedAt, ownerDecisionSourceSha256: hash(ownerDecisionBytes), decisionSnapshot,
  site: base, auditScope: 'Editorial and usability audit only; no website changes implemented.',
  pageInventory, items, factualChecks: [
    'Confirm the currently supported name, color, wording, year, sport, and accessory options noted on product items against the live Etsy listings before publishing changes.',
    'For the Heritage hover image, photo 6 visibly shows a hand holding the finished plaque; the holder’s identity is unverified.',
    'The owner chose a broad Holidays destination for the Holiday decor pill. Confirm final product membership, especially general fall, political, and patriotic pieces, before adding the new category.',
    'Confirm whether the one-of-a-kind gifts pill should lead to the inquiry form.',
    'Confirm whether local-pickup inquiries should exclusively use the website form or retain direct email as an alternate route.',
    'Confirm the 10% local pickup discount and nationwide shipping eligibility before changing policy or promise language. No policy edit is proposed.'
  ] };
await writeFile(path.join(here, 'audit-data.json'), JSON.stringify(data, null, 2) + '\n');
const preservedDecisions = {
  schemaVersion: data.schemaVersion, baseCommit: data.baseCommit, reviewRevision: data.reviewRevision,
  exportedAt: new Date().toISOString(), sourceExportedAt: ownerExport.exportedAt,
  decisions: items.map((item) => ({
    id: item.id, page: item.page, url: item.url, section: item.section,
    sourcePath: item.source.path, sourceKey: item.source.key, sourceLine: item.source.line,
    sourceFingerprint: item.source.fingerprint, sourceFileSha256: item.source.fileSha256,
    original: item.original, proposed: item.proposed, ...decisionSnapshot[item.id]
  }))
};
await writeFile(path.join(here, 'preserved-decisions.json'), JSON.stringify(preservedDecisions, null, 2) + '\n');
const pendingReview = items.filter((item) => decisionSnapshot[item.id].decision === 'custom' && decisionSnapshot[item.id].finalApproval === 'pending');
const approvalReview = [
  '# Kennedy Laser Works — Phase 2 custom alternatives for final approval',
  '',
  `Source: the October 18 owner export at commit \`${baseCommit}\`. All ${pendingReview.length} entries below remain pending; this document records alternatives but does not approve or implement them.`,
  '',
  ...pendingReview.flatMap((item, index) => {
    const owner = decisionSnapshot[item.id];
    return [
      `## ${index + 1}. ${item.page} — ${item.section} (\`${item.id}\`)`,
      '',
      item.type === 'text' ? '**My Original Wording**' : '**My Original Modification**',
      '',
      owner.customText,
      '',
      item.type === 'text' ? '**Codex’s Proofread Version**' : '**Codex’s Proposed Plan**',
      '',
      item.type === 'text' ? owner.polishedText : owner.implementationPlan,
      '',
      ...(phase2Proofreads[item.id]?.verificationNote ? [`**Verify before publishing:** ${phase2Proofreads[item.id].verificationNote}`, ''] : [])
    ];
  }),
  'Final approval must be recorded in the local review interface and exported as JSON. The two undecided items remain unchanged. No website files are changed by this document.',
  ''
].join('\n');
await writeFile(path.join(here, 'phase2-approval-review.md'), approvalReview);
const template = await readFile(path.join(here, 'review.template.html'), 'utf8');
const embedded = JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
await writeFile(path.join(here, 'review.html'), template.replace('/*__AUDIT_DATA__*/', embedded));
const categoryCounts = new Map();
for (const item of items) categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1);
const countFor = (name) => items.filter((item) => item.page === name).length;
const customerPages = pageInventory.filter((page) => page.name !== 'Product fallback template');
const inventoryRows = pageInventory.map((page) => `| ${page.name.replaceAll('|', '\\|')} | ${page.sourcePath}${page.generatedPath ? ` → ${page.generatedPath}` : ''} | ${countFor(page.name)} |`).join('\n');
const otherGroups = [...new Set(items.map((item) => item.page))].filter((name) => !pageInventory.some((page) => page.name === name));
const otherRows = otherGroups.map((name) => `| ${name.replaceAll('|', '\\|')} | Cross-page or generated project detail | ${countFor(name)} |`).join('\n');
const warnings = items.filter((item) => item.warning).map((item) => `- **${item.page} — ${item.section}:** ${item.warning}`).join('\n');
const report = `# Kennedy Laser Works — Phase 1 audit findings\n\nAudit source commit: \`${data.baseCommit}\`. Repository files are the source of truth; the live homepage was also checked on ${new Date().toISOString().slice(0,10)}. This is an editorial and usability review, not an implementation.\n\n## Coverage and counts\n\n- ${customerPages.length} customer-facing pages inspected: ${catalog.products.length} generated product pages and ${customerPages.length - catalog.products.length} other pages. The fallback product template was inspected separately.\n- ${projects.projects.length} custom-project detail records inspected in \`data/custom-projects.json\`; three have proposed copy changes.\n- ${items.length} individually reviewable proposals. ${items.filter((item) => item.priorApproval === 'exact').length} carry exact previously approved wording or behavior; ${items.filter((item) => item.priorApproval === 'scope').length} fall under previously approved Edit 5 but contain new wording that remains undecided; ${items.filter((item) => !item.priorApproval).length} are new findings.\n- ${items.filter((item) => /^product-\d+-description$/.test(item.id)).length} product body descriptions have proposed edits. The Heritage Family Name Plaque body description was reviewed and retained. Five additional product SEO descriptions have separate proposals.\n\n## Issue categories\n\n| Category | Suggestions |\n|---|---:|\n${[...categoryCounts].sort((a,b)=>b[1]-a[1]).map(([category,count])=>`| ${category} | ${count} |`).join('\n')}\n\n## Page-by-page breakdown\n\nThe individual originals, proposals, reasons, warnings, and source fingerprints are in \`audit-data.json\` and the review app. A zero means inspected with no proposed change.\n\n| Page | Source | Suggestions |\n|---|---|---:|\n${inventoryRows}\n${otherRows ? `${otherRows}\n` : ''}\n## Findings that drive the recommendations\n\n1. **Photo narration is widespread.** 64 of 66 catalog long descriptions contain terms such as “gallery,” “photo,” “photographed,” or “example.” Each product was reviewed individually; 65 body descriptions have a proposed change, including the owner’s five named products. Five SEO descriptions independently refer to photographs. Generated product HTML comes from \`data/products.json\`, so later approved copy changes belong there before regeneration.\n2. **Several page sections repeat or force unrelated product links.** About repeats its craftsmanship/process points; Reviews has a redundant explanation and unrelated product links; Custom Work and Custom Projects include explanatory links that interrupt the page’s purpose. The owner-approved About, Contact, and Reviews changes are preserved as atomic decisions. Natural catalog and related-product links remain available.\n3. **Custom Work category pills are inert.** Seven \`<li>\` labels appear in pill styling but have no link/action. Destination proposals use existing catalog filters or the inquiry form. Holiday decor has only a partial match and is flagged for owner choice.\n4. **The current catalog anchor offset is smaller than requested.** \`css/showroom.css\` uses \`scroll-margin-top: calc(var(--header-height) + 1rem)\`. The owner-approved proposal adjusts the homepage-category landing position without changing filters or grid behavior.\n5. **The Heritage card’s first hover uses gallery image 2.** \`js/catalog.js\` uses \`gallery[1]\`; image 2 is an unfinished board. The owner requested image 6. That image shows the finished plaque held in front of its digital design; the holder’s identity is not proven by the photo.\n6. **Contact’s route is visually diluted.** Three alternative contact cards appear before the website form, and multiple links sit beside it. The owner-approved plan moves the unchanged Basin form immediately below a shorter hero. The direct-email route in the footer, Privacy, and Terms needs a separate policy decision if it is ever changed.\n\n## Claims and choices requiring confirmation\n\n${data.factualChecks.map((line)=>`- ${line}`).join('\n')}\n\nItem-specific warnings:\n\n${warnings || '- None.'}\n\n## What remains untouched\n\nThe production HTML, catalog, generator, scripts, styles, policies, forms, SEO metadata, Etsy links, and deployed website were not edited in Phase 1. The proposals are in the separate \`audit/website-copy-review\` directory. No changes were committed, pushed, or deployed.\n`;
const revisedReport = report
  .replace('The Heritage Family Name Plaque body description was reviewed and retained.', 'The Heritage Family Name Plaque now has a separately reviewable new proposal; its source content remains unchanged.')
  .replace('65 body descriptions have a proposed change', 'all 66 body descriptions have a proposed change')
  .replace('Holiday decor has only a partial match and is flagged for owner choice.', 'The owner requested a broader Holidays destination; its catalog membership awaits review and final approval.')
  .replace('fall under previously approved Edit 5 but contain new wording that remains undecided', 'fall under previously approved Edit 5 and have been reviewed individually')
  .replace('## Issue categories', `## Phase 2 decision record\n\nThe October 18 owner export is preserved byte-for-byte in \`owner-decisions-source.json\`. Its ${ownerExport.decisions.length} decisions include 87 approved suggestions, two rejected suggestions, 27 custom alternatives (25 pending final approval), and two undecided items. All IDs, source fingerprints, custom text, and notes match the current audit. \`preserved-decisions.json\` adds proofread alternatives and functional implementation plans while retaining the owner's original text and final-approval status. \`phase2-approval-review.md\` presents all 25 pending alternatives for comparison. The review app opens on items needing attention, and every decision remains in exports.\n\n## Issue categories`);
await writeFile(path.join(here, 'audit-summary.md'), revisedReport);
console.log(`Wrote ${items.length} review items across ${pageInventory.length} inspected pages.`);
