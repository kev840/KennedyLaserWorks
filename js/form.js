(() => {
  "use strict";

  const emailMessage = "Enter a complete email address, such as name@example.com.";
  const maxFiles = 5;
  const maxFileSize = 10 * 1024 * 1024;
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
  const allowedExtensions = new Set(["jpg", "jpeg", "png", "webp", "pdf"]);

  document.querySelectorAll("[data-quote-form]").forEach((form) => {
    const email = form.querySelector('input[name="email"]');
    const emailError = form.querySelector("[data-email-error]");
    const fileInput = form.querySelector('input[type="file"]');
    const fileError = form.querySelector("[data-file-error]");
    const selectedFiles = form.querySelector("[data-selected-files]");
    const status = form.querySelector("[data-form-status]");
    const submitButton = form.querySelector("[data-submit-button]");
    const defaultButtonContent = submitButton.innerHTML;
    const success = document.getElementById(form.dataset.basinSuccessId);
    const error = document.getElementById(form.dataset.basinErrorId);

    const validateEmail = () => {
      const value = email.value.trim();
      const complete = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]{2,})+$/.test(value);
      email.setCustomValidity(value && !complete ? emailMessage : "");
      emailError.textContent = value && !complete ? emailMessage : "";
      email.setAttribute("aria-invalid", value && !complete ? "true" : "false");
      return !value || complete;
    };

    const validateFiles = () => {
      const files = Array.from(fileInput.files);
      let message = "";
      if (files.length > maxFiles) {
        message = "Attach no more than 5 files.";
      } else if (files.some((file) => file.size > maxFileSize)) {
        message = "Each file must be 10 MB or smaller.";
      } else if (files.some((file) => {
        const extension = file.name.split(".").pop().toLowerCase();
        return !allowedExtensions.has(extension) || (file.type && !allowedTypes.has(file.type));
      })) {
        message = "Attach only JPG, JPEG, PNG, WEBP, or PDF files.";
      }
      fileError.textContent = message;
      fileInput.setCustomValidity(message);
      fileInput.setAttribute("aria-invalid", message ? "true" : "false");
      selectedFiles.replaceChildren();
      files.forEach((file) => {
        const item = document.createElement("li");
        item.textContent = file.name;
        selectedFiles.append(item);
      });
      return !message;
    };

    email.addEventListener("input", validateEmail);
    fileInput.addEventListener("change", validateFiles);
    form.querySelectorAll('input[type="date"]').forEach((input) => {
      const today = new Date();
      today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
      input.min = today.toISOString().slice(0, 10);
    });

    form.addEventListener("submit", (event) => {
      const validEmail = validateEmail();
      const validFiles = validateFiles();
      if (!validEmail || !validFiles || !form.checkValidity()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        form.reportValidity();
        return;
      }
      error.hidden = true;
    }, true);

    const forThisForm = (event) => event.detail && event.detail.form === form;
    document.addEventListener("basinjsFormSubmitted", (event) => {
      if (!forThisForm(event)) return;
      submitButton.disabled = true;
      submitButton.textContent = "SENDING...";
      status.textContent = "Sending your project request...";
    });
    document.addEventListener("basinjsFormSuccess", (event) => {
      if (!forThisForm(event)) return;
      form.reset();
      validateEmail();
      validateFiles();
      status.textContent = "";
      submitButton.disabled = false;
      submitButton.innerHTML = defaultButtonContent;
      error.hidden = true;
      success.hidden = false;
    });
    document.addEventListener("basinjsFormError", (event) => {
      if (!forThisForm(event)) return;
      status.textContent = "";
      submitButton.disabled = false;
      submitButton.innerHTML = defaultButtonContent;
      success.hidden = true;
      error.hidden = false;
    });
  });
})();
