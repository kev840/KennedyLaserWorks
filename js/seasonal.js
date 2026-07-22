(() => {
  "use strict";

  const schedule = {
    1: { label: "Winter gifting", title: "Made personal for the people you love", intro: "Warm, made-to-order details for winter homes and meaningful gifting.", categories: ["personalized-gifts", "home-decor", "christmas-winter"] },
    2: { label: "Valentine’s season", title: "Keepsakes made for your favorite person", intro: "Personalized flowers, signs, and keepsakes for the people closest to you.", categories: ["valentines-day", "personalized-gifts", "weddings-anniversaries"] },
    3: { label: "Spring celebrations", title: "Fresh details for brighter days", intro: "Welcome spring with handcrafted Irish, Easter, and home accents.", categories: ["st-patricks-day", "spring-easter", "home-decor"] },
    4: { label: "Easter & spring", title: "Handcrafted accents for gathering season", intro: "Layered signs and meaningful details for spring doors, walls, and gatherings.", categories: ["spring-easter", "religious-inspirational", "home-decor"] },
    5: { label: "Mother’s Day", title: "A lasting thank-you for everything she does", intro: "Personalized pieces created to celebrate mothers, grandmothers, and family.", categories: ["mothers-day", "family-gifts", "personalized-gifts"] },
    6: { label: "Weddings & Father’s Day", title: "For milestones worth remembering", intro: "Mark an anniversary, celebrate Dad, or begin a custom piece for the occasion.", categories: ["weddings-anniversaries", "fathers-day", "custom-projects"] },
    7: { label: "Summer & Americana", title: "Handcrafted details for home and celebration", intro: "Personalized home pieces and Americana designs for summer gifting and gatherings.", categories: ["patriotic-americana", "home-decor", "custom-projects"] },
    8: { label: "Early fall", title: "Warm details for home and harvest", intro: "Bring the first signs of fall home with layered, handcrafted décor.", categories: ["halloween-fall", "home-decor", "personalized-gifts"] },
    9: { label: "Fall & Halloween", title: "Gather, decorate, and make it yours", intro: "Pumpkins, haunted houses, and welcome signs made for the season.", categories: ["halloween-fall", "home-decor", "personalized-gifts"] },
    10: { label: "Halloween, with Christmas coming", title: "Spooky season now. Holiday magic next.", intro: "Shop Halloween favorites while planning personalized ornaments and holiday gifts.", categories: ["halloween-fall", "christmas-winter", "ornaments"] },
    11: { label: "Holiday gifting", title: "Order meaningful gifts before the rush", intro: "Personalized ornaments, signs, and keepsakes made for holiday traditions.", categories: ["christmas-winter", "ornaments", "personalized-gifts"] },
    12: { label: "Christmas at Kennedy Laser Works", title: "Names, memories, and holiday traditions", intro: "Handcrafted ornaments and décor designed to return year after year.", categories: ["christmas-winter", "ornaments", "personalized-gifts"] }
  };

  const collectionPriorities = [
    { slug: "christmas-winter", label: "Christmas & Winter", description: "Ornaments, signs, and keepsakes made for holiday traditions." },
    { slug: "halloween-fall", label: "Halloween & Fall", description: "Layered seasonal décor for welcoming the coziest time of year." },
    { slug: "patriotic-americana", label: "Patriotic & Americana", description: "Bold commemorative and tribute pieces with handcrafted detail." },
    { slug: "weddings-anniversaries", label: "Weddings & Anniversaries", description: "Personalized pieces that preserve meaningful names and dates." },
    { slug: "home-decor", label: "Home Décor", description: "Warm, distinctive details for doors, walls, kitchens, and gathering spaces." },
    { slug: "personalized-gifts", label: "Personalized Gifts", description: "Made-to-order gifts shaped around the people receiving them." },
    { slug: "pet-memorials", label: "Pet Memorials", description: "Thoughtful personalized tributes created to keep a memory close." },
    { slug: "ornaments", label: "Ornaments", description: "Layered keepsakes for holidays, milestones, and family traditions." },
    { slug: "custom-projects", label: "Custom Work", description: "A starting point for original wording, dimensions, and design ideas." }
  ];

  const customProductIds = ["etsy-1788982364", "etsy-1894832635", "etsy-1788479534"];
  const section = document.querySelector("[data-seasonal]");
  if (!section) return;

  const current = schedule[new Date().getMonth() + 1];
  const seasonalGrid = section.querySelector("[data-season-products]");
  const collectionsGrid = document.querySelector("[data-home-collections]");
  const favoritesGrid = document.querySelector("[data-home-favorites]");
  const customGrid = document.querySelector("[data-custom-products]");
  const labels = new Map();

  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const uniqueById = (items) => [...new Map(items.map((item) => [item.id, item])).values()];
  const picture = (product, className = "") => `<picture class="${className}"><source srcset="${escapeHtml(product.primaryImage)}" type="image/webp"><img src="${escapeHtml(product.imageFallback)}" alt="${escapeHtml(product.displayTitle)}" loading="lazy" width="${product.imageWidth || 794}" height="${product.imageHeight || 794}"></picture>`;

  const badgeFor = (product) => {
    const definitions = [
      ["christmas-winter", "Christmas", "christmas"], ["weddings-anniversaries", "Wedding", "wedding"],
      ["memorial-keepsakes", "Memorial", "memorial"], ["patriotic-americana", "Patriotic", "patriotic"],
      ["custom-projects", "Custom", "custom"], ["home-decor", "Home Décor", "home"]
    ];
    const match = definitions.find(([slug]) => product.categories.includes(slug));
    return match ? `<span class="collection-badge collection-badge--${match[2]}">${match[1]}</span>` : "";
  };

  const productCard = (product) => `<article class="catalog-card catalog-card--home">
    <a class="catalog-card__image" href="${escapeHtml(product.etsyUrl)}" target="_blank" rel="noopener" aria-label="View ${escapeHtml(product.displayTitle)} on Etsy">
      ${picture(product)}<span class="catalog-badges">${badgeFor(product)}</span>
    </a>
    <div class="catalog-card__body">
      <p class="catalog-card__category">${escapeHtml(labels.get(product.categories[0]) || "Kennedy Laser Works")}</p>
      <h3>${escapeHtml(product.displayTitle)}</h3>
      <p>${escapeHtml(product.shortDescription)}</p>
      <div class="catalog-card__meta"><p class="catalog-card__pricing">See Etsy for current pricing.</p>${product.personalized ? '<span class="badge">Personalizable</span>' : ""}</div>
      <div class="catalog-card__actions"><a class="button button--forest" href="${escapeHtml(product.etsyUrl)}" target="_blank" rel="noopener">View on Etsy <span aria-hidden="true">↗</span></a></div>
    </div>
  </article>`;

  section.querySelector("[data-season-label]").textContent = current.label;
  section.querySelector("[data-season-title]").textContent = current.title;
  section.querySelector("[data-season-intro]").textContent = current.intro;
  const seasonalCollectionLink = section.querySelector("[data-season-collection-link]");
  seasonalCollectionLink.href = `collections.html?category=${encodeURIComponent(current.categories[0])}`;

  Promise.all([
    fetch("data/products.json").then((response) => response.ok ? response.json() : Promise.reject(new Error("Products unavailable"))),
    fetch("data/categories.json").then((response) => response.ok ? response.json() : Promise.reject(new Error("Categories unavailable")))
  ]).then(([catalog, categoryData]) => {
    categoryData.categories.forEach((category) => labels.set(category.slug, category.label));
    const active = catalog.products.filter((product) => product.active && product.listingStatus === "active");
    const specificSeasonCategories = current.categories.filter((category) => !["home-decor", "personalized-gifts"].includes(category));
    const matchesSeason = (product) => product.categories.some((category) => specificSeasonCategories.includes(category));
    const seasonPriority = (product) => Math.min(...product.categories.map((category) => {
      const index = specificSeasonCategories.indexOf(category);
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    }));
    const datedProducts = active.filter((product) => product.dateAdded);
    const recentlyAdded = datedProducts.length
      ? [...active].sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0))
      : active;

    /* Seasonal featured → seasonal matches → verified favorites → recently added (catalog order when dates are unavailable). */
    const seasonalProducts = uniqueById([
      ...active.filter((product) => product.featured && matchesSeason(product)).sort((a, b) => seasonPriority(a) - seasonPriority(b)),
      ...active.filter(matchesSeason).sort((a, b) => seasonPriority(a) - seasonPriority(b)),
      ...active.filter((product) => product.customerFavorite === true),
      ...recentlyAdded
    ]).slice(0, 4);
    seasonalGrid.innerHTML = seasonalProducts.map(productCard).join("");

    const collectionTiles = collectionPriorities.map((collection) => {
      const matches = active.filter((product) => product.categories.includes(collection.slug));
      if (!matches.length) return "";
      const representative = matches.find((product) => product.featured) || matches[0];
      return `<article class="home-collection-card">
        <a class="home-collection-card__image" href="collections.html?category=${encodeURIComponent(collection.slug)}">${picture(representative)}</a>
        <div><p>${matches.length} ${matches.length === 1 ? "piece" : "pieces"}</p><h3><a href="collections.html?category=${encodeURIComponent(collection.slug)}">${escapeHtml(collection.label)}</a></h3><p>${escapeHtml(collection.description)}</p><a class="arrow-link" href="collections.html?category=${encodeURIComponent(collection.slug)}" aria-label="Explore ${escapeHtml(collection.label)}">Explore collection <span aria-hidden="true">→</span></a></div>
      </article>`;
    }).join("");
    collectionsGrid.innerHTML = collectionTiles;

    const favorites = uniqueById([
      ...active.filter((product) => product.customerFavorite === true),
      ...active.filter((product) => product.featured)
    ]).slice(0, 6);
    favoritesGrid.innerHTML = favorites.map(productCard).join("");

    const customProducts = customProductIds.map((id) => active.find((product) => product.id === id)).filter(Boolean);
    customGrid.innerHTML = customProducts.map((product, index) => `<a class="home-custom-example home-custom-example--${index + 1}" href="${escapeHtml(product.etsyUrl)}" target="_blank" rel="noopener">${picture(product)}<span>${escapeHtml(product.displayTitle)}</span></a>`).join("");
  }).catch(() => {
    seasonalGrid.innerHTML = '<p class="seasonal-fallback">Seasonal pieces could not load. <a href="collections.html">Browse the complete collection</a>.</p>';
    collectionsGrid.innerHTML = '<p>Collections could not load. <a class="arrow-link" href="collections.html">Browse all products <span aria-hidden="true">→</span></a></p>';
    favoritesGrid.innerHTML = '<p>Featured designs could not load. <a class="arrow-link" href="collections.html">Browse all products <span aria-hidden="true">→</span></a></p>';
    customGrid.innerHTML = '<a class="button button--bronze" href="custom-work.html">Explore Custom Work</a>';
  });

  document.addEventListener("error", (event) => {
    if (event.target instanceof HTMLImageElement) event.target.closest(".catalog-card__image, .home-collection-card__image, .home-custom-example")?.classList.add("image-missing");
  }, true);
})();
