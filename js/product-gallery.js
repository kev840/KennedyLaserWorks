(() => {
  "use strict";

  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[character]);

  const fallbackFor = (source, product, index) => {
    if (product.imageFallbacks?.[index]) return product.imageFallbacks[index];
    if (index === 0 && product.imageFallback) return product.imageFallback;
    if (/\.webp(?:[?#].*)?$/i.test(source)) return source.replace(/\.webp(?=[?#]|$)/i, ".jpg");
    return source;
  };

  const imageFromValue = (value, product, index) => {
    const metadata = product.imageMetadata?.[index] || {};
    const source = typeof value === "string"
      ? value
      : value?.src || value?.webp || value?.primaryImage || value?.fallback || product.primaryImage;
    const fallback = typeof value === "string"
      ? fallbackFor(source, product, index)
      : value?.fallback || value?.imageFallback || fallbackFor(source, product, index);
    return {
      webp: source,
      fallback,
      alt: metadata.alt || value?.alt || `${product.displayTitle}${index ? ` — view ${index + 1}` : ""}`,
      width: metadata.width || value?.width || product.imageWidth || 794,
      height: metadata.height || value?.height || product.imageHeight || 794,
      rank: metadata.rank || index + 1
    };
  };

  const images = (product) => {
    if (Array.isArray(product.images) && product.images.length) {
      return product.images.map((image, index) => imageFromValue(image, product, index));
    }
    const legacy = [
      { src: product.primaryImage, fallback: product.imageFallback, alt: product.displayTitle },
      ...(product.alternateImages || [])
    ].filter(Boolean);
    return legacy.map((image, index) => imageFromValue(image, product, index));
  };

  const picture = (image, options = {}) => {
    const loading = options.loading || "lazy";
    const className = options.className || "progressive-image";
    const alt = options.decorative ? "" : image.alt;
    const ariaHidden = options.decorative ? ' aria-hidden="true"' : "";
    return `<picture${ariaHidden}>
      ${image.webp && image.webp !== image.fallback ? `<source srcset="${escapeHtml(image.webp)}" type="image/webp">` : ""}
      <img class="${escapeHtml(className)}" src="${escapeHtml(image.fallback)}" alt="${escapeHtml(alt)}" loading="${escapeHtml(loading)}" decoding="async" width="${Number(image.width) || 794}" height="${Number(image.height) || 794}"${ariaHidden}>
    </picture>`;
  };

  const preloadNext = (gallery, index) => {
    if (gallery.length < 2) return;
    const next = gallery[(index + 1) % gallery.length];
    const preload = new Image();
    preload.decoding = "async";
    preload.src = next.webp || next.fallback;
  };

  window.KLWProductGallery = Object.freeze({ escapeHtml, images, picture, preloadNext });
})();
