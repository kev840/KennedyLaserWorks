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
  const quickView = document.querySelector("[data-quick-view]");
  const quickViewContent = quickView?.querySelector("[data-quick-view-content]");
  const lightbox = document.querySelector("[data-lightbox]");
  const lightboxImage = lightbox?.querySelector("[data-lightbox-image]");
  const lightboxSource = lightbox?.querySelector("[data-lightbox-source]");
  const lightboxCaption = lightbox?.querySelector("[data-lightbox-caption]");
  const lightboxPosition = lightbox?.querySelector("[data-lightbox-position]");
  const galleryTools = window.KLWProductGallery;
  let products = [];
  let categoryLabels = new Map();
  let renderTimer;
  let hasRendered = false;
  let lastQuickViewOpener = null;
  let lastLightboxOpener = null;
  let activeGallery = [];
  let activeGalleryIndex = 0;

  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const normalize = (value = "") => String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const words = (value = "") => normalize(value).split(/\s+/).filter(Boolean);
  const titleCase = (value) => value.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  const priceNumber = (value) => Number(String(value).replace(/[^0-9.]/g, "")) || 0;

  const editDistance = (left, right) => {
    const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
      const current = [leftIndex];
      for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
        current[rightIndex] = Math.min(
          current[rightIndex - 1] + 1,
          previous[rightIndex] + 1,
          previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
        );
      }
      previous.splice(0, previous.length, ...current);
    }
    return previous[right.length];
  };

  const fuzzyWordMatch = (queryWord, candidateWord) => {
    if (candidateWord.includes(queryWord)) return true;
    if (queryWord.length < 4 || candidateWord.length < 3) return false;
    const tolerance = queryWord.length >= 8 ? 2 : 1;
    return Math.abs(queryWord.length - candidateWord.length) <= tolerance && editDistance(queryWord, candidateWord) <= tolerance;
  };

  const productSearchText = (product) => {
    const categoryText = product.categories.map((slug) => categoryLabels.get(slug) || slug);
    const customText = product.customAvailable === true ? ["custom", "custom work", "made to order"] : [];
    return [
      product.displayTitle,
      product.etsyTitle,
      product.shortDescription,
      ...(product.keywords || []),
      ...(product.tags || []),
      ...categoryText,
      ...(product.occasions || []),
      ...(product.recipients || []),
      ...(product.seasons || []),
      ...customText
    ].filter(Boolean).join(" ");
  };

  const searchMatches = (product, term) => {
    const queryWords = words(term);
    if (!queryWords.length) return true;
    const candidateWords = words(productSearchText(product));
    const normalizedText = candidateWords.join(" ");
    if (normalizedText.includes(normalize(term))) return true;
    return queryWords.every((queryWord) => candidateWords.some((candidateWord) => fuzzyWordMatch(queryWord, candidateWord)));
  };

  const highlightText = (value, term) => {
    const queryWords = words(term).filter((word) => word.length > 1);
    const source = String(value || "");
    if (!queryWords.length) return escapeHtml(source);
    const matchingWords = words(source).filter((candidate) => queryWords.some((query) => fuzzyWordMatch(query, candidate)));
    const terms = [...new Set([...queryWords, ...matchingWords])].sort((a, b) => b.length - a.length);
    if (!terms.length) return escapeHtml(source);
    const expression = new RegExp(`(${terms.map(escapeRegex).join("|")})`, "gi");
    return source.split(expression).map((part, index) => index % 2 ? `<mark>${escapeHtml(part)}</mark>` : escapeHtml(part)).join("");
  };

  const productGallery = (product) => galleryTools.images(product);

  const pictureFromImage = (image, loading = "lazy", className = "progressive-image", decorative = false) => galleryTools.picture(image, { loading, className, decorative });

  const picture = (product, loading = "lazy") => pictureFromImage(productGallery(product)[0], loading);

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

  const productCard = (product, term = "") => {
    const gallery = productGallery(product);
    return `<article class="catalog-card${gallery.length > 1 ? " has-gallery" : ""}" data-product-id="${escapeHtml(product.id)}">
    <button class="catalog-card__image" type="button" data-open-quick-view="${escapeHtml(product.id)}">
      <span class="catalog-card__primary-image">${pictureFromImage(gallery[0])}</span>${gallery.length > 1 ? `<span class="catalog-card__hover-image">${pictureFromImage(gallery[1], "lazy", "progressive-image catalog-card__secondary-image", true)}</span>` : ""}<span class="catalog-badges" aria-hidden="true">${productBadges(product)}</span>${gallery.length > 1 ? '<span class="catalog-card__gallery-count" aria-hidden="true">Multiple photos</span>' : ""}<span class="catalog-card__quick-label">Quick view</span>
    </button>
    <div class="catalog-card__body">
      <p class="catalog-card__category">${highlightText(categoryLabels.get(product.categories[0]) || titleCase(product.categories[0]), term)}</p>
      <h2><a href="product.html?id=${encodeURIComponent(product.id)}">${highlightText(product.displayTitle, term)}</a></h2>
      <p>${highlightText(product.shortDescription, term)}</p>
      <div class="catalog-card__meta"><p class="catalog-card__pricing">See Etsy for current pricing.</p>${product.personalized ? '<span class="badge">Personalizable</span>' : ""}</div>
      <div class="catalog-card__actions">
        <button class="button button--outline" type="button" data-open-quick-view="${escapeHtml(product.id)}">Quick view</button>
        <a class="button button--forest" href="${escapeHtml(product.etsyUrl)}" target="_blank" rel="noopener">View on Etsy <span aria-hidden="true">↗</span></a>
      </div>
    </div>
  </article>`;
  };

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
    catalog.querySelector(".filter-toggles")?.classList.toggle("is-active", toggles.some((toggle) => toggle.checked));
  };

  const activateProgressiveImages = (scope) => {
    window.KLW?.enhanceImages(scope);
  };

  const render = () => {
    const state = currentState();
    const filtered = products.filter((product) => product.active
      && searchMatches(product, state.search)
      && (!state.categories || product.categories.includes(state.categories))
      && (!state.occasions || product.occasions.includes(state.occasions))
      && (!state.recipients || product.recipients.includes(state.recipients))
      && (!state.seasons || product.seasons.includes(state.seasons))
      && (!state.personalized || product.personalized === true)
      && (!state.customAvailable || product.customAvailable === true)
      && priceMatches(priceNumber(product.priceDisplay), state.price));

    const commitRender = () => {
      grid.innerHTML = filtered.map((product) => productCard(product, state.search)).join("");
      count.textContent = `${filtered.length} ${filtered.length === 1 ? "piece" : "pieces"}`;
      empty.hidden = filtered.length > 0;
      updateChips(state);
      updateFieldIndicators();
      syncUrl(state);
      activateProgressiveImages(grid);
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
    renderTimer = window.setTimeout(commitRender, 150);
  };

  const intersectionCount = (left = [], right = []) => left.filter((value) => right.includes(value)).length;
  const recommendationScore = (source, candidate) => (
    intersectionCount(source.categories, candidate.categories) * 5
    + intersectionCount(source.seasons, candidate.seasons) * 4
    + intersectionCount(source.occasions, candidate.occasions) * 3
    + intersectionCount(source.recipients, candidate.recipients) * 3
    + intersectionCount(source.tags, candidate.tags)
  );

  const relatedProducts = (product) => products
    .filter((candidate) => candidate.id !== product.id && candidate.active)
    .map((candidate) => ({ candidate, score: recommendationScore(product, candidate) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.displayTitle.localeCompare(b.candidate.displayTitle))
    .slice(0, 4)
    .map(({ candidate }) => candidate);

  const quickViewFacts = (product) => {
    const facts = [
      { label: "Personalization", value: product.personalized === true ? "Available — choose current options on Etsy." : "See the Etsy listing for available options." },
      ...(product.dimensions ? [{ label: "Dimensions", value: Array.isArray(product.dimensions) ? product.dimensions.join(", ") : product.dimensions }] : []),
      ...(product.materials ? [{ label: "Materials", value: Array.isArray(product.materials) ? product.materials.join(", ") : product.materials }] : []),
      { label: "Production timing", value: product.productionTime || "Varies by piece and current workload; confirm a needed-by date before ordering." },
      { label: "Local pickup", value: "Available by advance arrangement in Budd Lake, New Jersey. Contact us before ordering." }
    ];
    return facts.map((fact) => `<div><dt>${escapeHtml(fact.label)}</dt><dd>${escapeHtml(fact.value)}</dd></div>`).join("");
  };

  const galleryMarkup = (product) => {
    const gallery = productGallery(product);
    const main = gallery[0];
    return `<div class="quick-view__gallery" data-swipe-gallery>
      <div class="quick-view__main-image">
        <button class="quick-view__zoom" type="button" data-open-lightbox="0" aria-label="Enlarge ${escapeHtml(product.displayTitle)}">
          ${pictureFromImage(main, "eager")}
          <span>View larger</span>
        </button>
        ${gallery.length > 1 ? `<button class="gallery-arrow gallery-arrow--previous" type="button" data-gallery-prev aria-label="Previous product image">←</button><button class="gallery-arrow gallery-arrow--next" type="button" data-gallery-next aria-label="Next product image">→</button><span class="gallery-position" data-gallery-position aria-live="polite">1 of ${gallery.length}</span>` : ""}
      </div>
      ${gallery.length > 1 ? `<div class="quick-view__thumbnails" aria-label="Product images">${gallery.map((image, index) => `<button type="button" data-gallery-index="${index}" class="${index === 0 ? "is-current" : ""}" aria-label="Show image ${index + 1} of ${gallery.length}" aria-pressed="${index === 0}">${pictureFromImage(image)}</button>`).join("")}</div>` : ""}
    </div>`;
  };

  const relatedMarkup = (product) => {
    const related = relatedProducts(product);
    if (!related.length) return "";
    return `<section class="quick-view__related" aria-labelledby="quick-view-related-title">
      <div><p class="section-kicker">Chosen by shared details</p><h3 id="quick-view-related-title">You May Also Like</h3></div>
      <div class="quick-view__related-grid">${related.map((item) => `<button type="button" data-open-quick-view="${escapeHtml(item.id)}" aria-label="Quick view: ${escapeHtml(item.displayTitle)}">${picture(item)}<span>${escapeHtml(item.displayTitle)}</span></button>`).join("")}</div>
    </section>`;
  };

  const openQuickView = (id, opener = null) => {
    const product = products.find((item) => item.id === id);
    if (!product || !quickView || !quickViewContent) return;
    if (opener && !quickView.open) lastQuickViewOpener = opener;
    activeGallery = productGallery(product);
    activeGalleryIndex = 0;
    quickViewContent.innerHTML = `<div class="quick-view__top">
      ${galleryMarkup(product)}
      <div class="quick-view__copy">
        <p class="section-kicker">${escapeHtml(categoryLabels.get(product.categories[0]) || titleCase(product.categories[0]))}</p>
        <h2 id="quick-view-title">${escapeHtml(product.displayTitle)}</h2>
        <p class="quick-view__description">${escapeHtml(product.shortDescription)}</p>
        <p class="quick-view__price">See Etsy for current pricing.</p>
        <dl class="quick-view__facts">${quickViewFacts(product)}</dl>
        <div class="quick-view__actions"><a class="button button--forest" href="${escapeHtml(product.etsyUrl)}" target="_blank" rel="noopener">Purchase on Etsy <span aria-hidden="true">↗</span></a><a class="arrow-link" href="product.html?id=${encodeURIComponent(product.id)}">Full details <span aria-hidden="true">→</span></a><a class="arrow-link" href="contact.html">Ask a question <span aria-hidden="true">→</span></a></div>
      </div>
    </div>${relatedMarkup(product)}`;
    activateProgressiveImages(quickViewContent);
    galleryTools.preloadNext(activeGallery, 0);
    if (!quickView.open) quickView.showModal();
    quickView.scrollTop = 0;
  };

  const updateQuickViewImage = (index) => {
    if (!activeGallery.length || !quickViewContent) return;
    activeGalleryIndex = (index + activeGallery.length) % activeGallery.length;
    const imageButton = quickViewContent.querySelector("[data-open-lightbox]");
    if (imageButton) {
      imageButton.classList.add("is-changing");
      imageButton.dataset.openLightbox = String(activeGalleryIndex);
      const image = activeGallery[activeGalleryIndex];
      imageButton.querySelector("picture")?.remove();
      imageButton.insertAdjacentHTML("afterbegin", pictureFromImage(image, "eager"));
      activateProgressiveImages(imageButton);
      window.requestAnimationFrame(() => imageButton.classList.remove("is-changing"));
    }
    quickViewContent.querySelectorAll("[data-gallery-index]").forEach((button) => {
      const isCurrent = Number(button.dataset.galleryIndex) === activeGalleryIndex;
      button.classList.toggle("is-current", isCurrent);
      button.setAttribute("aria-pressed", String(isCurrent));
      if (isCurrent) button.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    const position = quickViewContent.querySelector("[data-gallery-position]");
    if (position) position.textContent = `${activeGalleryIndex + 1} of ${activeGallery.length}`;
    galleryTools.preloadNext(activeGallery, activeGalleryIndex);
  };

  const showLightboxImage = (index) => {
    if (!activeGallery.length || !lightboxImage) return;
    activeGalleryIndex = (index + activeGallery.length) % activeGallery.length;
    const image = activeGallery[activeGalleryIndex];
    if (lightboxSource) lightboxSource.srcset = image.webp || image.fallback;
    lightboxImage.src = image.fallback;
    lightboxImage.alt = image.alt;
    lightboxImage.width = image.width;
    lightboxImage.height = image.height;
    window.KLW?.enhanceImages(lightboxImage);
    if (lightboxCaption) lightboxCaption.textContent = image.alt;
    if (lightboxPosition) lightboxPosition.textContent = `${activeGalleryIndex + 1} of ${activeGallery.length}`;
    lightbox?.classList.toggle("has-multiple", activeGallery.length > 1);
    updateQuickViewImage(activeGalleryIndex);
  };

  const openLightbox = (index) => {
    if (!lightbox || !activeGallery.length) return;
    lastLightboxOpener = document.activeElement;
    showLightboxImage(index);
    if (!lightbox.open) lightbox.showModal();
  };

  const closeQuickView = () => {
    if (quickView?.open) quickView.close();
    lastQuickViewOpener?.focus();
  };
  const closeLightbox = () => {
    if (!lightbox?.open) return;
    lightbox.close();
    lastLightboxOpener?.focus();
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
    if (opener) openQuickView(opener.dataset.openQuickView, opener);
    const thumbnail = event.target.closest("[data-gallery-index]");
    if (thumbnail) updateQuickViewImage(Number(thumbnail.dataset.galleryIndex));
    if (event.target.closest("[data-gallery-prev]")) updateQuickViewImage(activeGalleryIndex - 1);
    if (event.target.closest("[data-gallery-next]")) updateQuickViewImage(activeGalleryIndex + 1);
    const lightboxOpener = event.target.closest("[data-open-lightbox]");
    if (lightboxOpener) openLightbox(Number(lightboxOpener.dataset.openLightbox));
    if (event.target.closest("[data-close-quick-view]")) closeQuickView();
    if (event.target.closest("[data-close-lightbox]")) closeLightbox();
    if (event.target.closest("[data-lightbox-prev]")) showLightboxImage(activeGalleryIndex - 1);
    if (event.target.closest("[data-lightbox-next]")) showLightboxImage(activeGalleryIndex + 1);
  });

  quickView?.addEventListener("click", (event) => { if (event.target === quickView) closeQuickView(); });
  lightbox?.addEventListener("click", (event) => { if (event.target === lightbox) closeLightbox(); });
  let quickViewSwipeStartX = 0;
  quickViewContent?.addEventListener("touchstart", (event) => {
    if (activeGallery.length > 1 && event.target.closest("[data-swipe-gallery]")) quickViewSwipeStartX = event.changedTouches[0]?.clientX || 0;
  }, { passive: true });
  quickViewContent?.addEventListener("touchend", (event) => {
    if (activeGallery.length < 2 || !quickViewSwipeStartX || !event.target.closest("[data-swipe-gallery]")) return;
    const distance = (event.changedTouches[0]?.clientX || 0) - quickViewSwipeStartX;
    quickViewSwipeStartX = 0;
    if (Math.abs(distance) >= 45) updateQuickViewImage(activeGalleryIndex + (distance < 0 ? 1 : -1));
  }, { passive: true });
  let swipeStartX = 0;
  lightbox?.addEventListener("touchstart", (event) => {
    if (activeGallery.length > 1) swipeStartX = event.changedTouches[0]?.clientX || 0;
  }, { passive: true });
  lightbox?.addEventListener("touchend", (event) => {
    if (activeGallery.length < 2 || !swipeStartX) return;
    const distance = (event.changedTouches[0]?.clientX || 0) - swipeStartX;
    swipeStartX = 0;
    if (Math.abs(distance) < 45) return;
    showLightboxImage(activeGalleryIndex + (distance < 0 ? 1 : -1));
  }, { passive: true });
  document.addEventListener("keydown", (event) => {
    if (lightbox?.open && event.key === "ArrowLeft") showLightboxImage(activeGalleryIndex - 1);
    if (lightbox?.open && event.key === "ArrowRight") showLightboxImage(activeGalleryIndex + 1);
    if (!lightbox?.open && quickView?.open && event.key === "ArrowLeft") updateQuickViewImage(activeGalleryIndex - 1);
    if (!lightbox?.open && quickView?.open && event.key === "ArrowRight") updateQuickViewImage(activeGalleryIndex + 1);
    if (event.key === "Escape" && lightbox?.open) closeLightbox();
    else if (event.key === "Escape" && quickView?.open) closeQuickView();
  });
  let catalogInitialized = false;
  const initializeCatalog = () => {
    if (catalogInitialized) return;
    catalogInitialized = true;
    const catalogStyles = document.querySelector("[data-catalog-styles]");
    if (catalogStyles) catalogStyles.media = "all";
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
  };

  const catalogStyles = document.querySelector("[data-catalog-styles]");
  let catalogScheduled = false;
  const scheduleCatalog = () => {
    if (catalogScheduled) return;
    catalogScheduled = true;
    window.requestAnimationFrame(() => window.requestAnimationFrame(initializeCatalog));
  };
  if (!catalogStyles || catalogStyles.sheet) scheduleCatalog();
  else {
    catalogStyles.addEventListener("load", scheduleCatalog, { once: true });
    catalogStyles.addEventListener("error", scheduleCatalog, { once: true });
  }
})();
