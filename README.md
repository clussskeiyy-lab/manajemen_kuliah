# MyNajemen

**MyNajemen** adalah aplikasi web sederhana untuk membantu mahasiswa mengatur waktu kuliah. Kamu bisa mencatat tugas, menyusun jadwal kelas mingguan, dan merencanakan sesi belajar mandiri, semuanya dalam satu halaman tanpa perlu login atau server.

Dibuat dengan HTML, CSS, dan JavaScript murni (tanpa framework). Data disimpan di browser menggunakan `localStorage`.

---

## Fitur

### Dashboard
- Ringkasan statistik: tugas belum selesai, tugas selesai, kelas hari ini, dan jumlah sesi belajar mandiri
- Bar progres penyelesaian tugas (dalam persen)
- Daftar **4 deadline terdekat**, lengkap dengan sisa hari
- Daftar kelas yang berlangsung **hari ini**

### Tugas Kuliah
- Tambah tugas (nama, mata kuliah, prioritas, deadline)
- Prioritas **Rendah / Sedang / Tinggi** dengan label warna
- Cari tugas berdasarkan judul atau mata kuliah
- Urutkan berdasarkan deadline terdekat, prioritas tertinggi, atau nama A-Z
- Filter: semua, belum selesai, atau selesai
- Tandai selesai lewat checkbox dan hapus tugas
- Penanda tugas yang **terlambat** beserta jumlah hari keterlambatannya

### Jadwal Kuliah
- Tambah jadwal kelas (hari, jam, mata kuliah, ruangan)
- Tampilan kartu per hari (Senin sampai Minggu)
- Hari ini diberi penanda otomatis
- Jadwal dalam satu hari diurutkan berdasarkan jam

### Belajar Mandiri
- Rencanakan sesi belajar di luar jam kelas (hari, jam, topik)
- Daftar diurutkan berdasarkan hari dalam seminggu

### Lainnya
- Tampilan responsif (desktop, tablet, HP) dengan menu hamburger di layar kecil
- Notifikasi singkat (toast) setiap ada aksi tambah atau hapus
- Perlindungan XSS sederhana lewat fungsi `escapeHtml`
- Atribut ARIA untuk aksesibilitas dasar

---

## Teknologi

| Bagian | Teknologi |
| --- | --- |
| Struktur | HTML5 |
| Tampilan | CSS3 (CSS Variables, Flexbox, Grid, media query) |
| Logika | JavaScript (ES6+, tanpa library) |
| Penyimpanan | Web Storage API (`localStorage`) |

---

## Struktur Proyek

```
mynajemen/
├── manajemen.html   # Halaman utama (semua tampilan dalam satu file)
├── style.css        # Seluruh gaya tampilan
├── script.js        # Logika aplikasi
└── ikon.png         # Logo / favicon aplikasi
```
## Cara Pakai

1. Buka menu **Tugas Kuliah**, isi formulir, lalu klik **Tambah Tugas**.
2. Buka menu **Jadwal Kuliah** untuk mengisi kelas mingguan.
3. Buka menu **Belajar Mandiri** untuk menambah rencana belajar.
4. Kembali ke **Dashboard** untuk melihat ringkasan aktivitasmu.
```
