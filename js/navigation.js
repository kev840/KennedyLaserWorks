(() => {
  "use strict";

  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector(".nav-toggle");
  const navigation = document.querySelector(".primary-nav");

  if (!header || !toggle || !navigation) return;

  const setMenuState = (isOpen) => {
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    navigation.classList.toggle("is-open", isOpen);
    document.body.classList.toggle("nav-open", isOpen);
  };

  toggle.addEventListener("click", () => {
    setMenuState(toggle.getAttribute("aria-expanded") !== "true");
  });

  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenuState(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setMenuState(false);
      toggle.focus();
    }
    if (event.key === "Tab" && toggle.getAttribute("aria-expanded") === "true") {
      const focusable = [toggle, ...navigation.querySelectorAll("a[href]")];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
  let scrollFrame = 0;
  const queueHeaderUpdate = () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0;
      updateHeader();
    });
  };
  updateHeader();
  window.addEventListener("scroll", queueHeaderUpdate, { passive: true });

  const mediaQuery = window.matchMedia("(min-width: 56.01rem)");
  const handleViewportChange = ({ matches }) => {
    if (matches) setMenuState(false);
  };
  if (mediaQuery.addEventListener) mediaQuery.addEventListener("change", handleViewportChange);
  else mediaQuery.addListener(handleViewportChange);
})();
