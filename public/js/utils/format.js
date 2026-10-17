const numberFmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
const qtyFmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 });
const dateShort = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const dateLong = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

export const formatNumber = (n) => numberFmt.format(Math.round(Number(n) || 0));
export const formatRupiah = (n) => `Rp ${formatNumber(n)}`;
export const formatQty = (n) => qtyFmt.format(Number(n) || 0);

const toDate = (iso) => new Date(`${iso}T00:00:00`);
export const formatDate = (iso) => (iso ? dateShort.format(toDate(iso)) : '');
export const formatDateLong = (iso) => (iso ? dateLong.format(toDate(iso)) : '');

export function todayISO() {
  const d = new Date();
  const pad = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "Rp 150.000" / "150.000" / "150000,00" → 150000. Kosong → null. */
export function parseRupiah(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value) : null;
  const main = String(value).split(',')[0];
  const digits = main.replace(/[^\d-]/g, '');
  if (!digits || digits === '-') return null;
  return parseInt(digits, 10);
}

/** "1,5" / "1.5" / "2 pcs" → angka. Kosong → null. */
export function parseQty(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(',', '.').replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? Math.round(n * 1000) / 1000 : null;
}

export const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function debounce(fn, ms = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
