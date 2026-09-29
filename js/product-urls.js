(() => {
  "use strict";
  window.KLWProductUrl = (product) => {
    const title = product.displayTitle.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `products/${title || "product"}-${product.etsyListingId}.html`;
  };
})();
