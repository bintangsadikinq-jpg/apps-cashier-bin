import { handler } from '../lib/http.js';
import { STORES } from '../lib/stores.js';
import { getDb, storageMode } from '../lib/db.js';

// GET /api/stores → daftar toko + mode penyimpanan (dipakai UI untuk badge)
export default handler({
  GET: async () => {
    await getDb(); // pastikan tabel sudah dibuat
    return { stores: STORES, storage: storageMode };
  },
});
