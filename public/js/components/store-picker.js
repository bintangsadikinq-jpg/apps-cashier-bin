import { escapeHtml } from '../utils/format.js';

/** Kartu pilihan toko (radiogroup yang bisa dipakai keyboard). */
export function createStorePicker(container, { stores, onSelect }) {
  let selected = null;

  container.innerHTML = stores
    .map(
      (s) => `
      <button type="button" class="store-option" role="radio" aria-checked="false"
              data-id="${s.id}" style="--so-accent:${s.accent}" tabindex="-1">
        <img src="${s.logo}" alt="" />
        <span>
          <span class="so-name">${escapeHtml(s.name)}</span>
          <span class="so-meta">Nomor ${escapeHtml(s.prefix)}-…</span>
        </span>
      </button>`
    )
    .join('');

  const buttons = [...container.querySelectorAll('.store-option')];

  function render() {
    buttons.forEach((b, i) => {
      const on = b.dataset.id === selected;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on || (!selected && i === 0) ? 0 : -1;
    });
    container.classList.remove('is-missing');
  }

  function select(id, { silent = false } = {}) {
    selected = id;
    render();
    if (!silent) onSelect?.(id);
  }

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.store-option');
    if (btn) select(btn.dataset.id);
  });

  container.addEventListener('keydown', (e) => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const i = Math.max(0, buttons.findIndex((b) => b.dataset.id === selected));
    const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
    const next = buttons[(i + step + buttons.length) % buttons.length];
    select(next.dataset.id);
    next.focus();
  });

  render();

  return {
    select,
    get value() { return selected; },
    flagMissing() {
      container.classList.add('is-missing');
      buttons[0]?.focus();
    },
  };
}
