import { handler, readBody, HttpError } from '../lib/http.js';
import { authConfigured, isAuthed, passwordMatches, startSession, endSession } from '../lib/auth.js';

/**
 * GET    /api/auth  → { authed, configured }
 * POST   /api/auth  → login { password }
 * DELETE /api/auth  → logout
 */
export default handler({
  GET: (req) => ({ authed: isAuthed(req), configured: authConfigured() }),
  POST: async (req, res) => {
    if (!authConfigured()) throw new HttpError(503, 'APP_PASSWORD belum diatur di server');
    if (!passwordMatches(readBody(req).password)) {
      await new Promise((r) => setTimeout(r, 700)); // perlambat tebak-tebakan
      throw new HttpError(401, 'Password salah');
    }
    startSession(res);
    return { authed: true };
  },
  DELETE: (req, res) => {
    endSession(res);
    return { authed: false };
  },
});
