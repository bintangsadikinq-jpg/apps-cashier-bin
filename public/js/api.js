async function request(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* respons kosong */ }
  if (!res.ok) throw new Error(data?.error || `Gagal menghubungi server (${res.status})`);
  return data;
}

const qs = (params) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && p.set(k, v));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const api = {
  stores: () => request('GET', '/api/stores'),
  listNotas: (filters = {}) => request('GET', `/api/notas${qs(filters)}`),
  getNota: (id) => request('GET', `/api/notas?id=${id}`),
  createNota: (nota) => request('POST', '/api/notas', nota),
  updateNota: (id, nota) => request('PUT', `/api/notas?id=${id}`, nota),
  deleteNota: (id) => request('DELETE', `/api/notas?id=${id}`),
};
