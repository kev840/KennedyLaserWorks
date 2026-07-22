(() => {
  "use strict";

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  const enhanceImages = (scope = document) => {
    const images = scope.matches?.("img[loading='lazy']") ? [scope] : scope.querySelectorAll?.("img[loading='lazy']") || [];
    images.forEach((image) => {
      if (image.classList.contains("progressive-image")) return;
      image.classList.add("progressive-image");
      const reveal = () => image.classList.add("is-loaded");
      if (image.complete) reveal();
      else image.addEventListener("load", reveal, { once: true });
    });
  };
  enhanceImages();
  new MutationObserver((mutations) => mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
    if (node instanceof Element) enhanceImages(node);
  }))).observe(document.body, { childList: true, subtree: true });

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
