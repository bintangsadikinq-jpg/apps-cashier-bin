import { rmSync } from 'node:fs';
for (const f of ['data/kasir.db', 'data/kasir.db-wal', 'data/kasir.db-shm']) rmSync(f, { force: true });
console.log('Database lokal dihapus. Akan dibuat ulang saat aplikasi dijalankan.');
