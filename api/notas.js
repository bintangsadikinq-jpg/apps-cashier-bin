import { handler, readBody, HttpError } from '../lib/http.js';
import { parseNota } from '../lib/validate.js';
import { requireAuth } from '../lib/auth.js';
import { listNotas, getNota, createNota, updateNota, deleteNota } from '../lib/notas-repo.js';

/**
 * Membuat nota (POST) terbuka untuk kasir; melihat riwayat, mengubah, dan menghapus butuh login.
 *
 * GET    /api/notas                     → daftar (?store=&q=&from=&to=)
 * GET    /api/notas?id=12               → detail + item
 * POST   /api/notas                     → buat nota baru
 * PUT    /api/notas?id=12               → ubah nota
 * DELETE /api/notas?id=12               → hapus nota
 */
const requireId = (req) => {
  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Parameter id wajib diisi');
  return id;
};

export default handler({
  GET: (req) => {
    requireAuth(req);
    if (req.query.id) return getNota(requireId(req));
    const { store, q, from, to, limit } = req.query;
    return listNotas({ storeId: store, q: q?.trim(), from, to, limit });
  },
  POST: async (req, res) => {
    const nota = await createNota(parseNota(readBody(req)));
    res.status(201).json(nota);
  },
  PUT: (req) => {
    requireAuth(req);
    return updateNota(requireId(req), parseNota(readBody(req)));
  },
  DELETE: (req) => {
    requireAuth(req);
    return deleteNota(requireId(req));
  },
});
