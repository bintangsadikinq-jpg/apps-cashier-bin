/**
 * Server lokal ringan yang meniru Vercel: file statis dari /public dan
 * fungsi /api/<nama>.js dengan req.query, req.body, res.status(), res.json().
 * Jalankan: npm run dev  →  http://localhost:3000
 */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT) || 3000;

// Muat .env sederhana (tanpa dependensi)
const envFile = path.join(ROOT, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]] && m[2]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
process.chdir(ROOT);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon',
};

function decorate(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
    return res;
  };
  return res;
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  if (!raw) return undefined;
  try { return JSON.parse(raw); } catch { return raw; }
}

async function handleApi(req, res, url) {
  const name = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
  if (!/^[a-z0-9-]+$/i.test(name)) return decorate(res).status(404).json({ error: 'Not found' });
  const file = path.join(ROOT, 'api', `${name}.js`);
  if (!existsSync(file)) return decorate(res).status(404).json({ error: 'Not found' });

  req.query = Object.fromEntries(url.searchParams);
  req.body = await readJson(req);
  const mod = await import(pathToFileURL(file).href);
  await mod.default(req, decorate(res));
}

async function handleStatic(res, url) {
  let file = path.join(PUBLIC, decodeURIComponent(url.pathname));
  if (!file.startsWith(PUBLIC)) { res.statusCode = 403; return res.end(); }
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
  } catch {
    file = path.join(PUBLIC, 'index.html');
  }
  try {
    const body = await readFile(file);
    res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream');
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    try {
      if (url.pathname.startsWith('/api/')) await handleApi(req, res, url);
      else await handleStatic(res, url);
    } catch (err) {
      console.error(err);
      if (!res.headersSent) decorate(res).status(500).json({ error: err.message });
    }
  })
  .listen(PORT, () => console.log(`Kasir berjalan di http://localhost:${PORT}`));
