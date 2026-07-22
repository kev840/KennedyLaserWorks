(() => {
  "use strict";

  const catalog = document.querySelector("[data-catalog]");
  if (!catalog) return;

  const grid = catalog.querySelector("[data-product-grid]");
  const count = catalog.querySelector("[data-result-count]");
  const empty = catalog.querySelector("[data-empty-state]");
  const form = catalog.querySelector("[data-filter-form]");
  const search = catalog.querySelector("[data-product-search]");
  const selects = [...catalog.querySelectorAll("select[data-filter]")];
  const toggles = [...catalog.querySelectorAll("input[data-toggle-filter]")];
  const clearButton = catalog.querySelector("[data-clear-filters]");
  const chips = catalog.querySelector("[data-active-filters]");
  const notice = catalog.querySelector("[data-price-notice]");
  const dialog = document.querySelector("[data-quick-view]");
  const dialogContent = dialog?.querySelector("[data-quick-view-content]");
  let products = [];
  let categoryLabels = new Map();
  let renderTimer;
  let hasRendered = false;

  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const titleCase = (value) => value.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  const priceNumber = (value) => Number(String(value).replace(/[^0-9.]/g, "")) || 0;

  const picture = (product, loading = "lazy") => `<picture>
    <source srcset="${escapeHtml(product.primaryImage)}" type="image/webp">
    <img src="${escapeHtml(product.imageFallback)}" alt="${escapeHtml(product.displayTitle)}" loading="${loading}" width="${product.imageWidth || 794}" height="${product.imageHeight || 794}">
  </picture>`;

  const badgeDefinitions = [
    { category: "christmas-winter", label: "Christmas", className: "christmas" },
    { category: "weddings-anniversaries", label: "Wedding", className: "wedding" },
    { category: "memorial-keepsakes", label: "Memorial", className: "memorial" },
    { category: "patriotic-americana", label: "Patriotic", className: "patriotic" },
    { category: "custom-projects", label: "Custom", className: "custom" },
    { category: "home-decor", label: "Home Decor", className: "home" }
  ];

  const productBadges = (product) => {
    const badges = [];
    if (product.bestSeller === true) badges.push({ label: "Best Seller", className: "best-seller" });
    if (product.isNew === true) badges.push({ label: "New", className: "new" });
    badgeDefinitions.forEach((definition) => {
      if (product.categories.includes(definition.category)) badges.push(definition);
    });
    return badges.slice(0, 2).map((badge) => `<span class="collection-badge collection-badge--${badge.className}">${badge.label}</span>`).join("");
  };

  const productCard = (product) => `<article class="catalog-card" data-product-id="${escapeHtml(product.id)}">
    <button class="catalog-card__image" type="button" data-open-quick-view="${escapeHtml(product.id)}" aria-label="Quick view: ${escapeHtml(product.displayTitle)}">
      ${picture(product)}<span class="catalog-badges">${productBadges(product)}</span><span class="catalog-card__quick-label">Quick view</span>
    </button>
    <div class="catalog-card__body">
      <p class="catalog-card__category">${escapeHtml(categoryLabels.get(product.categories[0]) || titleCase(product.categories[0]))}</p>
      <h2>${escapeHtml(product.displayTitle)}</h2>
      <p>${escapeHtml(product.shortDescription)}</p>
      <div class="catalog-card__meta"><p class="catalog-card__pricing">See Etsy for current pricing.</p>${product.personalized ? '<span class="badge">Personalizable</span>' : ""}</div>
      <div class="catalog-card__actions">
        <button class="button button--outline" type="button" data-open-quick-view="${escapeHtml(product.id)}">Quick view</button>
        <a class="button button--forest" href="${escapeHtml(product.etsyUrl)}" target="_blank" rel="noopener">View on Etsy <span aria-hidden="true">↗</span></a>
      </div>
    </div>
  </article>`;

  const uniqueValues = (key) => [...new Set(products.flatMap((product) => product[key] || []))].sort((a, b) => {
    const aLabel = key === "categories" ? categoryLabels.get(a) || a : titleCase(a);
    const bLabel = key === "categories" ? categoryLabels.get(b) || b : titleCase(b);
    return aLabel.localeCompare(bLabel);
  });

  const populateSelects = () => {
    selects.forEach((select) => {
      if (select.dataset.filter === "price") return;
      const key = select.dataset.filter;
      const firstLabel = select.dataset.allLabel || "All";
      const options = uniqueValues(key).map((value) => {
        const label = key === "categories" ? categoryLabels.get(value) || titleCase(value) : titleCase(value);
        const matches = products.filter((product) => product[key]?.includes(value)).length;
        return `<option value="${escapeHtml(value)}">${escapeHtml(label)} (${matches})</option>`;
      });
      select.innerHTML = `<option value="">${escapeHtml(firstLabel)}</option>${options.join("")}`;
    });
  };

  const applyQueryState = () => {
    const params = new URLSearchParams(window.location.search);
    search.value = params.get("search") || "";
    selects.forEach((select) => {
      const value = params.get(select.dataset.param || select.dataset.filter) || "";
      if ([...select.options].some((option) => option.value === value)) select.value = value;
    });
    toggles.forEach((toggle) => { toggle.checked = params.get(toggle.dataset.param) === "1"; });
  };

  const currentState = () => ({
    search: search.value.trim(),
    ...Object.fromEntries(selects.map((select) => [select.dataset.filter, select.value])),
    ...Object.fromEntries(toggles.map((toggle) => [toggle.dataset.toggleFilter, toggle.checked]))
  });

  const syncUrl = (state) => {
    const params = new URLSearchParams();
    if (state.search) params.set("search", state.search);
    selects.forEach((select) => { if (select.value) params.set(select.dataset.param || select.dataset.filter, select.value); });
    toggles.forEach((toggle) => { if (toggle.checked) params.set(toggle.dataset.param, "1"); });
    const next = `${window.location.pathname}${params.size ? `?${params}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", next);
  };

  const priceMatches = (price, range) => {
    if (!range) return true;
    if (range === "under-15") return price < 15;
    if (range === "15-25") return price >= 15 && price <= 25;
    if (range === "25-50") return price > 25 && price <= 50;
    return price > 50;
  };

  const updateChips = (state) => {
    const active = [];
    if (state.search) active.push({ key: "search", label: `Search: ${state.search}` });
    selects.forEach((select) => {
      if (select.value) active.push({ key: select.dataset.filter, label: select.options[select.selectedIndex].text.replace(/ \(\d+\)$/, "") });
    });
    toggles.forEach((toggle) => { if (toggle.checked) active.push({ key: toggle.dataset.toggleFilter, label: toggle.dataset.chipLabel }); });
    chips.innerHTML = active.map((item) => `<button type="button" data-remove-filter="${escapeHtml(item.key)}">${escapeHtml(item.label)} <span aria-hidden="true">×</span><span class="visually-hidden"> filter</span></button>`).join("");
    chips.hidden = active.length === 0;
  };

  const updateFieldIndicators = () => {
    search.closest(".field")?.classList.toggle("is-active", Boolean(search.value.trim()));
    selects.forEach((select) => select.closest(".field")?.classList.toggle("is-active", Boolean(select.value)));
    const toggleGroup = catalog.querySelector(".filter-toggles");
    toggleGroup?.classList.toggle("is-active", toggles.some((toggle) => toggle.checked));
  };

  const render = () => {
    const state = currentState();
    const term = state.search.toLowerCase();
    const filtered = products.filter((product) => {
      const categoryText = product.categories.map((slug) => categoryLabels.get(slug) || slug);
      const searchable = [product.displayTitle, product.etsyTitle, product.shortDescription, ...product.tags, ...categoryText, ...product.occasions, ...product.recipients].join(" ").toLowerCase();
      return product.active
        && (!term || searchable.includes(term))
        && (!state.categories || product.categories.includes(state.categories))
        && (!state.occasions || product.occasions.includes(state.occasions))
        && (!state.recipients || product.recipients.includes(state.recipients))
        && (!state.seasons || product.seasons.includes(state.seasons))
        && (!state.personalized || product.personalized === true)
        && (!state.customAvailable || product.customAvailable === true)
        && priceMatches(priceNumber(product.priceDisplay), state.price);
    });
    const commitRender = () => {
      grid.innerHTML = filtered.map(productCard).join("");
      count.textContent = `${filtered.length} ${filtered.length === 1 ? "piece" : "pieces"}`;
      empty.hidden = filtered.length > 0;
      updateChips(state);
      updateFieldIndicators();
      syncUrl(state);
      grid.classList.remove("is-filtering");
      grid.setAttribute("aria-busy", "false");
      hasRendered = true;
    };

    window.clearTimeout(renderTimer);
    if (!hasRendered || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      commitRender();
      return;
    }
    grid.classList.add("is-filtering");
    grid.setAttribute("aria-busy", "true");
    renderTimer = window.setTimeout(commitRender, 120);
  };

  const closeDialog = () => { if (dialog?.open) dialog.close(); };

  const openQuickView = (id) => {
    const product = products.find((item) => item.id === id);
    if (!product || !dialog || !dialogContent) return;
    const related = products.filter((item) => item.id !== product.id && item.categories.some((category) => product.categories.includes(category))).slice(0, 3);
    dialogContent.innerHTML = `<div class="quick-view__image">${picture(product)}</div>
      <div class="quick-view__copy">
        <p class="section-kicker">${escapeHtml(categoryLabels.get(product.categories[0]) || titleCase(product.categories[0]))}</p>
        <h2 id="quick-view-title">${escapeHtml(product.displayTitle)}</h2>
        <p>${escapeHtml(product.shortDescription)}</p>
        <p class="quick-view__price">See Etsy for current pricing.</p>
        ${product.personalized ? '<p class="quick-view__note"><strong>Personalization available.</strong> Choose verified options on the Etsy listing.</p>' : ""}
        <p class="quick-view__pickup">Local to Budd Lake? Contact us before ordering to arrange pickup and the local discount.</p>
        <a class="button button--forest" href="${escapeHtml(product.etsyUrl)}" target="_blank" rel="noopener">Order on Etsy <span aria-hidden="true">↗</span></a>
        ${related.length ? `<div class="quick-view__related"><h3>Related pieces</h3>${related.map((item) => `<button type="button" data-open-quick-view="${escapeHtml(item.id)}">${escapeHtml(item.displayTitle)}</button>`).join("")}</div>` : ""}
      </div>`;
    dialog.showModal();
  };

  const injectItemListSchema = () => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.catalogSchema = "";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Kennedy Laser Works active Etsy catalog",
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({ "@type": "ListItem", position: index + 1, name: product.displayTitle, url: product.etsyUrl }))
    });
    document.head.append(script);
  };

  form.addEventListener("input", render);
  form.addEventListener("submit", (event) => event.preventDefault());
  const clearAll = () => { form.reset(); render(); search.focus(); };
  clearButton.addEventListener("click", clearAll);
  chips.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-filter]");
    if (!button) return;
    const key = button.dataset.removeFilter;
    if (key === "search") search.value = "";
    else {
      const select = selects.find((item) => item.dataset.filter === key);
      const toggle = toggles.find((item) => item.dataset.toggleFilter === key);
      if (select) select.value = "";
      if (toggle) toggle.checked = false;
    }
    render();
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-clear-filters]") && event.target !== clearButton) clearAll();
    const opener = event.target.closest("[data-open-quick-view]");
    if (opener) openQuickView(opener.dataset.openQuickView);
    if (event.target.closest("[data-close-quick-view]")) closeDialog();
  });
  dialog?.addEventListener("click", (event) => { if (event.target === dialog) closeDialog(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeDialog(); });
  grid.addEventListener("error", (event) => {
    if (event.target instanceof HTMLImageElement) event.target.closest(".catalog-card__image")?.classList.add("image-missing");
  }, true);

  Promise.all([
    fetch("data/products.json").then((response) => { if (!response.ok) throw new Error("Catalog unavailable"); return response.json(); }),
    fetch("data/categories.json").then((response) => { if (!response.ok) throw new Error("Categories unavailable"); return response.json(); })
  ]).then(([catalogData, categoryData]) => {
    products = catalogData.products.filter((product) => product.listingStatus === "active");
    categoryLabels = new Map(categoryData.categories.map((category) => [category.slug, category.label]));
    populateSelects();
    applyQueryState();
    notice.textContent = `Price filters use a catalog snapshot checked ${catalogData.catalogSnapshotDate}. See Etsy for current pricing, options, and availability.`;
    injectItemListSchema();
    render();
  }).catch(() => {
    grid.innerHTML = '<div class="catalog-load-error"><h2>The catalog could not load</h2><p>Please refresh the page or browse every current piece in the Etsy shop.</p><a class="button button--forest" href="https://kennedylaserworks.etsy.com/" target="_blank" rel="noopener">Browse Etsy <span aria-hidden="true">↗</span></a></div>';
    count.textContent = "Catalog unavailable";
  });
})();
