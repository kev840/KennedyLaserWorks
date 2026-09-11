(() => {
  "use strict";

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  const imageRecords = new WeakMap();
  const imageSelector = "img.progressive-image, img[loading='lazy'], img[data-progressive]";
  const imageWrapper = (image) => image.closest(".catalog-card__image, .home-collection-card__image, .home-custom-example, .home-project-teaser__image, .custom-project-card__image, .custom-project-viewer__main, .custom-project-viewer__thumbs button, .quick-view__main-image, .quick-view__thumbnails button, .quick-view__related-grid button, .product-lightbox figure");
  const sourceKey = (image) => {
    const sources = [...(image.closest("picture")?.querySelectorAll("source") || [])].map((source) => source.srcset).join("|");
    return `${sources}|${image.getAttribute("src") || ""}`;
  };

  const trackImage = (image) => {
    const key = sourceKey(image);
    const previous = imageRecords.get(image);
    if (previous?.key === key) {
      if (image.complete) previous.settle();
      return;
    }
    previous?.cleanup();
    if (previous?.key !== key) delete image.dataset.fallbackTried;

    image.classList.add("progressive-image", "is-loading");
    image.classList.remove("is-loaded", "is-error");
    imageWrapper(image)?.classList.remove("image-missing");

    let settled = false;
    const cleanup = () => {
      image.removeEventListener("load", onLoad);
      image.removeEventListener("error", onError);
    };
    const showSuccess = () => {
      settled = true;
      cleanup();
      image.classList.remove("is-loading", "is-error");
      image.classList.add("is-loaded");
      imageWrapper(image)?.classList.remove("image-missing");
    };
    const showError = () => {
      settled = true;
      cleanup();
      image.classList.remove("is-loading");
      image.classList.add("is-loaded", "is-error");
      imageWrapper(image)?.classList.add("image-missing");
    };
    const tryFallback = () => {
      const picture = image.closest("picture");
      const sources = [...(picture?.querySelectorAll("source") || [])];
      const fallback = image.getAttribute("src");
      if (!sources.length || !fallback || image.dataset.fallbackTried === "true") return false;
      cleanup();
      sources.forEach((source) => source.remove());
      image.dataset.fallbackTried = "true";
      imageRecords.delete(image);
      image.removeAttribute("src");
      image.src = fallback;
      trackImage(image);
      return true;
    };
    const onLoad = () => image.naturalWidth > 0 ? showSuccess() : showError();
    const onError = () => { if (!tryFallback()) showError(); };
    const settle = () => {
      if (settled || !image.complete) return;
      if (image.naturalWidth > 0) showSuccess();
      else onError();
    };

    imageRecords.set(image, { key, cleanup, settle });
    image.addEventListener("load", onLoad);
    image.addEventListener("error", onError);
    settle();
  };

  const enhanceImages = (scope = document) => {
    const images = scope instanceof HTMLImageElement ? [scope] : [...(scope.querySelectorAll?.(imageSelector) || [])];
    images.forEach(trackImage);
  };
  window.KLW = Object.freeze({ enhanceImages });
  enhanceImages();

  const revealItems = document.querySelectorAll(".reveal-on-scroll");

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries, instance) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      instance.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8%", threshold: 0.12 });

  revealItems.forEach((item) => observer.observe(item));
})();
