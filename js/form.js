(() => {
  "use strict";
  const form = document.querySelector("[data-quote-form]");
  if (!form) return;
  const status = form.querySelector("[data-form-status]");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const subject = `Custom project inquiry — ${data.get("projectType")}`;
    const body = [
      `Name: ${data.get("name")}`,
      `Email: ${data.get("email")}`,
      `Project type: ${data.get("projectType")}`,
      `Approximate size: ${data.get("size") || "Not specified"}`,
      `Desired wording: ${data.get("wording") || "Not specified"}`,
      `Needed by: ${data.get("neededBy") || "Flexible"}`,
      `Budget range: ${data.get("budget") || "Not specified"}`,
      "",
      "Project description:",
      data.get("description")
    ].join("\n");
    status.textContent = "Your email application is opening with the project details filled in. Please send the email to complete your request.";
    window.location.href = `mailto:kennedylaserworks@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
