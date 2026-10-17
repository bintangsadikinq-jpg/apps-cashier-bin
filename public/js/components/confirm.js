/** Dialog konfirmasi berbasis <dialog>. Mengembalikan Promise<boolean>. */
export function confirmDialog({ title, message, okLabel = 'Lanjutkan', danger = false }) {
  const dialog = document.getElementById('confirm-dialog');
  dialog.querySelector('#confirm-title').textContent = title;
  dialog.querySelector('#confirm-message').textContent = message;
  const ok = dialog.querySelector('#confirm-ok');
  ok.textContent = okLabel;
  ok.style.background = danger ? 'var(--danger)' : '';
  ok.style.borderColor = danger ? 'var(--danger)' : '';

  return new Promise((resolve) => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'ok'), { once: true });
    dialog.returnValue = '';
    dialog.showModal();
  });
}
