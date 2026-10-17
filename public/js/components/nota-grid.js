import { formatNumber, formatQty, parseQty, parseRupiah } from '../utils/format.js';

const MIN_ROWS = 10;
const blankRow = () => ({ nama: null, jumlah: null, harga: null });

const rowTotal = (row) =>
  row && row.jumlah != null && row.harga != null ? Math.round(row.jumlah * row.harga) : null;

/**
 * Tabel isian nota berbasis Handsontable.
 * Kolom: NO (row header) | Nama barang | Jumlah | Harga satuan | Total
 */
export function createNotaGrid(container, { onChange } = {}) {
  const { TextRenderer } = Handsontable.renderers;
  let itemLabel = 'Nama barang';
  let warnRows = new Set();

  function moneyRenderer(instance, td, row, col, prop, value, cp) {
    TextRenderer.call(this, instance, td, row, col, prop, value == null ? '' : formatNumber(value), cp);
  }
  function qtyRenderer(instance, td, row, col, prop, value, cp) {
    TextRenderer.call(this, instance, td, row, col, prop, value == null ? '' : formatQty(value), cp);
  }
  function nameRenderer(instance, td, row, col, prop, value, cp) {
    TextRenderer.call(this, instance, td, row, col, prop, value, cp);
    td.classList.toggle('cell-warn', warnRows.has(row));
  }

  const headers = () => [itemLabel, 'Jumlah', 'Harga satuan', 'Total'];

  const hot = new Handsontable(container, {
    licenseKey: 'non-commercial-and-evaluation',
    data: Array.from({ length: MIN_ROWS }, blankRow),
    dataSchema: blankRow,
    colHeaders: headers(),
    rowHeaders: true,
    rowHeaderWidth: 52,
    columns: [
      { data: 'nama', renderer: nameRenderer },
      { data: 'jumlah', className: 'htCenter', renderer: qtyRenderer },
      { data: 'harga', className: 'htRight', renderer: moneyRenderer },
      {
        data: (row) => rowTotal(row), // kolom hitung, tidak disimpan
        readOnly: true,
        className: 'htRight cell-total',
        renderer: moneyRenderer,
      },
    ],
    colWidths: [360, 96, 150, 160],
    stretchH: 'all',
    height: 'auto',
    rowHeights: 40,
    columnHeaderHeight: 44,
    minRows: MIN_ROWS,
    autoWrapRow: true,
    autoWrapCol: true,
    fillHandle: { direction: 'vertical', autoInsertRow: false },
    undo: true,
    outsideClickDeselects: true,
    contextMenu: {
      items: {
        row_above: { name: 'Sisipkan baris di atas' },
        row_below: { name: 'Sisipkan baris di bawah' },
        remove_row: { name: 'Hapus baris' },
        sep1: '---------',
        undo: { name: 'Urungkan' },
        redo: { name: 'Ulangi' },
      },
    },

    // Normalisasi input: "150.000" → 150000, "1,5" → 1.5
    beforeChange(changes) {
      for (const change of changes) {
        if (!change) continue;
        const [, prop, , value] = change;
        if (prop === 'harga') change[3] = parseRupiah(value);
        else if (prop === 'jumlah') change[3] = parseQty(value);
        else if (prop === 'nama') change[3] = String(value ?? '').trim() || null;
      }
    },

    afterChange(changes, source) {
      if (!changes || source === 'loadData') return;
      // Nama barang diisi tapi jumlah kosong → otomatis 1
      const autofill = [];
      for (const [row, prop, , value] of changes) {
        if (prop === 'nama' && value && hot.getSourceDataAtRow(row)?.jumlah == null) {
          autofill.push([row, 'jumlah', 1]);
        }
      }
      if (autofill.length) hot.setDataAtRowProp(autofill, 'autofill');
      if (warnRows.size) { warnRows = new Set(); hot.render(); }
      onChange?.();
    },
    // Pojok kiri atas = judul kolom NO
    afterGetColHeader(col, th) {
      if (col === -1) th.innerHTML = '<div class="relative"><span class="colHeader">No</span></div>';
    },
    afterRemoveRow: () => onChange?.(),
    afterCreateRow: () => onChange?.(),
  });

  const source = () => hot.getSourceData();
  const isFilled = (r) => r.nama || r.jumlah != null || r.harga != null;

  return {
    hot,

    /** Item yang terisi + daftar masalah (baris tanpa nama). */
    collect() {
      const items = [];
      const problems = [];
      source().forEach((r, i) => {
        if (!isFilled(r)) return;
        if (!r.nama) { problems.push(i); return; }
        items.push({ nama: r.nama, jumlah: r.jumlah ?? 1, harga: r.harga ?? 0 });
      });
      return { items, problems };
    },

    subtotal() {
      return source().reduce((sum, r) => sum + (r.nama ? rowTotal({ jumlah: r.jumlah ?? 1, harga: r.harga ?? 0 }) : 0), 0);
    },

    hasContent: () => source().some(isFilled),

    setItems(items = []) {
      const rows = items.map((it) => ({ nama: it.nama, jumlah: it.jumlah, harga: it.harga }));
      while (rows.length < MIN_ROWS) rows.push(blankRow());
      warnRows = new Set();
      hot.loadData(rows);
    },

    clear() { this.setItems([]); },

    markProblems(rows) {
      warnRows = new Set(rows);
      hot.render();
      if (rows.length) hot.selectCell(rows[0], 0);
    },

    addRow() {
      hot.alter('insert_row_below', hot.countRows() - 1);
      hot.selectCell(hot.countRows() - 1, 0);
    },

    setItemLabel(label) {
      itemLabel = label || 'Nama barang';
      hot.updateSettings({ colHeaders: headers() });
    },

    refresh() { hot.refreshDimensions(); },
  };
}
