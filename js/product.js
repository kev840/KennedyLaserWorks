(() => {
  "use strict";

  const root = document.querySelector("[data-product-page]");
  const tools = window.KLWProductGallery;
  if (!root || !tools) return;

  const lightbox = document.querySelector("[data-lightbox]");
  const lightboxImage = lightbox?.querySelector("[data-lightbox-image]");
  const lightboxSource = lightbox?.querySelector("[data-lightbox-source]");
  const lightboxCaption = lightbox?.querySelector("[data-lightbox-caption]");
  const lightboxPosition = lightbox?.querySelector("[data-lightbox-position]");
  let product;
  let gallery = [];
  let currentIndex = 0;
  let lightboxOpener = null;
  let gallerySwipeX = 0;
  let lightboxSwipeX = 0;

  const categoryLabel = (slug, labels) => labels.get(slug) || slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  const productUrl = (item) => `product.html?id=${encodeURIComponent(item.id)}`;

  const factsMarkup = (item) => {
    const facts = [
      { label: "Personalization", value: item.personalized === true ? "Available — choose current options on Etsy." : "See the Etsy listing for available options." },
      ...(item.dimensions ? [{ label: "Dimensions", value: Array.isArray(item.dimensions) ? item.dimensions.join(", ") : item.dimensions }] : []),
      ...(item.materials ? [{ label: "Materials", value: Array.isArray(item.materials) ? item.materials.join(", ") : item.materials }] : []),
      { label: "Production timing", value: item.productionTime || "Varies by piece and current workload; confirm a needed-by date before ordering." },
      { label: "Local pickup", value: "Available by advance arrangement in Budd Lake, New Jersey. Contact us before ordering." }
    ];
    return facts.map((fact) => `<div><dt>${tools.escapeHtml(fact.label)}</dt><dd>${tools.escapeHtml(fact.value)}</dd></div>`).join("");
  };

  const galleryMarkup = () => `<section class="product-detail__gallery" aria-label="${tools.escapeHtml(product.displayTitle)} image gallery" data-product-gallery>
    <div class="product-detail__main">
      <button class="product-detail__zoom" type="button" data-open-lightbox="0" aria-label="Enlarge ${tools.escapeHtml(product.displayTitle)}">
        ${tools.picture(gallery[0], { loading: "eager" })}
        <span>View larger</span>
      </button>
      ${gallery.length > 1 ? `<button class="gallery-arrow gallery-arrow--previous" type="button" data-gallery-prev aria-label="Previous product image">←</button><button class="gallery-arrow gallery-arrow--next" type="button" data-gallery-next aria-label="Next product image">→</button><span class="gallery-position" data-gallery-position aria-live="polite">1 of ${gallery.length}</span>` : ""}
    </div>
    ${gallery.length > 1 ? `<div class="product-detail__thumbnails" aria-label="Choose a product image">${gallery.map((image, index) => `<button type="button" data-gallery-index="${index}" class="${index === 0 ? "is-current" : ""}" aria-label="Show image ${index + 1} of ${gallery.length}" aria-pressed="${index === 0}">${tools.picture(image, { decorative: true })}</button>`).join("")}</div>` : ""}
  </section>`;

  const relatedMarkup = (products, labels) => {
    const related = products.filter((item) => item.id !== product.id && item.active && item.categories.some((category) => product.categories.includes(category))).slice(0, 4);
    if (!related.length) return "";
    return `<section class="section product-related" aria-labelledby="related-title"><div class="container"><p class="section-kicker">More handcrafted pieces</p><h2 id="related-title">You May Also Like</h2><div class="product-related__grid">${related.map((item) => {
      const image = tools.images(item)[0];
      return `<a href="${tools.escapeHtml(productUrl(item))}">${tools.picture(image)}<span><small>${tools.escapeHtml(categoryLabel(item.categories[0], labels))}</small>${tools.escapeHtml(item.displayTitle)}</span></a>`;
    }).join("")}</div></div></section>`;
  };

  const replaceMainImage = (index) => {
    if (!gallery.length) return;
    currentIndex = (index + gallery.length) % gallery.length;
    const zoom = root.querySelector("[data-open-lightbox]");
    if (zoom) {
      zoom.classList.add("is-changing");
      zoom.dataset.openLightbox = String(currentIndex);
      zoom.querySelector("picture")?.remove();
      zoom.insertAdjacentHTML("afterbegin", tools.picture(gallery[currentIndex], { loading: "eager" }));
      window.KLW?.enhanceImages(zoom);
      window.requestAnimationFrame(() => zoom.classList.remove("is-changing"));
    }
    root.querySelectorAll("[data-gallery-index]").forEach((button) => {
      const selected = Number(button.dataset.galleryIndex) === currentIndex;
      button.classList.toggle("is-current", selected);
      button.setAttribute("aria-pressed", String(selected));
      if (selected) button.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    const position = root.querySelector("[data-gallery-position]");
    if (position) position.textContent = `${currentIndex + 1} of ${gallery.length}`;
    tools.preloadNext(gallery, currentIndex);
  };

  const showLightboxImage = (index) => {
    if (!gallery.length || !lightboxImage) return;
    currentIndex = (index + gallery.length) % gallery.length;
    const image = gallery[currentIndex];
    if (lightboxSource) lightboxSource.srcset = image.webp || image.fallback;
    lightboxImage.src = image.fallback;
    lightboxImage.alt = image.alt;
    lightboxImage.width = image.width;
    lightboxImage.height = image.height;
    window.KLW?.enhanceImages(lightboxImage);
    if (lightboxCaption) lightboxCaption.textContent = image.alt;
    if (lightboxPosition) lightboxPosition.textContent = `${currentIndex + 1} of ${gallery.length}`;
    lightbox?.classList.toggle("has-multiple", gallery.length > 1);
    replaceMainImage(currentIndex);
  };

  const openLightbox = (index, opener) => {
    if (!lightbox) return;
    lightboxOpener = opener;
    showLightboxImage(index);
    if (!lightbox.open) lightbox.showModal();
  };

  const closeLightbox = () => {
    if (!lightbox?.open) return;
    lightbox.close();
    lightboxOpener?.focus();
  };

  const installSchema = () => {
    const schema = document.createElement("script");
    schema.type = "application/ld+json";
    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.displayTitle,
      description: product.shortDescription,
      image: gallery.map((image) => new URL(image.webp || image.fallback, window.location.href).href),
      url: window.location.href,
      offers: { "@type": "Offer", url: product.etsyUrl, availability: "https://schema.org/InStock" }
    });
    document.head.append(schema);
  };

  const render = (products, labels) => {
    gallery = tools.images(product);
    const label = categoryLabel(product.categories[0], labels);
    document.title = `${product.displayTitle} | Kennedy Laser Works`;
    document.querySelector("[data-product-crumb]").textContent = product.displayTitle;
    root.innerHTML = `<div class="container product-detail__layout">
      ${galleryMarkup()}
      <article class="product-detail__copy">
        <p class="section-kicker">${tools.escapeHtml(label)}</p>
        <h1>${tools.escapeHtml(product.displayTitle)}</h1>
        <p class="product-detail__description">${tools.escapeHtml(product.shortDescription)}</p>
        <p class="product-detail__price">See Etsy for current pricing.</p>
        <dl class="quick-view__facts">${factsMarkup(product)}</dl>
        <div class="product-detail__actions"><a class="button button--forest" href="${tools.escapeHtml(product.etsyUrl)}" target="_blank" rel="noopener">Purchase on Etsy <span aria-hidden="true">↗</span></a><a class="arrow-link" href="contact.html">Ask a question <span aria-hidden="true">→</span></a></div>
      </article>
    </div>${relatedMarkup(products, labels)}`;
    window.KLW?.enhanceImages(root);
    tools.preloadNext(gallery, 0);
    installSchema();
  };

  root.addEventListener("click", (event) => {
    const thumbnail = event.target.closest("[data-gallery-index]");
    const opener = event.target.closest("[data-open-lightbox]");
    if (thumbnail) replaceMainImage(Number(thumbnail.dataset.galleryIndex));
    if (event.target.closest("[data-gallery-prev]")) replaceMainImage(currentIndex - 1);
    if (event.target.closest("[data-gallery-next]")) replaceMainImage(currentIndex + 1);
    if (opener) openLightbox(Number(opener.dataset.openLightbox), opener);
  });

  root.addEventListener("touchstart", (event) => {
    if (gallery.length > 1 && event.target.closest("[data-product-gallery]")) gallerySwipeX = event.changedTouches[0]?.clientX || 0;
  }, { passive: true });
  root.addEventListener("touchend", (event) => {
    if (gallery.length < 2 || !gallerySwipeX || !event.target.closest("[data-product-gallery]")) return;
    const distance = (event.changedTouches[0]?.clientX || 0) - gallerySwipeX;
    gallerySwipeX = 0;
    if (Math.abs(distance) >= 45) replaceMainImage(currentIndex + (distance < 0 ? 1 : -1));
  }, { passive: true });

  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox || event.target.closest("[data-close-lightbox]")) closeLightbox();
    if (event.target.closest("[data-lightbox-prev]")) showLightboxImage(currentIndex - 1);
    if (event.target.closest("[data-lightbox-next]")) showLightboxImage(currentIndex + 1);
  });
  lightbox?.addEventListener("touchstart", (event) => { if (gallery.length > 1) lightboxSwipeX = event.changedTouches[0]?.clientX || 0; }, { passive: true });
  lightbox?.addEventListener("touchend", (event) => {
    if (gallery.length < 2 || !lightboxSwipeX) return;
    const distance = (event.changedTouches[0]?.clientX || 0) - lightboxSwipeX;
    lightboxSwipeX = 0;
    if (Math.abs(distance) >= 45) showLightboxImage(currentIndex + (distance < 0 ? 1 : -1));
  }, { passive: true });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox?.open) closeLightbox();
    if (gallery.length < 2) return;
    if (event.key === "ArrowLeft") lightbox?.open ? showLightboxImage(currentIndex - 1) : replaceMainImage(currentIndex - 1);
    if (event.key === "ArrowRight") lightbox?.open ? showLightboxImage(currentIndex + 1) : replaceMainImage(currentIndex + 1);
  });

  Promise.all([
    fetch("data/products.json").then((response) => { if (!response.ok) throw new Error("Catalog unavailable"); return response.json(); }),
    fetch("data/categories.json").then((response) => { if (!response.ok) throw new Error("Categories unavailable"); return response.json(); })
  ]).then(([catalog, categoryData]) => {
    const id = new URLSearchParams(window.location.search).get("id");
    product = catalog.products.find((item) => item.active && (item.id === id || item.etsyListingId === id));
    if (!product) throw new Error("Product not found");
    render(catalog.products, new Map(categoryData.categories.map((category) => [category.slug, category.label])));
  }).catch(() => {
    root.innerHTML = '<div class="container product-detail__error"><p class="section-kicker">Product unavailable</p><h1>We could not find that piece.</h1><p>It may have moved or is no longer part of the current collection.</p><a class="button button--forest" href="collections.html">Browse the collection</a></div>';
  });
})();
