import { api } from '../api.js';
import { getState, findStore } from '../state.js';
import { escapeHtml, formatDate, formatRupiah, formatNumber, debounce } from '../utils/format.js';
import { toast } from './toast.js';
import { confirmDialog } from './confirm.js';
import { printNota } from '../print/render-nota.js';

const ICONS = {
  open: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 16h3l8.5-8.5a2.1 2.1 0 0 0-3-3L4 13z"/></svg>',
  print: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 8V3h8v5M6 14H4V8h12v6h-2M6 11h8v6H6z"/></svg>',
  trash: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10"/></svg>',
};

/** Halaman Riwayat: daftar nota, filter, buka/cetak/hapus. */
export function createHistory(root, { onOpen, onGoToNota }) {
  const $ = (sel) => root.querySelector(sel);
  const f = { q: $('#h-q'), store: $('#h-store'), from: $('#h-from'), to: $('#h-to') };
  const body = $('#h-body');
  const stats = $('#h-stats');
  let rows = [];
  let loadToken = 0;

  f.store.insertAdjacentHTML(
    'beforeend',
    getState().stores.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')
  );

  async function load() {
    const token = ++loadToken;
    try {
      const data = await api.listNotas({
        q: f.q.value.trim(),
        store: f.store.value,
        from: f.from.value,
        to: f.to.value,
      });
      if (token !== loadToken) return; // abaikan respons lama
      rows = data;
      render();
    } catch (err) {
      toast(err.message, { type: 'error' });
    }
  }

  function renderStats() {
    const total = rows.reduce((s, r) => s + r.total, 0);
    const perStore = getState().stores
      .map((s) => {
        const sum = rows.filter((r) => r.storeId === s.id).reduce((a, r) => a + r.total, 0);
        return sum ? `<div><strong>${formatRupiah(sum)}</strong>${escapeHtml(s.name)}</div>` : '';
      })
      .join('');
    stats.innerHTML = rows.length
      ? `<div><strong>${formatNumber(rows.length)}</strong>Nota</div>
         <div><strong>${formatRupiah(total)}</strong>Total penjualan</div>${perStore}`
      : '';
  }

  function render() {
    renderStats();
    const filtered = f.q.value || f.store.value || f.from.value || f.to.value;
    if (!rows.length) {
      body.innerHTML = `
        <tr><td colspan="7"><div class="empty">
          <p>${filtered ? 'Tidak ada nota yang cocok dengan filter ini.' : 'Belum ada nota tersimpan.'}</p>
          ${filtered ? '' : '<button type="button" class="btn" data-go="nota">Buat nota pertama</button>'}
        </div></td></tr>`;
      return;
    }
    body.innerHTML = rows
      .map((r) => {
        const store = findStore(r.storeId);
        return `
        <tr data-id="${r.id}">
          <td>${formatDate(r.tanggal)}</td>
          <td class="nomor-cell">${escapeHtml(r.nomor)}</td>
          <td><span class="store-dot" style="--dot:${store?.accent || '#999'}">${escapeHtml(store?.name || r.storeId)}</span></td>
          <td>${escapeHtml(r.pelanggan) || '<span style="color:var(--muted)">–</span>'}</td>
          <td class="num">${r.itemCount}</td>
          <td class="num"><strong>${formatRupiah(r.total)}</strong></td>
          <td class="actions-col">
            <div class="row-actions">
              <button type="button" class="btn btn--quiet btn--sm" data-act="open">${ICONS.open}Ubah</button>
              <button type="button" class="btn btn--quiet btn--sm" data-act="print">${ICONS.print}Cetak</button>
              <button type="button" class="btn btn--quiet btn--sm btn--danger" data-act="delete" aria-label="Hapus nota ${escapeHtml(r.nomor)}">${ICONS.trash}</button>
            </div>
          </td>
        </tr>`;
      })
      .join('');
  }

  body.addEventListener('click', async (e) => {
    if (e.target.closest('[data-go]')) return onGoToNota();
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const id = Number(btn.closest('tr').dataset.id);
    const row = rows.find((r) => r.id === id);

    if (btn.dataset.act === 'open') return onOpen(id);

    if (btn.dataset.act === 'print') {
      try {
        const nota = await api.getNota(id);
        await printNota(nota, findStore(nota.storeId));
      } catch (err) { toast(err.message, { type: 'error' }); }
    }

    if (btn.dataset.act === 'delete') {
      const ok = await confirmDialog({
        title: `Hapus nota ${row.nomor}?`,
        message: 'Nota yang dihapus tidak bisa dikembalikan.',
        okLabel: 'Hapus nota',
        danger: true,
      });
      if (!ok) return;
      try {
        await api.deleteNota(id);
        toast(`Nota ${row.nomor} dihapus`);
        load();
      } catch (err) { toast(err.message, { type: 'error' }); }
    }
  });

  const reload = debounce(load, 250);
  f.q.addEventListener('input', reload);
  [f.store, f.from, f.to].forEach((i) => i.addEventListener('change', load));

  return { load };
}
