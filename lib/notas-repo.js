import { getDb } from './db.js';
import { HttpError } from './http.js';

const mapNota = (r) => ({
  id: Number(r.id),
  storeId: r.store_id,
  nomor: r.nomor,
  tanggal: r.tanggal,
  pelanggan: r.pelanggan,
  catatan: r.catatan,
  subtotal: Number(r.subtotal),
  diskon: Number(r.diskon),
  total: Number(r.total),
  itemCount: r.item_count != null ? Number(r.item_count) : undefined,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapItem = (r) => ({
  nama: r.nama,
  jumlah: Number(r.jumlah),
  harga: Number(r.harga),
  total: Number(r.total),
});

/** Nomor nota: PREFIX-YYYYMMDD-001, berurutan per toko per hari. */
async function nextNomor(db, store, tanggal) {
  const base = `${store.prefix}-${tanggal.replaceAll('-', '')}-`;
  const { rows } = await db.execute({
    sql: `SELECT nomor FROM notas WHERE store_id = ? AND nomor LIKE ? ORDER BY nomor DESC LIMIT 1`,
    args: [store.id, `${base}%`],
  });
  const last = rows[0] ? parseInt(String(rows[0].nomor).slice(base.length), 10) || 0 : 0;
  return base + String(last + 1).padStart(3, '0');
}

const itemInserts = (items, notaIdSql, notaIdArgs) =>
  items.map((it) => ({
    sql: `INSERT INTO nota_items (nota_id, urutan, nama, jumlah, harga, total)
          VALUES (${notaIdSql}, ?, ?, ?, ?, ?)`,
    args: [...notaIdArgs, it.urutan, it.nama, it.jumlah, it.harga, it.total],
  }));

const isUniqueError = (err) => /UNIQUE/i.test(String(err?.message));

export async function listNotas({ storeId, q, from, to, limit = 200 }) {
  const db = await getDb();
  const where = [];
  const args = [];
  if (storeId) { where.push('n.store_id = ?'); args.push(storeId); }
  if (from) { where.push('n.tanggal >= ?'); args.push(from); }
  if (to) { where.push('n.tanggal <= ?'); args.push(to); }
  if (q) {
    where.push(`(n.nomor LIKE ? OR n.pelanggan LIKE ? OR EXISTS (
                 SELECT 1 FROM nota_items i WHERE i.nota_id = n.id AND i.nama LIKE ?))`);
    args.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  const { rows } = await db.execute({
    sql: `SELECT n.*, (SELECT COUNT(*) FROM nota_items i WHERE i.nota_id = n.id) AS item_count
          FROM notas n
          ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
          ORDER BY n.tanggal DESC, n.id DESC
          LIMIT ?`,
    args: [...args, Math.min(Number(limit) || 200, 500)],
  });
  return rows.map(mapNota);
}

export async function getNota(id) {
  const db = await getDb();
  const [notaRes, itemRes] = await db.batch(
    [
      { sql: 'SELECT * FROM notas WHERE id = ?', args: [id] },
      { sql: 'SELECT * FROM nota_items WHERE nota_id = ? ORDER BY urutan', args: [id] },
    ],
    'read'
  );
  if (!notaRes.rows[0]) throw new HttpError(404, 'Nota tidak ditemukan');
  return { ...mapNota(notaRes.rows[0]), items: itemRes.rows.map(mapItem) };
}

export async function createNota(n) {
  const db = await getDb();
  for (let attempt = 0; attempt < 3; attempt++) {
    const nomor = await nextNomor(db, n.store, n.tanggal);
    try {
      await db.batch(
        [
          {
            sql: `INSERT INTO notas (store_id, nomor, tanggal, pelanggan, catatan, subtotal, diskon, total)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [n.store.id, nomor, n.tanggal, n.pelanggan, n.catatan, n.subtotal, n.diskon, n.total],
          },
          ...itemInserts(n.items, '(SELECT id FROM notas WHERE store_id = ? AND nomor = ?)', [n.store.id, nomor]),
        ],
        'write'
      );
      const { rows } = await db.execute({
        sql: 'SELECT id FROM notas WHERE store_id = ? AND nomor = ?',
        args: [n.store.id, nomor],
      });
      return getNota(Number(rows[0].id));
    } catch (err) {
      if (!isUniqueError(err)) throw err; // nomor bentrok → coba nomor berikutnya
    }
  }
  throw new HttpError(409, 'Nomor nota bentrok, coba simpan lagi');
}

export async function updateNota(id, n) {
  const db = await getDb();
  const current = await getNota(id);

  // Pindah toko atau ganti tanggal → nomor baru sesuai toko/tanggal tersebut.
  const needsNewNomor = current.storeId !== n.store.id || current.tanggal !== n.tanggal;
  const nomor = needsNewNomor ? await nextNomor(db, n.store, n.tanggal) : current.nomor;

  await db.batch(
    [
      {
        sql: `UPDATE notas SET store_id = ?, nomor = ?, tanggal = ?, pelanggan = ?, catatan = ?,
                subtotal = ?, diskon = ?, total = ?, updated_at = datetime('now')
              WHERE id = ?`,
        args: [n.store.id, nomor, n.tanggal, n.pelanggan, n.catatan, n.subtotal, n.diskon, n.total, id],
      },
      { sql: 'DELETE FROM nota_items WHERE nota_id = ?', args: [id] },
      ...itemInserts(n.items, '?', [id]),
    ],
    'write'
  );
  return getNota(id);
}

export async function deleteNota(id) {
  const db = await getDb();
  await db.batch(
    [
      { sql: 'DELETE FROM nota_items WHERE nota_id = ?', args: [id] },
      { sql: 'DELETE FROM notas WHERE id = ?', args: [id] },
    ],
    'write'
  );
  return { ok: true };
}
