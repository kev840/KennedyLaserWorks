export const productSlug = (product) => {
  if (product.pageSlug) return product.pageSlug;
  const title = product.displayTitle.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${title || "product"}-${product.etsyListingId}`;
};

export const productPath = (product) => `/products/${productSlug(product)}.html`;
