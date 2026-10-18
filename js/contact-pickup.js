(() => {
  "use strict";

  const pickupLink = document.querySelector("[data-pickup-inquiry]");
  const description = document.getElementById("contact-description");
  if (!pickupLink || !description) return;

  pickupLink.addEventListener("click", () => {
    if (description.value.trim()) return;
    description.value = "I'd like to arrange local pickup for my order.";
    description.dispatchEvent(new Event("input", { bubbles: true }));
  });
})();
