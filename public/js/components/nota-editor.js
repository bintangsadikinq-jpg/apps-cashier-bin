import { api } from '../api.js';
import { getState, setState, findStore } from '../state.js';
import { applyStoreTheme } from '../theme.js';
import { todayISO, formatDate } from '../utils/format.js';
import { createNotaGrid } from './nota-grid.js';
import { createStorePicker } from './store-picker.js';
import { createSummary } from './summary.js';
import { toast } from './toast.js';
import { showThanks } from './success-animation.js';
import { confirmDialog } from './confirm.js';
import { printNota } from '../print/render-nota.js';

/** Halaman Nota: isi tabel → pilih toko → simpan / cetak. */
export function createNotaEditor(root, { onSaved } = {}) {
  const $ = (sel) => root.querySelector(sel);
  const el = {
    tanggal: $('#f-tanggal'),
    pelanggan: $('#f-pelanggan'),
    nomor: $('#f-nomor'),
    catatan: $('#f-catatan'),
    banner: $('#editing-banner'),
    bannerText: $('#editing-text'),
  };

  let editing = null; // nota yang sedang diubah (dari riwayat)
  let dirty = false;
  let busy = false;

  const markDirty = () => { dirty = true; };

  const grid = createNotaGrid($('#grid'), {
    onChange: () => { summary.setSubtotal(grid.subtotal()); markDirty(); },
  });

  const summary = createSummary({
    subtotalEl: $('#s-subtotal'),
    totalEl: $('#s-total'),
    diskonInput: $('#f-diskon'),
    hintEl: $('#s-diskon-hint'),
    onChange: markDirty,
  });

  const picker = createStorePicker($('#store-picker'), {
    stores: getState().stores,
    onSelect: (id) => { setState({ storeId: id }); markDirty(); },
  });

  // Toko terpilih → tema & label kolom ikut berubah
  function onStoreChanged(id) {
    const store = findStore(id);
    applyStoreTheme(id);
    grid.setItemLabel(store?.itemLabel);
    renderNomor();
  }

  function renderNomor() {
    const store = findStore(picker.value);
    if (editing && editing.storeId === picker.value && editing.tanggal === el.tanggal.value) {
      el.nomor.textContent = editing.nomor;
      el.nomor.classList.add('is-set');
    } else {
      el.nomor.textContent = store ? `${store.prefix}-… dibuat saat disimpan` : 'Dibuat saat disimpan';
      el.nomor.classList.remove('is-set');
    }
  }

  function renderBanner() {
    el.banner.hidden = !editing;
    if (editing) el.bannerText.textContent = `Mengubah nota ${editing.nomor} (${formatDate(editing.tanggal)})`;
    root.querySelector('[data-action="save"]').textContent = editing ? 'Simpan perubahan' : 'Simpan';
  }

  function collect() {
    const { items, problems } = grid.collect();
    return {
      payload: {
        storeId: picker.value,
        tanggal: el.tanggal.value,
        pelanggan: el.pelanggan.value,
        catatan: el.catatan.value,
        diskon: summary.diskon(),
        items,
      },
      problems,
    };
  }

  async function save({ print = false } = {}) {
    if (busy) return;
    const { payload, problems } = collect();

    if (problems.length) {
      grid.markProblems(problems);
      return toast(`Baris ${problems.map((r) => r + 1).join(', ')} belum ada nama barang`, { type: 'error' });
    }
    if (!payload.items.length) return toast('Isi minimal satu barang di tabel', { type: 'error' });
    if (!payload.storeId) {
      picker.flagMissing();
      return toast('Pilih toko untuk nota ini', { type: 'error' });
    }
    if (!payload.tanggal) { el.tanggal.focus(); return toast('Isi tanggal nota', { type: 'error' }); }

    busy = true;
    root.querySelectorAll('[data-action^="save"]').forEach((b) => (b.disabled = true));
    try {
      const saved = editing
        ? await api.updateNota(editing.id, payload)
        : await api.createNota(payload);
      editing = saved;
      dirty = false;
      renderNomor();
      renderBanner();
      toast(`Nota ${saved.nomor} tersimpan`);
      showThanks();
      onSaved?.(saved);
      if (print) await printNota(saved, findStore(saved.storeId));
      // Kasir tanpa login tidak boleh mengubah nota lama, jadi form dikosongkan untuk nota berikutnya
      if (!getState().authed) reset();
    } catch (err) {
      toast(err.message, { type: 'error' });
    } finally {
      busy = false;
      root.querySelectorAll('[data-action^="save"]').forEach((b) => (b.disabled = false));
    }
  }

  function reset() {
    editing = null;
    dirty = false;
    el.tanggal.value = todayISO();
    el.pelanggan.value = '';
    el.catatan.value = '';
    grid.clear();
    summary.setSubtotal(0);
    summary.setDiskon(0);
    renderNomor();
    renderBanner();
    dirty = false;
  }

  async function confirmDiscard() {
    if (!dirty || !grid.hasContent()) return true;
    return confirmDialog({
      title: 'Buang isian nota?',
      message: 'Isian yang belum disimpan akan hilang.',
      okLabel: 'Buang',
      danger: true,
    });
  }

  function load(nota) {
    editing = nota;
    el.tanggal.value = nota.tanggal;
    el.pelanggan.value = nota.pelanggan;
    el.catatan.value = nota.catatan;
    picker.select(nota.storeId, { silent: true });
    setState({ storeId: nota.storeId });
    grid.setItems(nota.items);
    summary.setSubtotal(grid.subtotal());
    summary.setDiskon(nota.diskon);
    renderNomor();
    renderBanner();
    dirty = false;
  }

  // ---- Event ----
  root.addEventListener('click', async (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'save') save();
    if (action === 'save-print') save({ print: true });
    if (action === 'new' && (await confirmDiscard())) reset();
  });
  $('#btn-add-row').addEventListener('click', () => grid.addRow());
  [el.pelanggan, el.catatan].forEach((i) => i.addEventListener('input', markDirty));
  el.tanggal.addEventListener('change', () => { markDirty(); renderNomor(); });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !root.hidden) {
      e.preventDefault();
      grid.hot.getActiveEditor()?.finishEditing?.();
      save();
    }
  });

  window.addEventListener('beforeunload', (e) => {
    if (dirty && grid.hasContent()) e.preventDefault();
  });

  reset();

  return {
    onStoreChanged,
    refresh: () => grid.refresh(),
    confirmDiscard,
    async open(id) {
      const nota = await api.getNota(id);
      load(nota);
    },
  };
}
