export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS stores (
     id      TEXT PRIMARY KEY,
     name    TEXT NOT NULL,
     prefix  TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS notas (
     id          INTEGER PRIMARY KEY AUTOINCREMENT,
     store_id    TEXT    NOT NULL REFERENCES stores(id),
     nomor       TEXT    NOT NULL,
     tanggal     TEXT    NOT NULL,
     pelanggan   TEXT    NOT NULL DEFAULT '',
     catatan     TEXT    NOT NULL DEFAULT '',
     subtotal    INTEGER NOT NULL DEFAULT 0,
     diskon      INTEGER NOT NULL DEFAULT 0,
     total       INTEGER NOT NULL DEFAULT 0,
     created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
     updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
     UNIQUE (store_id, nomor)
   )`,
  `CREATE TABLE IF NOT EXISTS nota_items (
     id       INTEGER PRIMARY KEY AUTOINCREMENT,
     nota_id  INTEGER NOT NULL REFERENCES notas(id) ON DELETE CASCADE,
     urutan   INTEGER NOT NULL,
     nama     TEXT    NOT NULL,
     jumlah   REAL    NOT NULL DEFAULT 1,
     harga    INTEGER NOT NULL DEFAULT 0,
     total    INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE INDEX IF NOT EXISTS idx_notas_store_tanggal ON notas (store_id, tanggal)`,
  `CREATE INDEX IF NOT EXISTS idx_items_nota ON nota_items (nota_id)`,
];
