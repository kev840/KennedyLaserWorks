(() => {
  "use strict";

  const root = document.querySelector("[data-custom-projects]");
  const grid = document.querySelector("[data-custom-project-grid]");
  const workshopGrid = document.querySelector("[data-workshop-photos]");
  const viewer = document.querySelector("[data-custom-project-viewer]");
  const viewerContent = document.querySelector("[data-custom-project-viewer-content]");
  const lightbox = document.querySelector("[data-custom-lightbox]");
  const lightboxImage = lightbox?.querySelector("[data-custom-lightbox-image]");
  const lightboxSource = lightbox?.querySelector("[data-custom-lightbox-source]");
  const lightboxCaption = lightbox?.querySelector("[data-custom-lightbox-caption]");
  const lightboxPosition = lightbox?.querySelector("[data-custom-lightbox-position]");
  const tools = window.KLWProductGallery;
  if (!root || !grid || !tools) return;

  let projects = [];
  let activeProject = null;
  let activeGallery = [];
  let activeIndex = 0;
  let viewerOpener = null;
  let lightboxOpener = null;
  let viewerSwipeX = 0;
  let lightboxSwipeX = 0;

  const imageRecord = (image) => ({ ...image, webp: image.src || image.webp, fallback: image.fallback || image.src });
  const projectImages = (project) => project.images.map(imageRecord);
  const imageBySource = (project, source) => projectImages(project).find((image) => image.src === source || image.webp === source) || projectImages(project)[0];
  const badgeClass = (category = "") => category.includes("REFERENCE") ? "reference" : category.includes("PROGRESS") ? "progress" : category.includes("FINISHED") ? "finished" : "";
  const badgeMarkup = (image) => image.category ? `<span class="custom-project-badge custom-project-badge--${tools.escapeHtml(badgeClass(image.category))}">${tools.escapeHtml(image.category)}</span>` : "";
  const picture = (image, options = {}) => tools.picture(imageRecord(image), options);

  const cardMarkup = (project) => {
    const hero = imageBySource(project, project.heroImage);
    return `<article class="custom-project-card" data-custom-project-id="${tools.escapeHtml(project.id)}">
      <button class="custom-project-card__image" type="button" data-open-custom-project="${tools.escapeHtml(project.id)}" aria-label="View project: ${tools.escapeHtml(project.title)}">
        ${picture(hero)}
        <span class="custom-project-card__quick-label">View Project</span>
      </button>
      <div class="custom-project-card__body">
        <p class="catalog-card__category">${tools.escapeHtml(project.type)}</p>
        <h3>${tools.escapeHtml(project.cardTitle || project.title)}</h3>
        <p class="custom-project-card__type">${tools.escapeHtml(project.type)}</p>
        <button class="button button--outline" type="button" data-open-custom-project="${tools.escapeHtml(project.id)}">View Project</button>
      </div>
    </article>`;
  };

  const workshopMarkup = (images) => images.map((image) => `<figure>${picture(image, { loading: "lazy" })}</figure>`).join("");

  const viewerMarkup = (project) => {
    const first = activeGallery[0];
    return `<div class="custom-project-viewer__layout">
      <div class="custom-project-viewer__gallery" data-custom-swipe-gallery>
        <div class="custom-project-viewer__main">
          <button class="custom-project-viewer__zoom" type="button" data-open-custom-lightbox="0" aria-label="${activeGallery.length > 1 ? "View all photos for" : "View photo of"} ${tools.escapeHtml(project.title)}">
            ${picture(first, { loading: "eager" })}
            <span>${activeGallery.length > 1 ? "View All Photos" : "View Photo"}</span>
          </button>
          ${activeGallery.length > 1 ? `<button class="gallery-arrow gallery-arrow--previous" type="button" data-custom-gallery-prev aria-label="Previous project image">←</button><button class="gallery-arrow gallery-arrow--next" type="button" data-custom-gallery-next aria-label="Next project image">→</button><span class="gallery-position" data-custom-gallery-position aria-live="polite">1 of ${activeGallery.length}</span>` : ""}
        </div>
        ${activeGallery.length > 1 ? `<div class="custom-project-viewer__thumbs" aria-label="Project images">${activeGallery.map((image, index) => `<button type="button" data-custom-gallery-index="${index}" class="${index === 0 ? "is-current" : ""}" aria-label="Show image ${index + 1} of ${activeGallery.length}" aria-pressed="${index === 0}">${picture(image, { decorative: true })}</button>`).join("")}</div>` : ""}
      </div>
      <article class="custom-project-viewer__copy">
        <p class="section-kicker">${tools.escapeHtml(project.type)}</p>
        <h2 id="custom-project-viewer-title">${tools.escapeHtml(project.title)}</h2>
        <p class="custom-project-viewer__type">${tools.escapeHtml(project.type)}</p>
        <div class="custom-project-viewer__description">${project.description.map((paragraph) => `<p>${tools.escapeHtml(paragraph)}</p>`).join("")}</div>
        <div class="custom-project-viewer__image-text" data-custom-image-text>${imageTextMarkup(first)}</div>
        ${project.disclosure ? `<p class="custom-project-disclosure">${tools.escapeHtml(project.disclosure)}</p>` : ""}
        <a class="button button--forest" href="custom-work.html#inquiry">Start a Custom Project <span aria-hidden="true">→</span></a>
      </article>
    </div>`;
  };

  const imageTextMarkup = (image) => `${badgeMarkup(image)}<p class="custom-project-viewer__label">${tools.escapeHtml(image.label)}</p><p class="custom-project-viewer__caption">${tools.escapeHtml(image.caption)}</p>`;

  const openViewer = (id, opener) => {
    const project = projects.find((item) => item.id === id);
    if (!project || !viewer || !viewerContent) return;
    activeProject = project;
    activeGallery = projectImages(project);
    activeIndex = 0;
    viewerOpener = opener;
    viewerContent.innerHTML = viewerMarkup(project);
    window.KLW?.enhanceImages(viewerContent);
    tools.preloadNext(activeGallery, 0);
    if (!viewer.open) viewer.showModal();
    viewer.scrollTop = 0;
    const url = new URL(window.location.href);
    url.searchParams.set("project", id);
    window.history.replaceState(null, "", url);
  };

  const updateViewerImage = (index) => {
    if (!activeGallery.length || !viewerContent) return;
    activeIndex = (index + activeGallery.length) % activeGallery.length;
    const image = activeGallery[activeIndex];
    const zoom = viewerContent.querySelector("[data-open-custom-lightbox]");
    if (zoom) {
      zoom.classList.add("is-changing");
      zoom.dataset.openCustomLightbox = String(activeIndex);
      zoom.querySelector("picture")?.remove();
      zoom.insertAdjacentHTML("afterbegin", picture(image, { loading: "eager" }));
      window.KLW?.enhanceImages(zoom);
      window.requestAnimationFrame(() => zoom.classList.remove("is-changing"));
    }
    viewerContent.querySelectorAll("[data-custom-gallery-index]").forEach((button) => {
      const current = Number(button.dataset.customGalleryIndex) === activeIndex;
      button.classList.toggle("is-current", current);
      button.setAttribute("aria-pressed", String(current));
      if (current) button.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    const position = viewerContent.querySelector("[data-custom-gallery-position]");
    if (position) position.textContent = `${activeIndex + 1} of ${activeGallery.length}`;
    const text = viewerContent.querySelector("[data-custom-image-text]");
    if (text) text.innerHTML = imageTextMarkup(image);
    tools.preloadNext(activeGallery, activeIndex);
  };

  const showLightboxImage = (index) => {
    if (!activeGallery.length || !lightboxImage) return;
    activeIndex = (index + activeGallery.length) % activeGallery.length;
    const image = activeGallery[activeIndex];
    if (lightboxSource) lightboxSource.srcset = image.webp || image.fallback;
    lightboxImage.src = image.fallback;
    lightboxImage.alt = image.alt;
    lightboxImage.width = image.width;
    lightboxImage.height = image.height;
    window.KLW?.enhanceImages(lightboxImage);
    if (lightboxCaption) lightboxCaption.textContent = `${image.label}: ${image.caption}`;
    if (lightboxPosition) lightboxPosition.textContent = `${activeIndex + 1} of ${activeGallery.length}`;
    lightbox?.classList.toggle("has-multiple", activeGallery.length > 1);
    updateViewerImage(activeIndex);
  };

  const openLightbox = (index, opener) => {
    if (!lightbox) return;
    lightboxOpener = opener;
    showLightboxImage(index);
    if (!lightbox.open) lightbox.showModal();
  };

  const closeViewer = () => {
    if (viewer?.open) viewer.close();
    viewerOpener?.focus();
  };

  viewer?.addEventListener("close", () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("project");
    window.history.replaceState(null, "", url);
  });

  const closeLightbox = () => {
    if (!lightbox?.open) return;
    lightbox.close();
    lightboxOpener?.focus();
  };

  document.addEventListener("click", (event) => {
    const opener = event.target.closest("[data-open-custom-project]");
    const thumbnail = event.target.closest("[data-custom-gallery-index]");
    const lightboxButton = event.target.closest("[data-open-custom-lightbox]");
    if (opener) openViewer(opener.dataset.openCustomProject, opener);
    if (thumbnail) updateViewerImage(Number(thumbnail.dataset.customGalleryIndex));
    if (event.target.closest("[data-custom-gallery-prev]")) updateViewerImage(activeIndex - 1);
    if (event.target.closest("[data-custom-gallery-next]")) updateViewerImage(activeIndex + 1);
    if (lightboxButton) openLightbox(Number(lightboxButton.dataset.openCustomLightbox), lightboxButton);
    if (event.target.closest("[data-close-custom-viewer]")) closeViewer();
    if (event.target.closest("[data-close-custom-lightbox]")) closeLightbox();
    if (event.target.closest("[data-custom-lightbox-prev]")) showLightboxImage(activeIndex - 1);
    if (event.target.closest("[data-custom-lightbox-next]")) showLightboxImage(activeIndex + 1);
  });

  viewer?.addEventListener("click", (event) => { if (event.target === viewer) closeViewer(); });
  lightbox?.addEventListener("click", (event) => { if (event.target === lightbox) closeLightbox(); });
  viewerContent?.addEventListener("touchstart", (event) => {
    if (activeGallery.length > 1 && event.target.closest("[data-custom-swipe-gallery]")) viewerSwipeX = event.changedTouches[0]?.clientX || 0;
  }, { passive: true });
  viewerContent?.addEventListener("touchend", (event) => {
    if (activeGallery.length < 2 || !viewerSwipeX || !event.target.closest("[data-custom-swipe-gallery]")) return;
    const distance = (event.changedTouches[0]?.clientX || 0) - viewerSwipeX;
    viewerSwipeX = 0;
    if (Math.abs(distance) >= 45) updateViewerImage(activeIndex + (distance < 0 ? 1 : -1));
  }, { passive: true });
  lightbox?.addEventListener("touchstart", (event) => { if (activeGallery.length > 1) lightboxSwipeX = event.changedTouches[0]?.clientX || 0; }, { passive: true });
  lightbox?.addEventListener("touchend", (event) => {
    if (activeGallery.length < 2 || !lightboxSwipeX) return;
    const distance = (event.changedTouches[0]?.clientX || 0) - lightboxSwipeX;
    lightboxSwipeX = 0;
    if (Math.abs(distance) >= 45) showLightboxImage(activeIndex + (distance < 0 ? 1 : -1));
  }, { passive: true });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox?.open) closeLightbox();
    else if (event.key === "Escape" && viewer?.open) closeViewer();
    if (activeGallery.length < 2) return;
    if (event.key === "ArrowLeft" && lightbox?.open) showLightboxImage(activeIndex - 1);
    else if (event.key === "ArrowRight" && lightbox?.open) showLightboxImage(activeIndex + 1);
    else if (event.key === "ArrowLeft" && viewer?.open) updateViewerImage(activeIndex - 1);
    else if (event.key === "ArrowRight" && viewer?.open) updateViewerImage(activeIndex + 1);
  });

  fetch("data/custom-projects.json").then((response) => {
    if (!response.ok) throw new Error("Custom project data unavailable");
    return response.json();
  }).then((data) => {
    projects = data.projects.filter((project) => project.images?.length);
    grid.innerHTML = projects.map(cardMarkup).join("");
    if (workshopGrid) workshopGrid.innerHTML = workshopMarkup(data.workshopImages || []);
    window.KLW?.enhanceImages(root);
    window.KLW?.enhanceImages(workshopGrid);
    const requestedProject = new URLSearchParams(window.location.search).get("project");
    if (requestedProject) openViewer(requestedProject, null);
  }).catch(() => {
    grid.innerHTML = '<div class="catalog-load-error"><h2>Custom projects could not load</h2><p>Please refresh the page or contact Kennedy Laser Works to discuss a custom project.</p><a class="button button--forest" href="custom-work.html#inquiry">Start a Custom Project</a></div>';
  });
})();
