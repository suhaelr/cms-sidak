# 🏥 Sidak BGN — Portal Pengawasan SPPG (Frontend Web)

> **Sidak BGN** adalah portal web resmi Badan Gizi Nasional (BGN) untuk transparansi pengawasan operasional dapur SPPG (Satuan Pelayanan Penyelamat Gizi) dalam program **Makan Bergizi Gratis (MBG)**.

---

## 🚀 Teknologi Utama

| Teknologi | Versi | Keterangan |
|---|---|---|
| React | 18.x | Library UI berbasis komponen |
| Vite | 5.x | Build tool & development server |
| TypeScript | 5.x | Typed JavaScript |
| Tailwind CSS | 3.x | Utility-first CSS framework |
| Shadcn UI | latest | Komponen aksesibel berbasis Radix |
| TanStack Query | 5.x | Sinkronisasi & caching state API |
| React Router Dom | 6.x | Navigasi halaman SPA |
| Next Themes | 0.3.x | Manajemen tema (Mode Gelap/Terang) |
| Tiptap | 3.x | Rich text editor WYSIWYG |
| Recharts | 2.x | Visualisasi data statistik |

---

## ✨ Fitur-Fitur Utama

### 🌐 Portal Publik

1. **Beranda & Berita Utama**
   - Tampilan berita bergilir (*carousel*) dengan artikel headline.
   - Filter kategori artikel: Sidak, Kajian, Berita, Video.
   - Pseudo statistik per artikel: jumlah view, shares, estimasi waktu baca.

2. **Halaman Detail Artikel Berita**
   - Tampilan konten artikel RichText lengkap dengan mode gelap.
   - Atribusi/sumber gambar cover (`Sumber: ...`) di bawah cover image.
   - Sistem **Like / Dislike** artikel dengan counter.
   - **Sistem Rekomendasi Berita** tanpa paginasi: merekomendasikan 4 artikel terbaik berdasarkan kecocokan kategori, tag, dan wilayah.

3. **Kolom Komentar Terproteksi**
   - Komentar hanya dapat dilakukan oleh pengguna yang sudah **login** (dilindungi oleh modal login publik yang elegan).
   - Opsi **posting sebagai anonim** ("Kirim sebagai Anonim") untuk melindungi identitas.
   - Sistem **Upvote / Downvote** komentar dengan penanda visual interaktif.
   - Proteksi manipulasi ganda menggunakan *session lock* via `localStorage` per-browser.
   - Komentar masuk ke antrian moderasi dan **harus disetujui admin** sebelum tayang.

4. **Kanal Pengaduan Masyarakat**
   - Form pelaporan keluhan/pelanggaran operasional dapur SPPG.
   - Dilindungi **Cloudflare Turnstile CAPTCHA** untuk pencegahan spam bot.
   - Status pengaduan dapat dipantau menggunakan nomor tiket.

5. **Dokumentasi & Regulasi**
   - Unduhan berkas regulasi, Juknis, SOP, dan panduan operasional dapur SPPG.

6. **Daftar Sidak & Sanksi**
   - Transparansi hasil inspeksi sidak mendadak yang dipublikasikan.
   - Daftar sanksi yang dijatuhkan kepada dapur SPPG yang melanggar standar.

### 🛡️ CMS Dashboard Admin

7. **Manajemen Konten (CMS)**
   - Pengelolaan berita: buat, edit, hapus, publikasikan, set sebagai *highlight* / *breaking news*.
   - Input sumber gambar cover berita untuk keperluan atribusi.
   - Editor artikel menggunakan **Tiptap WYSIWYG** dengan dukungan format Rich Text.

8. **Moderasi Komentar**
   - Dashboard moderasi komentar publik dengan status Pending / Approved / Rejected.
   - Penanda identitas anonim untuk komentar yang diposting tanpa nama.

9. **Manajemen Data Inspeksi & Sidak**
   - Pengelolaan data dapur SPPG, laporan inspeksi, temuan, tindak lanjut, dan sanksi.

10. **Statistik Dashboard**
    - Ringkasan angka sidak, pengaduan, berita, dan grafik tren inspeksi.

### 🎨 Fitur Pengalaman Pengguna

11. **Mode Gelap / Mode Terang**
    - Tombol toggle tema tersedia di header (termasuk di dropdown profil pengguna yang login).
    - Seluruh halaman publik dan komponen menggunakan kelas Tailwind adaptif (`dark:`).

12. **Optimasi Technical SEO**
    - Custom hook `useSEO` mengupdate `document.title` dan meta deskripsi secara dinamis per halaman.
    - Open Graph tags (`og:title`, `og:description`) diperbarui untuk kemudahan berbagi.

---

## 🛠️ Instalasi & Menjalankan Lokal

### Prasyarat
- **Node.js** ≥ 18.x atau **Bun** runtime

### Langkah Instalasi

```bash
# 1. Masuk ke direktori frontend
cd sidak-bgn-web

# 2. Instal dependensi
npm install

# 3. Salin file environment
cp .env.example .env

# 4. Sesuaikan konfigurasi API di file .env
VITE_API_URL=http://localhost:3000/api

# 5. Jalankan development server
npm run dev
```

Aplikasi web akan berjalan di: **http://localhost:8080/**

### Perintah Lainnya

```bash
npm run build        # Build produksi
npm run preview      # Preview build produksi
npm run lint         # Cek kode dengan ESLint
npm run test         # Jalankan unit test (Vitest)
```

---

## 🔑 Kredensial Pengujian (Demo Login)

Untuk keperluan pengujian dan review fitur CMS Admin, gunakan akun demo berikut:

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `superadmin@bgn.go.id` | `demo123` |

> ⚠️ Kredensial ini hanya untuk lingkungan pengujian/development. **Ganti segera sebelum deployment ke production.**

---

## 📁 Struktur Direktori Utama

```
sidak-bgn-web/
├── src/
│   ├── components/
│   │   ├── admin/         # Komponen form CMS Admin
│   │   ├── layout/        # Layout publik dan admin (header, sidebar, footer)
│   │   ├── shared/        # Komponen bersama (LoginModal, CoverImage, dll)
│   │   └── ui/            # Komponen Shadcn UI
│   ├── contexts/          # React context (Auth, FeatureFlags, dll)
│   ├── hooks/             # Custom hooks (use-seo, use-api-query, dll)
│   ├── lib/               # Utilitas dan tipe data API
│   ├── pages/
│   │   ├── admin/         # Halaman-halaman panel CMS Admin
│   │   └── *.tsx          # Halaman-halaman portal publik
│   └── App.tsx            # Entry point routing aplikasi
├── public/
└── package.json
```

---

## 🧑‍💻 Developer

**Dev eL — PUSDATIN, Badan Gizi Nasional (BGN)**
Branch: `dev-el-pusdatin-bgn-branch`
