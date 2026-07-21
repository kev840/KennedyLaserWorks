(() => {
  "use strict";

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  const featured = document.querySelector("[data-featured]");
  if (featured) {
    const track = featured.querySelector("[data-carousel-track]");
    const slides = [...featured.querySelectorAll("[data-carousel-slide]")];
    const currentLabel = featured.querySelector("[data-carousel-current]");
    const carousel = featured.querySelector(".collection-carousel");
    const previous = featured.querySelector("[data-carousel-prev]");
    const next = featured.querySelector("[data-carousel-next]");
    let activeIndex = 0;
    let timer;

    const restartProgress = () => {
      carousel.classList.remove("is-playing");
      void carousel.offsetWidth;
      carousel.classList.add("is-playing");
    };

    const startRotation = () => {
      window.clearInterval(timer);
      restartProgress();
      timer = window.setInterval(() => showSlide(activeIndex + 1, false), 7000);
    };

    const showSlide = (index, restart = true) => {
      activeIndex = (index + slides.length) % slides.length;
      track.style.transform = `translateX(-${activeIndex * 100}%)`;
      slides.forEach((slide, slideIndex) => {
        const isCurrent = slideIndex === activeIndex;
        slide.classList.toggle("is-current", isCurrent);
        slide.setAttribute("aria-hidden", String(!isCurrent));
      });
      currentLabel.textContent = String(activeIndex + 1).padStart(2, "0");
      if (restart) startRotation();
      else restartProgress();
    };

    previous.addEventListener("click", () => showSlide(activeIndex - 1));
    next.addEventListener("click", () => showSlide(activeIndex + 1));
    carousel.addEventListener("mouseenter", () => { window.clearInterval(timer); carousel.classList.remove("is-playing"); });
    carousel.addEventListener("mouseleave", startRotation);
    carousel.addEventListener("focusin", () => window.clearInterval(timer));
    carousel.addEventListener("focusout", startRotation);
    document.addEventListener("visibilitychange", () => document.hidden ? window.clearInterval(timer) : startRotation());
    startRotation();
  }

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
