export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Bungkus handler: tangkap error & batasi method. */
export function handler(routes) {
  return async (req, res) => {
    const fn = routes[req.method];
    if (!fn) {
      res.setHeader('Allow', Object.keys(routes).join(', '));
      return res.status(405).json({ error: `Method ${req.method} tidak didukung` });
    }
    try {
      const result = await fn(req, res);
      if (!res.headersSent) res.status(200).json(result ?? { ok: true });
    } catch (err) {
      const status = err.status || 500;
      if (status >= 500) console.error(err);
      res.status(status).json({ error: status >= 500 ? 'Terjadi kesalahan di server' : err.message });
    }
  };
}

export function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body) {
    try { return JSON.parse(req.body); } catch { /* jatuh ke error di bawah */ }
  }
  throw new HttpError(400, 'Body harus berupa JSON');
}
