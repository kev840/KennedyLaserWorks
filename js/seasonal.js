(() => {
  "use strict";

  /* Edit this schedule to change homepage seasonal promotion. Months are 1–12. */
  const seasonalSchedule = {
    1: { label: "Winter gifting", title: "Made personal for the people you love", categories: ["Personalized Gifts", "Home Decor", "Christmas & Winter"] },
    2: { label: "Valentine’s season", title: "Keepsakes made for your favorite person", categories: ["Personalized Gifts", "Weddings & Anniversaries", "Home Decor"] },
    3: { label: "Spring celebrations", title: "Fresh details for brighter days", categories: ["Home Decor", "Religious & Inspirational", "Personalized Gifts"] },
    4: { label: "Easter & spring", title: "Handcrafted accents for gathering season", categories: ["Religious & Inspirational", "Home Decor", "Personalized Gifts"] },
    5: { label: "Mother’s Day & graduation", title: "Celebrate every proud moment", categories: ["Personalized Gifts", "Profession Gifts", "Home Decor"] },
    6: { label: "Weddings & Father’s Day", title: "For milestones worth remembering", categories: ["Weddings & Anniversaries", "Personalized Gifts", "Custom Projects"] },
    7: { label: "America 250", title: "Crafted for a landmark American year", categories: ["Patriotic & Americana", "Home Decor", "Custom Projects"] },
    8: { label: "Early fall", title: "Warm details for home and harvest", categories: ["Halloween & Fall", "Home Decor", "Personalized Gifts"] },
    9: { label: "Fall & Halloween", title: "Gather, decorate, and make it yours", categories: ["Halloween & Fall", "Home Decor", "Ornaments"] },
    10: { label: "Halloween, with Christmas coming", title: "Spooky season now. Holiday magic next.", categories: ["Halloween & Fall", "Christmas & Winter", "Ornaments"] },
    11: { label: "Holiday gifting", title: "Order meaningful gifts before the rush", categories: ["Christmas & Winter", "Ornaments", "Personalized Gifts"] },
    12: { label: "Christmas at Kennedy Laser Works", title: "Names, memories, and holiday traditions", categories: ["Christmas & Winter", "Ornaments", "Personalized Gifts"] }
  };

  const section = document.querySelector("[data-seasonal]");
  if (!section) return;
  const current = seasonalSchedule[new Date().getMonth() + 1];
  section.querySelector("[data-season-label]").textContent = current.label;
  section.querySelector("[data-season-title]").textContent = current.title;
  section.querySelector("[data-season-links]").innerHTML = current.categories.map((category) => `<a href="collections.html?category=${encodeURIComponent(category)}">${category}<span aria-hidden="true">→</span></a>`).join("");
})();
