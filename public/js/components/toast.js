const region = () => document.getElementById('toast-region');

export function toast(message, { type = 'info', duration = 2800 } = {}) {
  const el = document.createElement('div');
  el.className = `toast${type === 'error' ? ' toast--error' : ''}`;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.textContent = message;
  region().append(el);
  setTimeout(() => el.remove(), duration);
}
