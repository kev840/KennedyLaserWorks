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
  const clearButton = catalog.querySelector("[data-clear-filters]");
  let products = [];

  const requestedCategory = new URLSearchParams(window.location.search).get("category");
  const categorySelect = selects.find((select) => select.dataset.filter === "categories");
  if (requestedCategory && categorySelect && [...categorySelect.options].some((option) => option.value === requestedCategory)) categorySelect.value = requestedCategory;

  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[character]);

  const productCard = (product) => {
    const action = product.etsyUrl
      ? `<a class="button button--forest product-card__action" href="${escapeHtml(product.etsyUrl)}" target="_blank" rel="noopener">View on Etsy <span aria-hidden="true">↗</span></a>`
      : `<a class="button button--outline product-card__action" href="contact.html">Ask about this style <span aria-hidden="true">→</span></a>`;
    return `<article class="catalog-card">
      <a class="catalog-card__image" href="contact.html" aria-label="Ask about ${escapeHtml(product.title)}">
        <img src="${escapeHtml(product.primaryImage)}" alt="${escapeHtml(product.title)} example" loading="lazy" width="720" height="540" onerror="this.closest('.catalog-card__image').classList.add('image-missing');this.remove()">
      </a>
      <div class="catalog-card__body">
        ${product.sample ? '<span class="badge badge--sample">Sample catalog entry</span>' : ''}
        <h2>${escapeHtml(product.title)}</h2>
        <p>${escapeHtml(product.shortDescription)}</p>
        <div class="catalog-card__meta"><strong>${escapeHtml(product.priceDisplay)}</strong>${product.personalized ? '<span class="badge">Personalizable</span>' : ''}</div>
        ${action}
      </div>
    </article>`;
  };

  const matchesArray = (product, key, value) => !value || product[key].includes(value);
  const render = () => {
    const term = search.value.trim().toLowerCase();
    const selected = Object.fromEntries(selects.map((select) => [select.dataset.filter, select.value]));
    const filtered = products.filter((product) => {
      const searchable = [product.title, product.shortDescription, ...product.tags].join(" ").toLowerCase();
      return product.active && (!term || searchable.includes(term)) && matchesArray(product, "categories", selected.categories) && matchesArray(product, "occasions", selected.occasions) && matchesArray(product, "recipients", selected.recipients);
    });
    grid.innerHTML = filtered.map(productCard).join("");
    count.textContent = `${filtered.length} ${filtered.length === 1 ? "result" : "results"}`;
    empty.hidden = filtered.length > 0;
  };

  form.addEventListener("input", render);
  form.addEventListener("submit", (event) => event.preventDefault());
  clearButton.addEventListener("click", () => { form.reset(); render(); search.focus(); });

  fetch("data/products.json")
    .then((response) => { if (!response.ok) throw new Error("Catalog unavailable"); return response.json(); })
    .then((data) => { products = data.products; render(); })
    .catch(() => {
      grid.innerHTML = '<div class="catalog-load-error"><h2>Catalog preview needs a local server</h2><p>Open this site through a local preview server to load the demonstration catalog, or browse the complete shop on Etsy.</p><a class="button button--forest" href="https://kennedylaserworks.etsy.com/" target="_blank" rel="noopener">Browse Etsy <span aria-hidden="true">↗</span></a></div>';
      count.textContent = "Catalog preview unavailable";
    });
})();
