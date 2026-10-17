import { formatRupiah, formatNumber, parseRupiah } from '../utils/format.js';

/**
 * Ringkasan Subtotal / Diskon / Total.
 * Diskon menerima nominal ("50.000") atau persen ("10%").
 */
export function createSummary({ subtotalEl, totalEl, diskonInput, hintEl, onChange }) {
  let subtotal = 0;

  const isPercent = () => /%\s*$/.test(diskonInput.value);

  function diskon() {
    const raw = diskonInput.value.trim();
    if (!raw) return 0;
    let value;
    if (isPercent()) {
      const pct = Math.min(Math.max(parseFloat(raw.replace(',', '.')) || 0, 0), 100);
      value = Math.round((subtotal * pct) / 100);
    } else {
      value = parseRupiah(raw) || 0;
    }
    return Math.min(Math.max(value, 0), subtotal);
  }

  function render() {
    const d = diskon();
    subtotalEl.textContent = formatRupiah(subtotal);
    totalEl.textContent = formatRupiah(subtotal - d);
    hintEl.textContent = isPercent() && d ? `= ${formatRupiah(d)}` : '';
  }

  diskonInput.addEventListener('input', () => { render(); onChange?.(); });
  diskonInput.addEventListener('blur', () => {
    if (!isPercent() && diskonInput.value.trim()) {
      const n = parseRupiah(diskonInput.value);
      diskonInput.value = n ? formatNumber(n) : '';
    }
    render();
  });

  return {
    setSubtotal(v) { subtotal = v; render(); },
    diskon,
    setDiskon(v) { diskonInput.value = v ? formatNumber(v) : ''; render(); },
  };
}
