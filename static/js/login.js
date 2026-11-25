/* Login page: validate fields while typing and before submitting. */
(function () {
  'use strict';

  const form = document.getElementById('loginForm');
  if (!form) return;

  const USER_ID_RE = /^[A-Za-z0-9_.@+-]{3,30}$/;

  const fields = [
    {
      input: document.getElementById('user_id'),
      box: document.getElementById('e_user_id'),
      check: (raw) => {
        const value = raw.trim();
        if (!value) return 'Enter your User ID';
        if (!USER_ID_RE.test(value)) return '3 to 30 letters or numbers, no spaces';
        return '';
      }
    },
    {
      input: document.getElementById('password'),
      box: document.getElementById('e_password'),
      check: (value) => (value ? '' : 'Enter your password')
    }
  ];

  function validate(field, showEmpty) {
    let message = field.check(field.input.value);
    if (!showEmpty && field.input.value === '') message = '';
    FormCheck.setState(field.input, field.box, message);
    return message;
  }

  fields.forEach((field) => {
    field.input.addEventListener('input', () => validate(field, false));
  });

  form.addEventListener('submit', (event) => {
    let firstBad = null;
    fields.forEach((field) => {
      if (validate(field, true) && !firstBad) firstBad = field.input;
    });
    if (firstBad) {
      event.preventDefault();
      FormCheck.focus(firstBad);
    }
  });

  const wrong = form.querySelector('.is-invalid');
  if (wrong) FormCheck.focus(wrong);
  else document.getElementById('user_id').focus();
})();
