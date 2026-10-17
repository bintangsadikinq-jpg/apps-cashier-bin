# Mengatasi `git push` gagal: "Connection was reset"

## Gejala

```
fatal: unable to access 'https://github.com/<user>/<repo>.git/':
Recv failure: Connection was reset
```

Browser bisa membuka github.com, tetapi `git push` dan `curl` dari terminal gagal.

## Penyebab

Jaringan mengembalikan alamat **IPv6 (NAT64, awalan `64:ff9b::`)** untuk github.com lebih dulu, dan jalur IPv6 itu memutus koneksi. Lewat **IPv4** koneksinya normal. Browser punya jalur sendiri, jadi tidak terdampak.

Cara memastikannya:

```bash
curl -4 -sI -o /dev/null -w "%{http_code}\n" https://github.com   # 200 = IPv4 normal
curl -6 -sI -o /dev/null -w "%{http_code}\n" https://github.com   # gagal = IPv6 bermasalah
```

SSH (port 22 dan 443) juga gagal karena melewati jalur IPv6 yang sama.

## Solusi (urut dari yang paling aman)

### 1. Paksa IPv4 hanya untuk satu perintah (tidak mengubah konfigurasi)

Cari IPv4 github.com:

```bash
nslookup github.com 1.1.1.1
```

Pakai alamat IPv4 yang muncul (contoh: `20.205.243.166`):

```bash
git -c http.curloptResolve=github.com:443:20.205.243.166 push -u origin main
```

Alamat IP GitHub bisa berubah. Kalau gagal, cari ulang dengan `nslookup`.

### 2. Nonaktifkan IPv6 di adapter jaringan Windows

1. Tekan `Win + R`, ketik `ncpa.cpl`, Enter.
2. Klik kanan WiFi/Ethernet yang dipakai, pilih **Properties**.
3. Hilangkan centang **Internet Protocol Version 6 (TCP/IPv6)**, lalu OK.
4. Jalankan `ipconfig /flushdns`, lalu `git push -u origin main`.

Kalau tidak ada gunanya, centang kembali.

### 3. Ganti jaringan atau DNS

- Coba **hotspot HP**. Kalau berhasil, masalahnya ada di WiFi/ISP.
- Ganti DNS ke `1.1.1.1` dan `8.8.8.8`, lalu `ipconfig /flushdns`.

### 4. VPN atau Cloudflare WARP

Nyalakan VPN, lalu push lagi. Kalau browser memakai proxy, arahkan git ke proxy yang sama:

```bash
git config --global http.proxy http://127.0.0.1:PORT
```

Hapus lagi bila sudah tidak perlu:

```bash
git config --global --unset http.proxy
```

## Setelah push berhasil

Windows akan membuka jendela login GitHub saat push pertama. Masuk dengan akun pemilik repo (`bintangsadikinq-jpg`). Jika diminta password, pakai **Personal Access Token**, bukan password akun.

## Catatan lain

- `Repository not found` berarti repo belum dibuat di GitHub, atau login memakai akun yang salah.
- `remote origin already exists` bukan error serius. Remote sudah terpasang. Cek dengan `git remote -v`.
- Untuk perintah di snippet GitHub, `git add README.md` hanya meng-commit README. Pakai `git add -A` untuk mengirim seluruh proyek. File di `.gitignore` (`.env`, `node_modules`, `data/*.db`) tidak ikut terkirim.
