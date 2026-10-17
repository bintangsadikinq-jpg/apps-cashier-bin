/**
 * Satu-satunya sumber data identitas toko.
 * Tambah toko baru cukup di sini (+ gambar di public/assets & tema di public/css/print.css).
 */
export const STORES = [
  {
    id: 'beans-pc',
    name: "Bean's PC",
    prefix: 'BPC',
    tagline: 'Build | Upgrade | Repair | Your PC',
    itemLabel: 'Nama Barang / Jenis Produk',
    footer: 'Good Gear  Better Experience',
    header: '/assets/beans-pc-header.webp',
    logo: '/assets/beans-pc-logo.webp',
    accent: '#1463FF',
    ink: '#0C2A4D',
  },
  {
    id: 'lintang-taylor',
    name: "Lintang's Taylor",
    prefix: 'LT',
    tagline: 'Stitching Your Style',
    itemLabel: 'Nama Barang / Jenis Pakaian',
    footer: 'Thank You for Your Trust',
    header: '/assets/lintang-taylor-header.webp',
    logo: '/assets/lintang-taylor-logo.webp',
    accent: '#B07F2C',
    ink: '#0F2F4F',
  },
];

export const findStore = (id) => STORES.find((s) => s.id === id) || null;
