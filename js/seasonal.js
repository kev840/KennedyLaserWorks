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
    9: { label: "Fall & Halloween", title: "Gather, decorate, and make it yours", intro: "Fall and Halloween pieces are here, with Christmas favorites ready for the season ahead.", categories: ["halloween-fall", "christmas-winter", "ornaments"], featureOccasions: ["fall-season", "halloween", "christmas", "christmas"] },
    10: { label: "Halloween, with Christmas coming", title: "Spooky season now. Holiday magic next.", intro: "Shop Halloween favorites while planning personalized ornaments and holiday gifts.", categories: ["halloween-fall", "christmas-winter", "ornaments"], featureOccasions: ["halloween", "fall-season", "christmas", "christmas"] },
    11: { label: "Holiday gifting", title: "Order meaningful gifts before the rush", intro: "Personalized ornaments, signs, and keepsakes made for holiday traditions.", categories: ["christmas-winter", "ornaments", "personalized-gifts"] },
    12: { label: "Christmas at Kennedy Laser Works", title: "Names, memories, and holiday traditions", intro: "Handcrafted ornaments and décor designed to return year after year.", categories: ["christmas-winter", "ornaments", "personalized-gifts"] }
  };

  const collectionPriorities = [
    { slug: "christmas-winter", label: "Christmas & Winter", description: "Ornaments, signs, and keepsakes made for holiday traditions." },
    { slug: "halloween-fall", label: "Halloween & Fall", description: "Layered seasonal décor for welcoming the coziest time of year." },
    { slug: "patriotic-americana", label: "Patriotic & Americana", description: "Bold commemorative and tribute pieces with handcrafted detail." },
    { slug: "weddings-anniversaries", label: "Weddings & Anniversaries", description: "Personalized pieces that preserve meaningful names and dates." },
    { slug: "home-decor", label: "Home Décor", description: "Warm, distinctive details for doors, walls, kitchens, and gathering spaces.", representativeId: "etsy-4363044963" },
    { slug: "personalized-gifts", label: "Personalized Gifts", description: "Made-to-order gifts shaped around the people receiving them." },
    { slug: "memorial-keepsakes", label: "Memorial Keepsakes", description: "Thoughtful personalized tributes created to keep a memory close.", representativeId: "etsy-1788571932", imageIndex: 2 },
    { slug: "ornaments", label: "Ornaments", description: "Layered keepsakes for holidays, milestones, and family traditions.", representativeId: "etsy-4388098488" },
    { slug: "custom-projects", label: "Custom Work", description: "A starting point for original wording, dimensions, and design ideas." }
  ];
  const collectionWindows = {
    "christmas-winter": [1, 9, 10, 11, 12],
    ornaments: [1, 9, 10, 11, 12],
    "halloween-fall": [8, 9, 10],
    "patriotic-americana": [6, 7]
  };

  const showcaseIds = ["wisloffs-family-heritage-sign", "casa-de-kelly", "squirtle"];
  const customExamples = [
    ["growth-chart", "Personalized Growth Charts"],
    ["grabowski-cutting-board", "Custom Engraved Cutting Boards"],
    ["coasters", "Custom Engraved Coasters"]
  ];
  const section = document.querySelector("[data-seasonal]");
  if (!section) return;

  const month = new Date().getMonth() + 1;
  const current = schedule[month];
  const seasonalGrid = section.querySelector("[data-season-products]");
  const collectionsGrid = document.querySelector("[data-home-collections]");
  const favoritesGrid = document.querySelector("[data-home-favorites]");
  const customGrid = document.querySelector("[data-custom-products]");
  const labels = new Map();

  const scheduleRender = (callback) => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(callback, { timeout: 1200 });
    else window.setTimeout(callback, 0);
  };

  const renderFallbacks = () => {
    seasonalGrid.innerHTML = '<p class="seasonal-fallback">Seasonal pieces could not load. <a href="collections.html">Browse the complete collection</a>.</p>';
    collectionsGrid.innerHTML = '<p>Collections could not load. <a class="arrow-link" href="collections.html">Browse all products <span aria-hidden="true">→</span></a></p>';
    favoritesGrid.innerHTML = '<p>Featured projects could not load. <a class="arrow-link" href="custom-projects.html">Browse custom projects <span aria-hidden="true">→</span></a></p>';
    customGrid.innerHTML = '<a class="button button--bronze" href="custom-work.html">Explore Custom Work</a>';
  };

  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const uniqueById = (items) => [...new Map(items.map((item) => [item.id, item])).values()];
  const picture = (product, className = "") => `<picture class="${className}"><source srcset="${escapeHtml(product.primaryImage)}" type="image/webp"><img src="${escapeHtml(product.imageFallback)}" alt="${escapeHtml(product.displayTitle)}" loading="lazy" width="${product.imageWidth || 794}" height="${product.imageHeight || 794}"></picture>`;
  const projectPicture = (project, className = "") => {
    const image = project.images.find((item) => item.src === project.heroImage) || project.images[0];
    return `<picture class="${className}"><img src="${escapeHtml(image.fallback || image.src)}" alt="${escapeHtml(image.alt)}" loading="lazy" width="${image.width}" height="${image.height}"></picture>`;
  };

  const badgeFor = (product) => {
    const definitions = [
      ["christmas-winter", "Christmas", "christmas"], ["weddings-anniversaries", "Wedding", "wedding"],
      ["memorial-keepsakes", "Memorial", "memorial"], ["patriotic-americana", "Patriotic", "patriotic"],
      ["custom-projects", "Custom", "custom"], ["home-decor", "Home Décor", "home"]
    ];
    const match = definitions.find(([slug]) => product.categories.includes(slug));
    return match ? `<span class="collection-badge collection-badge--${match[2]}">${match[1]}</span>` : "";
  };

  const productCard = (product) => {
    const detailUrl = `product.html?id=${encodeURIComponent(product.id)}`;
    return `<article class="catalog-card catalog-card--home">
    <a class="catalog-card__image" href="${detailUrl}" aria-label="View details for ${escapeHtml(product.displayTitle)}">
      ${picture(product)}<span class="catalog-badges" aria-hidden="true">${badgeFor(product)}</span>
    </a>
    <div class="catalog-card__body">
      <p class="catalog-card__category">${escapeHtml(labels.get(product.categories[0]) || "Kennedy Laser Works")}</p>
      <h3><a href="${detailUrl}">${escapeHtml(product.displayTitle)}</a></h3>
      <p>${escapeHtml(product.shortDescription)}</p>
      <div class="catalog-card__meta"><p class="catalog-card__pricing">See Etsy for current pricing.</p>${product.personalized ? '<span class="badge">Personalizable</span>' : ""}</div>
      <div class="catalog-card__actions"><a class="button button--forest" href="${detailUrl}">View Details <span aria-hidden="true">→</span></a></div>
    </div>
  </article>`;
  };

  section.querySelector("[data-season-label]").textContent = current.label;
  section.querySelector("[data-season-title]").textContent = current.title;
  section.querySelector("[data-season-intro]").textContent = current.intro;
  const seasonalCollectionLink = section.querySelector("[data-season-collection-link]");
  seasonalCollectionLink.href = `collections.html?category=${encodeURIComponent(current.categories[0])}`;

  Promise.all([
    fetch("data/products.json").then((response) => response.ok ? response.json() : Promise.reject(new Error("Products unavailable"))),
    fetch("data/categories.json").then((response) => response.ok ? response.json() : Promise.reject(new Error("Categories unavailable"))),
    fetch("data/custom-projects.json").then((response) => response.ok ? response.json() : Promise.reject(new Error("Projects unavailable")))
  ]).then(([catalog, categoryData, projectData]) => {
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
    const rankedSeasonalProducts = uniqueById([
      ...active.filter((product) => product.featured && matchesSeason(product)).sort((a, b) => seasonPriority(a) - seasonPriority(b)),
      ...active.filter(matchesSeason).sort((a, b) => seasonPriority(a) - seasonPriority(b)),
      ...active.filter((product) => product.customerFavorite === true),
      ...recentlyAdded
    ]);
    const seasonalProducts = current.featureOccasions
      ? current.featureOccasions.reduce((selected, occasion) => {
        const match = active.filter((product) => product.occasions?.includes(occasion) && !selected.includes(product));
        const next = match.find((product) => product.featured) || match[0];
        if (next) selected.push(next);
        return selected;
      }, [])
      : [];
    seasonalProducts.push(...rankedSeasonalProducts.filter((product) => !seasonalProducts.includes(product)).slice(0, 4 - seasonalProducts.length));
    const seasonalMarkup = seasonalProducts.map(productCard).join("");

    const projects = projectData.projects.filter((project) => project.images?.length);
    const collectionRank = (collection) => {
      const currentIndex = current.categories.indexOf(collection.slug);
      if (currentIndex !== -1) return currentIndex;
      const window = collectionWindows[collection.slug];
      if (window && !window.includes(month)) return 100 + collectionPriorities.indexOf(collection);
      return 10 + collectionPriorities.indexOf(collection);
    };
    const orderedCollections = [...collectionPriorities].sort((a, b) => collectionRank(a) - collectionRank(b));
    const collectionTiles = orderedCollections.map((collection) => {
      if (collection.slug === "custom-projects") {
        const wisloff = projects.find((project) => project.id === "wisloffs-family-heritage-sign") || projects[0];
        if (!wisloff) return "";
        return `<article class="home-collection-card"><a class="home-collection-card__image" href="custom-projects.html">${projectPicture(wisloff)}</a><div><p>${projects.length} projects</p><h3><a href="custom-projects.html">Custom Work</a></h3><p>${escapeHtml(collection.description)}</p><a class="arrow-link" href="custom-projects.html">Explore custom projects <span aria-hidden="true">→</span></a></div></article>`;
      }
      const matches = active.filter((product) => product.categories.includes(collection.slug));
      if (!matches.length) return "";
      const representative = matches.find((product) => product.id === collection.representativeId) || matches.find((product) => product.featured) || matches[0];
      const tileImage = collection.imageIndex ? representative.alternateImages?.[collection.imageIndex - 1] : null;
      const imageMarkup = tileImage ? `<picture><source srcset="${escapeHtml(tileImage.src)}" type="image/webp"><img src="${escapeHtml(tileImage.fallback)}" alt="${escapeHtml(representative.displayTitle)}" loading="lazy" width="${tileImage.width}" height="${tileImage.height}"></picture>` : picture(representative);
      return `<article class="home-collection-card">
        <a class="home-collection-card__image" href="collections.html?category=${encodeURIComponent(collection.slug)}">${imageMarkup}</a>
        <div><p>${matches.length} ${matches.length === 1 ? "piece" : "pieces"}</p><h3><a href="collections.html?category=${encodeURIComponent(collection.slug)}">${escapeHtml(collection.label)}</a></h3><p>${escapeHtml(collection.description)}</p><a class="arrow-link" href="collections.html?category=${encodeURIComponent(collection.slug)}" aria-label="Explore ${escapeHtml(collection.label)}">Explore collection <span aria-hidden="true">→</span></a></div>
      </article>`;
    }).join("");
    const showcase = showcaseIds.map((id) => projects.find((project) => project.id === id)).filter(Boolean);
    const favoritesMarkup = showcase.map((project) => `<a class="home-craft-card" href="custom-projects.html?project=${encodeURIComponent(project.id)}">${projectPicture(project)}<span class="home-craft-card__body"><span class="section-kicker">${escapeHtml(project.type)}</span><strong>${escapeHtml(project.id === "squirtle" ? "Custom Layered Wall Art" : project.title)}</strong><span>View the finished project <span aria-hidden="true">→</span></span></span></a>`).join("");

    const customMarkup = customExamples.map(([id, label], index) => {
      const project = projects.find((item) => item.id === id);
      if (!project) return "";
      return `<a class="home-custom-example home-custom-example--${index + 1}" href="custom-projects.html?project=${encodeURIComponent(project.id)}">${projectPicture(project)}<span>${escapeHtml(label)}</span></a>`;
    }).join("");
    const renderQueue = [
      [seasonalGrid, seasonalMarkup],
      [collectionsGrid, collectionTiles],
      [favoritesGrid, favoritesMarkup],
      [customGrid, customMarkup]
    ];
    const renderNext = () => scheduleRender(() => {
      const next = renderQueue.shift();
      if (!next) return;
      try {
        const [target, markup] = next;
        target.innerHTML = markup;
        window.KLW?.enhanceImages(target);
        renderNext();
      } catch {
        renderQueue.length = 0;
        renderFallbacks();
      }
    });
    renderNext();
  }).catch(renderFallbacks);
})();
