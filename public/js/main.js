import { api } from './api.js';
import { setState, subscribe } from './state.js';
import { createNotaEditor } from './components/nota-editor.js';
import { createHistory } from './components/history.js';
import { toast } from './components/toast.js';

const STORAGE_LABEL = {
  turso: { text: 'Tersimpan di database', cls: 'badge--ok' },
  lokal: { text: 'Database lokal', cls: 'badge--ok' },
  sementara: { text: 'Data sementara, hubungkan Turso', cls: 'badge--warn' },
};

async function boot() {
  let info;
  try {
    info = await api.stores();
  } catch (err) {
    document.querySelector('main').innerHTML =
      `<div class="empty"><p>Server tidak bisa dihubungi: ${err.message}</p>
       <button class="btn" onclick="location.reload()">Coba lagi</button></div>`;
    return;
  }
  setState({ stores: info.stores, storage: info.storage });

  const badge = document.getElementById('storage-badge');
  const label = STORAGE_LABEL[info.storage];
  if (label) {
    badge.innerHTML = `<span class="badge-text">${label.text}</span>`;
    badge.setAttribute('aria-label', label.text);
    badge.classList.add(label.cls);
    badge.hidden = false;
    if (info.storage === 'sementara') {
      badge.title = 'Data di server Vercel bisa hilang sewaktu-waktu. Isi TURSO_DATABASE_URL agar permanen.';
    }
  }

  const views = {
    nota: document.getElementById('view-nota'),
    riwayat: document.getElementById('view-riwayat'),
  };

  const editor = createNotaEditor(views.nota, {
    onSaved: () => history.load(),
  });

  const history = createHistory(views.riwayat, {
    onGoToNota: () => (location.hash = '#nota'),
    async onOpen(id) {
      if (!(await editor.confirmDiscard())) return;
      try {
        await editor.open(id);
        location.hash = '#nota';
      } catch (err) { toast(err.message, { type: 'error' }); }
    },
  });

  subscribe((state, patch) => {
    if ('storeId' in patch) editor.onStoreChanged(state.storeId);
  });

  // ---- Routing via hash ----
  function route() {
    const name = location.hash.replace('#', '') in views ? location.hash.replace('#', '') : 'nota';
    Object.entries(views).forEach(([key, el]) => (el.hidden = key !== name));
    document.querySelectorAll('.tab').forEach((t) => {
      if (t.dataset.view === name) t.setAttribute('aria-current', 'page');
      else t.removeAttribute('aria-current');
    });
    if (name === 'nota') requestAnimationFrame(() => editor.refresh());
    if (name === 'riwayat') history.load();
  }
  window.addEventListener('hashchange', route);
  route();
}

boot();
