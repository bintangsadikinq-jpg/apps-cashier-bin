# Kasir — Bean's PC & Lintang's Taylor

Aplikasi kasir nota berbasis Handsontable. Isi tabel nota → pilih toko → simpan & cetak
(A5 landscape, meniru desain nota kertas masing-masing toko).

## Jalankan lokal

```bash
npm install
npm run dev          # http://localhost:3000
```

Database otomatis dibuat di `data/kasir.db`. Hapus dengan `npm run db:reset`.

## Deploy ke Vercel

1. Push folder ini ke GitHub, lalu *Import Project* di Vercel (Framework preset: **Other**).
2. Tanpa pengaturan apa pun aplikasi langsung jalan, tetapi database ada di `/tmp`
   dan **bisa hilang** (badge kuning "Data sementara" muncul di pojok kanan atas).
3. Agar data permanen, pakai Turso (SQLite terkelola, ada paket gratis):
   ```bash
   turso db create kasir
   turso db show kasir --url        # → TURSO_DATABASE_URL
   turso db tokens create kasir     # → TURSO_AUTH_TOKEN
   ```
   Isi keduanya di Vercel → Project → Settings → Environment Variables, lalu redeploy.
   Tabel dibuat otomatis saat request pertama.

## Struktur

```
api/                 Serverless function Vercel
  stores.js          GET  /api/stores  → daftar toko + mode penyimpanan
  notas.js           GET/POST/PUT/DELETE /api/notas[?id=]
lib/                 Logika server (tidak jadi endpoint)
  db.js              Koneksi libSQL (lokal / sementara / Turso) + migrasi otomatis
  schema.js          Tabel stores, notas, nota_items
  stores.js          Identitas toko (nama, prefix nomor, warna, gambar) — sumber tunggal
  notas-repo.js      Query nota & penomoran otomatis PREFIX-YYYYMMDD-001
  validate.js        Validasi input + hitung ulang total di server
  http.js            Wrapper handler & error
scripts/
  dev.js             Server lokal tiruan Vercel (tanpa perlu vercel CLI)
public/
  index.html
  assets/            Header & logo toko
  css/               base · components · grid (tema Handsontable) · print (template nota)
  js/
    main.js          Boot + routing hash (#nota, #riwayat)
    api.js  state.js  theme.js  utils/format.js
    components/      nota-grid, store-picker, summary, nota-editor, history, toast, confirm
    print/           render-nota.js
```

## Menambah toko baru

1. Tambah entri di `lib/stores.js` (id, name, prefix, itemLabel, footer, accent, ink, gambar).
2. Taruh gambar header & logo di `public/assets/`.
3. Tambah blok tema `.nota--<id>` di `public/css/print.css`.

## Tips pemakaian

- Harga bisa diketik `450.000`, `450000`, atau ditempel dari Excel.
- Jumlah boleh pecahan: `1,5`. Isi nama barang saja → jumlah otomatis 1.
- Diskon: nominal (`50.000`) atau persen (`10%`).
- `Ctrl + S` menyimpan. Klik kanan tabel untuk sisip/hapus baris.
- Mengubah toko/tanggal pada nota lama akan membuat nomor nota baru.

## Lisensi Handsontable

Kode memakai `licenseKey: 'non-commercial-and-evaluation'`. Untuk penggunaan komersial
diperlukan lisensi Handsontable berbayar (ganti di `public/js/components/nota-grid.js`).
