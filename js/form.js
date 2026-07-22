(() => {
  "use strict";

  const valueOr = (data, key, fallback = "Not specified") => {
    const value = data.get(key);
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  };

  document.querySelectorAll("[data-quote-form]").forEach((form) => {
    const status = form.querySelector("[data-form-status]");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const data = new FormData(form);
      const projectType = valueOr(data, "projectType", "Custom project");
      const reference = data.get("referenceImage");
      const referenceName = reference instanceof File && reference.name ? reference.name : "None selected";
      const subject = `Custom project inquiry — ${projectType}`;
      const body = [
        `Name: ${valueOr(data, "name")}`,
        `Email: ${valueOr(data, "email")}`,
        `Project type: ${projectType}`,
        `Occasion: ${valueOr(data, "occasion")}`,
        `Approximate size: ${valueOr(data, "size")}`,
        `Desired wording: ${valueOr(data, "wording")}`,
        `Target completion date: ${valueOr(data, "neededBy", "Flexible")}`,
        `Budget range: ${valueOr(data, "budget")}`,
        `Reference image selected: ${referenceName}`,
        "",
        "Project description:",
        valueOr(data, "description")
      ].join("\n");

      status.textContent = referenceName === "None selected"
        ? "Your email application is opening with the project details filled in. Review and send the email to complete your request."
        : "Your email application is opening. Please attach your selected reference image before sending the prepared message.";
      window.location.href = `mailto:kennedylaserworks@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  });
})();
