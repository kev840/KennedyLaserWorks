(() => {
  "use strict";

  const schedule = {
    1: { label: "Winter gifting", title: "Made personal for the people you love", categories: ["personalized-gifts", "home-decor", "christmas-winter"] },
    2: { label: "Valentine’s season", title: "Keepsakes made for your favorite person", categories: ["valentines-day", "personalized-gifts", "weddings-anniversaries"] },
    3: { label: "Spring celebrations", title: "Fresh details for brighter days", categories: ["st-patricks-day", "spring-easter", "home-decor"] },
    4: { label: "Easter & spring", title: "Handcrafted accents for gathering season", categories: ["spring-easter", "religious-inspirational", "home-decor"] },
    5: { label: "Mother’s Day", title: "A lasting thank-you for everything she does", categories: ["mothers-day", "family-gifts", "personalized-gifts"] },
    6: { label: "Weddings & Father’s Day", title: "For milestones worth remembering", categories: ["weddings-anniversaries", "fathers-day", "custom-projects"] },
    7: { label: "Summer & Americana", title: "Handcrafted details for home and celebration", categories: ["patriotic-americana", "home-decor", "custom-projects"] },
    8: { label: "Early fall", title: "Warm details for home and harvest", categories: ["halloween-fall", "home-decor", "personalized-gifts"] },
    9: { label: "Fall & Halloween", title: "Gather, decorate, and make it yours", categories: ["halloween-fall", "home-decor", "personalized-gifts"] },
    10: { label: "Halloween, with Christmas coming", title: "Spooky season now. Holiday magic next.", categories: ["halloween-fall", "christmas-winter", "ornaments"] },
    11: { label: "Holiday gifting", title: "Order meaningful gifts before the rush", categories: ["christmas-winter", "ornaments", "personalized-gifts"] },
    12: { label: "Christmas at Kennedy Laser Works", title: "Names, memories, and holiday traditions", categories: ["christmas-winter", "ornaments", "personalized-gifts"] }
  };

  const section = document.querySelector("[data-seasonal]");
  if (!section) return;
  const current = schedule[new Date().getMonth() + 1];
  const productGrid = section.querySelector("[data-season-products]");
  const labels = new Map();
  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);

  section.querySelector("[data-season-label]").textContent = current.label;
  section.querySelector("[data-season-title]").textContent = current.title;

  Promise.all([
    fetch("data/products.json").then((response) => response.ok ? response.json() : Promise.reject()),
    fetch("data/categories.json").then((response) => response.ok ? response.json() : Promise.reject())
  ]).then(([catalog, categoryData]) => {
    categoryData.categories.forEach((category) => labels.set(category.slug, category.label));
    section.querySelector("[data-season-links]").innerHTML = current.categories.map((category) => `<a href="collections.html?category=${encodeURIComponent(category)}">${escapeHtml(labels.get(category) || category)}<span aria-hidden="true">→</span></a>`).join("");

    const active = catalog.products.filter((product) => product.active);
    const matchesSeason = (product) => product.categories.some((category) => current.categories.includes(category));
    /* Editorial fallback: seasonal featured → seasonal match → verified customer favorite → current Etsy catalog order. */
    const pools = [
      active.filter((product) => product.featured && matchesSeason(product)),
      active.filter(matchesSeason),
      active.filter((product) => product.customerFavorite === true),
      active
    ];
    const chosen = [];
    pools.forEach((pool) => pool.forEach((product) => {
      if (chosen.length < 3 && !chosen.some((item) => item.id === product.id)) chosen.push(product);
    }));

    productGrid.innerHTML = chosen.map((product) => `<article class="season-product">
      <a class="season-product__image" href="${escapeHtml(product.etsyUrl)}" target="_blank" rel="noopener">
        <picture><source srcset="${escapeHtml(product.primaryImage)}" type="image/webp"><img src="${escapeHtml(product.imageFallback)}" alt="${escapeHtml(product.displayTitle)}" loading="lazy" width="${product.imageWidth}" height="${product.imageHeight}"></picture>
      </a>
      <div><p>${escapeHtml(labels.get(product.categories[0]) || "Handcrafted collection")}</p><h3>${escapeHtml(product.displayTitle)}</h3><span>${escapeHtml(product.priceDisplay)}</span><a href="${escapeHtml(product.etsyUrl)}" target="_blank" rel="noopener" aria-label="View ${escapeHtml(product.displayTitle)} on Etsy">View on Etsy <span aria-hidden="true">↗</span></a></div>
    </article>`).join("");
  }).catch(() => {
    section.querySelector("[data-season-links]").innerHTML = '<a href="collections.html">Explore every collection <span aria-hidden="true">→</span></a>';
    productGrid.innerHTML = '<p class="seasonal-fallback">Seasonal pieces are taking a moment to load. Browse the full live collection instead.</p>';
  });
})();
