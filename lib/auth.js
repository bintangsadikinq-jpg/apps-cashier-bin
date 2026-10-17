import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { HttpError } from './http.js';

const COOKIE = 'kasir_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

const sha256 = (s) => createHash('sha256').update(s).digest();

export const authConfigured = () => Boolean(process.env.APP_PASSWORD);

/** Kunci tanda tangan sesi. Mengganti password otomatis membatalkan semua sesi lama. */
function secret() {
  const password = process.env.APP_PASSWORD;
  if (!password) throw new HttpError(503, 'APP_PASSWORD belum diatur di server');
  return process.env.SESSION_SECRET || sha256(`kasir-session:${password}`);
}

const sign = (value) => createHmac('sha256', secret()).update(value).digest('base64url');

export function passwordMatches(input) {
  const expected = process.env.APP_PASSWORD;
  if (!expected || typeof input !== 'string') return false;
  return timingSafeEqual(sha256(input), sha256(expected));
}

function cookieAttrs(maxAge) {
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.VERCEL ? '; Secure' : ''}`;
}

export function startSession(res) {
  const expires = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  res.setHeader('Set-Cookie', `${COOKIE}=${expires}.${sign(expires)}; ${cookieAttrs(MAX_AGE)}`);
}

export function endSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; ${cookieAttrs(0)}`);
}

export function isAuthed(req) {
  if (!authConfigured()) return false;
  const raw = (req.headers.cookie || '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`));
  if (!raw) return false;
  const [expires, signature] = raw.slice(COOKIE.length + 1).split('.');
  if (!expires || !signature || Number(expires) < Date.now() / 1000) return false;
  const a = Buffer.from(signature);
  const b = Buffer.from(sign(expires));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function requireAuth(req) {
  if (!authConfigured()) throw new HttpError(503, 'APP_PASSWORD belum diatur di server');
  if (!isAuthed(req)) throw new HttpError(401, 'Login diperlukan untuk melihat riwayat');
}
