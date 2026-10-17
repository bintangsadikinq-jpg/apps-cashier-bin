import { escapeHtml, formatDateLong, formatNumber, formatQty } from '../utils/format.js';

const MIN_ROWS = 10;

function notaHtml(nota, store) {
  const rows = nota.items.map(
    (it, i) => `
      <tr>
        <td class="c-no">${i + 1}</td>
        <td>${escapeHtml(it.nama)}</td>
        <td class="c-qty">${formatQty(it.jumlah)}</td>
        <td class="c-price">${formatNumber(it.harga)}</td>
        <td class="c-total">${formatNumber(it.total ?? it.jumlah * it.harga)}</td>
      </tr>`
  );
  for (let i = nota.items.length; i < MIN_ROWS; i++) {
    rows.push(`<tr><td class="c-no">${i + 1}</td><td></td><td></td><td></td><td></td></tr>`);
  }

  return `
  <article class="nota nota--${store.id}">
    <header class="nota-head">
      <img class="nota-brand" src="${store.header}" alt="${escapeHtml(store.name)}" />
      <div>
        <div class="nota-title">NOTA</div>
        <dl class="nota-meta">
          <div><dt>Tanggal</dt><span>:</span><dd>${formatDateLong(nota.tanggal)}</dd></div>
          <div><dt>No. Nota</dt><span>:</span><dd>${escapeHtml(nota.nomor)}</dd></div>
          <div><dt>Pelanggan</dt><span>:</span><dd>${escapeHtml(nota.pelanggan)}</dd></div>
        </dl>
      </div>
    </header>

    <table class="nota-table">
      <thead>
        <tr>
          <th class="c-no">No</th>
          <th>${escapeHtml(store.itemLabel)}</th>
          <th class="c-qty">Jumlah</th>
          <th class="c-price">Harga Satuan</th>
          <th class="c-total">Total</th>
        </tr>
      </thead>
      <tbody>${rows.join('')}</tbody>
    </table>

    <div class="nota-bottom">
      <div class="nota-notes">
        <div class="nota-notes-label">Catatan :</div>
        <div class="nota-notes-text">${escapeHtml(nota.catatan)}</div>
      </div>
      <table class="nota-sum">
        <tr><th>Sub Total</th><td>${formatNumber(nota.subtotal)}</td></tr>
        <tr><th>Diskon</th><td>${nota.diskon ? formatNumber(nota.diskon) : '-'}</td></tr>
        <tr class="is-total"><th>Total</th><td>Rp ${formatNumber(nota.total)}</td></tr>
      </table>
    </div>

    <footer class="nota-foot"><span class="nota-foot-text">${escapeHtml(store.footer)}</span></footer>
  </article>`;
}

const waitForImages = (root) =>
  Promise.all(
    [...root.querySelectorAll('img')].map((img) =>
      img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; })
    )
  );

/** Render nota ke #print-root lalu buka dialog cetak browser. */
export async function printNota(nota, store) {
  const root = document.getElementById('print-root');
  root.innerHTML = notaHtml(nota, store);
  await Promise.all([waitForImages(root), document.fonts?.ready]);
  const prevTitle = document.title;
  document.title = nota.nomor; // nama file default saat "Save as PDF"
  window.print();
  document.title = prevTitle;
}
