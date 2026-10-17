import { createClient } from '@libsql/client';
import { mkdirSync } from 'node:fs';
import { SCHEMA } from './schema.js';
import { STORES } from './stores.js';

/**
 * Pemilihan penyimpanan:
 *  1. TURSO_DATABASE_URL ada  → SQLite terkelola (Turso/libSQL), permanen. Dipakai di Vercel.
 *  2. Jalan di Vercel tanpa Turso → SQLite di /tmp (langsung jalan, tapi data bisa hilang).
 *  3. Lokal                     → file data/kasir.db
 */
function resolveConfig() {
  if (process.env.TURSO_DATABASE_URL) {
    return {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
      mode: 'turso',
    };
  }
  if (process.env.VERCEL) {
    return { url: 'file:/tmp/kasir.db', mode: 'sementara' };
  }
  mkdirSync('data', { recursive: true });
  return { url: 'file:data/kasir.db', mode: 'lokal' };
}

const config = resolveConfig();
export const storageMode = config.mode;

let client;
let ready;

export function getDb() {
  if (!client) {
    client = createClient({ url: config.url, authToken: config.authToken });
  }
  if (!ready) {
    ready = migrate(client).catch((err) => {
      ready = null; // biarkan request berikutnya mencoba lagi
      throw err;
    });
  }
  return ready.then(() => client);
}

async function migrate(db) {
  await db.execute('PRAGMA foreign_keys = ON').catch(() => {});
  await db.batch(SCHEMA, 'write');
  await db.batch(
    STORES.map((s) => ({
      sql: `INSERT INTO stores (id, name, prefix) VALUES (?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET name = excluded.name, prefix = excluded.prefix`,
      args: [s.id, s.name, s.prefix],
    })),
    'write'
  );
}
