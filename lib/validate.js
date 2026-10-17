import { HttpError } from './http.js';
import { findStore } from './stores.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ITEMS = 100;

const toInt = (v) => Math.round(Number(v) || 0);
const toQty = (v) => Math.round((Number(v) || 0) * 1000) / 1000;
const text = (v, max) => String(v ?? '').trim().slice(0, max);

/** Validasi & normalisasi input nota. Total selalu dihitung ulang di server. */
export function parseNota(input) {
  const store = findStore(input.storeId);
  if (!store) throw new HttpError(400, 'Pilih toko terlebih dahulu');

  const tanggal = text(input.tanggal, 10);
  if (!DATE_RE.test(tanggal)) throw new HttpError(400, 'Tanggal tidak valid');

  const items = (Array.isArray(input.items) ? input.items : [])
    .map((it) => ({
      nama: text(it.nama, 200),
      jumlah: toQty(it.jumlah),
      harga: toInt(it.harga),
    }))
    .filter((it) => it.nama);

  if (!items.length) throw new HttpError(400, 'Isi minimal satu barang');
  if (items.length > MAX_ITEMS) throw new HttpError(400, `Maksimal ${MAX_ITEMS} barang per nota`);
  if (items.some((it) => it.jumlah <= 0)) throw new HttpError(400, 'Jumlah barang harus lebih dari 0');
  if (items.some((it) => it.harga < 0)) throw new HttpError(400, 'Harga tidak boleh negatif');

  items.forEach((it, i) => {
    it.urutan = i + 1;
    it.total = Math.round(it.jumlah * it.harga);
  });

  const subtotal = items.reduce((sum, it) => sum + it.total, 0);
  const diskon = Math.min(Math.max(toInt(input.diskon), 0), subtotal);

  return {
    store,
    tanggal,
    pelanggan: text(input.pelanggan, 120),
    catatan: text(input.catatan, 1000),
    items,
    subtotal,
    diskon,
    total: subtotal - diskon,
  };
}
