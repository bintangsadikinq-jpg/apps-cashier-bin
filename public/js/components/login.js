import { api } from '../api.js';
import { setState } from '../state.js';

/** Dialog password. Mengembalikan Promise<boolean>: true bila berhasil masuk. */
export function ensureLogin() {
  const dialog = document.getElementById('login-dialog');
  const form = dialog.querySelector('#login-form');
  const input = dialog.querySelector('#login-password');
  const error = dialog.querySelector('#login-error');
  const submit = dialog.querySelector('#login-submit');

  input.value = '';
  error.textContent = '';

  return new Promise((resolve) => {
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      form.removeEventListener('submit', onSubmit);
      dialog.removeEventListener('cancel', onCancel);
      dialog.removeEventListener('click', onCancelClick);
      dialog.close();
      resolve(ok);
    };

    async function onSubmit(e) {
      e.preventDefault();
      submit.disabled = true;
      error.textContent = '';
      try {
        await api.login(input.value);
        setState({ authed: true });
        finish(true);
      } catch (err) {
        error.textContent = err.message;
        input.select();
      } finally {
        submit.disabled = false;
      }
    }
    const onCancel = (e) => { e.preventDefault(); finish(false); };
    const onCancelClick = (e) => { if (e.target.closest('[data-cancel]')) finish(false); };

    form.addEventListener('submit', onSubmit);
    dialog.addEventListener('cancel', onCancel);
    dialog.addEventListener('click', onCancelClick);
    dialog.showModal();
    input.focus();
  });
}
