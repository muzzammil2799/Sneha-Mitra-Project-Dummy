/* Shared helpers for form feedback.
   setState : red border + message under the field when `message` is set,
              green border when the field has a value and no message.
   focus    : scroll to a field and put the cursor in it. */
(function (window) {
  'use strict';

  function setState(input, errorBox, message) {
    input.classList.remove('is-invalid', 'is-valid');
    input.removeAttribute('aria-invalid');
    errorBox.textContent = message || '';
    if (message) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
    } else if (input.value !== '') {
      input.classList.add('is-valid');
    }
  }

  function focus(input) {
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input.focus({ preventScroll: true });
  }

  window.FormCheck = { setState: setState, focus: focus };
})(window);
