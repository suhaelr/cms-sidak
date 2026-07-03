# ⚙️ Sidak BGN — Backend REST API (sidak-bgn-service)

> **sidak-bgn-service** adalah REST API backend resmi untuk aplikasi portal pengawasan Sidak BGN Badan Gizi Nasional (BGN). Dibangun dengan Bun runtime, Elysia framework, dan Drizzle ORM.

---

## 🚀 Teknologi Utama

| Teknologi | Versi | Keterangan |
|---|---|---|
| Bun | latest | Runtime JavaScript/TypeScript ultra-cepat |
| Elysia | 1.x | Web framework typesafe untuk Bun |
| Drizzle ORM | 0.30+ | TypeScript ORM untuk SQL |
| PostgreSQL | 16 | Database utama |
| MinIO / S3 | — | Object storage untuk upload file |
| JWT | — | Autentikasi stateless access/refresh token |
| Argon2 | — | Hashing password (via oslo) |
| Turnstile | — | Cloudflare CAPTCHA untuk form pengaduan |
| Zod | — | Validasi dan parsing environment variable |

---

## ✨ Fitur & API Endpoint

Seluruh API berada di bawah prefix `/api/`. Dokumentasi interaktif Scalar tersedia di `/docs`.

### 🔐 Autentikasi (`/api/auth`)

| Method | Path | Deskripsi |
|---|---|---|
| POST | `/auth/register` | Registrasi akun baru |
| POST | `/auth/login` | Login lokal (email + password) |
| POST | `/auth/logout` | Logout & invalidasi refresh token |
| POST | `/auth/refresh` | Rotasi access token menggunakan refresh token |
| GET | `/auth/me` | Ambil data profil diri sendiri |
| POST | `/auth/forgot-password` | Kirim link reset password ke email |
| POST | `/auth/reset-password` | Reset password via token |
| GET | `/auth/ory/callback` | Callback SSO Ory (login ASN via Ory Hydra/Kratos) |

### 👤 Manajemen Pengguna (`/api/users`) — Super Admin

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/users` | Daftar seluruh pengguna (dilindungi autentikasi + role admin) |
| PATCH | `/users/:id` | Perbarui data user (role, departemen, status aktif) |

### 📎 Upload File (`/api/uploads`)

| Method | Path | Deskripsi |
|---|---|---|
| POST | `/uploads` | Upload file ke MinIO/S3, menghasilkan URL publik |

### 🗺️ Wilayah (`/api/regions`)

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/regions` | Daftar wilayah Indonesia (via BGN SIPGN gateway, kode dagri) |

### 🏠 Feature Flags (`/api/feature-flags`)

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/feature-flags` | Status visibilitas menu/fitur per konfigurasi |
| PATCH | `/feature-flags/:key` | Ubah status feature flag (admin) |

### 🍳 Dapur SPPG (`/api/kitchens`)

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/kitchens` | Daftar semua dapur SPPG |
| POST | `/kitchens` | Tambah dapur SPPG baru |
| PUT | `/kitchens/:id` | Perbarui data dapur SPPG |
| DELETE | `/kitchens/:id` | Hapus dapur SPPG |

### 🔍 Inspeksi & Sidak (`/api/inspections`)

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/inspections` | Daftar laporan inspeksi (dengan filter) |
| POST | `/inspections` | Buat laporan sidak baru |
| GET | `/inspections/:id` | Detail inspeksi |
| PUT | `/inspections/:id` | Perbarui laporan sidak |
| DELETE | `/inspections/:id` | Hapus laporan sidak |

### 📋 Tindak Lanjut (`/api/followups`)

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/followups` | Daftar tindak lanjut inspeksi |
| POST | `/followups` | Buat tindak lanjut baru |
| PATCH | `/followups/:id` | Perbarui status tindak lanjut |

### ⚖️ Sanksi (`/api/sanctions`)

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/sanctions` | Daftar sanksi dapur SPPG (publik) |
| POST | `/sanctions` | Buat sanksi baru |
| PATCH | `/sanctions/:id` | Perbarui data sanksi |
| DELETE | `/sanctions/:id` | Hapus sanksi |

### 📣 Pengaduan Masyarakat (`/api/complaints`)

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/complaints` | Daftar pengaduan (admin) |
| POST | `/complaints` | Kirim pengaduan baru (dilindungi Turnstile CAPTCHA) |
| GET | `/complaints/:ticketNumber` | Cek status pengaduan via nomor tiket |
| PATCH | `/complaints/:id` | Perbarui status pengaduan |

### 📰 Berita (`/api/news`)

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/news` | Daftar berita (filter status, kategori, limit) |
| POST | `/news` | Buat artikel berita baru (admin) |
| GET | `/news/slug/:slug` | Detail artikel publik + rekomendasi artikel terkait (4 artikel terbaik berdasarkan skor kategori/tag/wilayah, tanpa paginasi) |
| GET | `/news/:id` | Detail artikel by ID (admin) |
| PATCH | `/news/:id` | Perbarui artikel (termasuk `cover_image_source`) |
| DELETE | `/news/:id` | Hapus artikel |

### 💬 Komentar Berita (`/api/news-comments`)

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/news-comments/:newsId/approved` | Ambil komentar yang sudah disetujui untuk artikel tertentu |
| POST | `/news-comments` | Kirim komentar baru (login wajib, sanitasi XSS, antrian moderasi) |
| GET | `/news-comments/status/:status` | Daftar komentar berdasarkan status (admin): `pending`, `approved`, `rejected`, `spam` |
| PATCH | `/news-comments/:id` | Ubah status moderasi komentar (admin) |
| DELETE | `/news-comments/:id` | Hapus komentar |
| POST | `/news-comments/:commentId/vote` | Vote komentar (like/dislike), dilindungi dari duplikasi vote |

### 👍 Reaksi Artikel (`/api/article-reactions`)

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/article-reactions/:newsId` | Ambil jumlah like & dislike artikel |
| POST | `/article-reactions` | Tambah/toggle reaksi artikel (like/dislike) |

### 🗂️ Dokumen & Regulasi (`/api/documents`)

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/documents` | Daftar dokumen/regulasi publik |
| POST | `/documents` | Unggah dokumen baru (admin) |
| DELETE | `/documents/:id` | Hapus dokumen |

### 🖼️ Hero Slides (`/api/hero-slides`)

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/hero-slides` | Daftar slide aktif carousel beranda |
| POST | `/hero-slides` | Buat slide baru |
| PATCH | `/hero-slides/:id` | Perbarui slide |
| DELETE | `/hero-slides/:id` | Hapus slide |

### 📊 Dashboard Statistik (`/api/dashboard`)

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/dashboard/stats` | Aggregasi statistik: jumlah sidak, pengaduan, berita, dapur |

### 🏷️ Kategori Berita (`/api/news-categories`)

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/news-categories` | Daftar semua kategori berita |
| POST | `/news-categories` | Tambah kategori baru (admin) |
| DELETE | `/news-categories/:id` | Hapus kategori (admin) |

### 📦 Master Data (`/api/master-data`)

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/master-data/food-sources` | Referensi sumber bahan makanan |
| GET | `/master-data/inspection-types` | Jenis-jenis inspeksi |

---

## 🛠️ Instalasi & Menjalankan Lokal

### Prasyarat
- **Bun** runtime terbaru: https://bun.sh
- **PostgreSQL** 15+ (atau Docker Compose)
- **MinIO** (atau AWS S3) untuk object storage

### Langkah Instalasi

```bash
# 1. Masuk ke direktori backend
cd sidak-bgn-service

# 2. Instal dependensi menggunakan Bun
bun install

# 3. Salin file konfigurasi environment
cp .env.example .env

# 4. Isi variabel environment di .env (lihat bagian Konfigurasi Environment)

# 5. Jalankan migrasi database
bun run db:migrate

# 6. (Opsional) Isi data awal/seeder
bun run db:seed

# 7. Jalankan server development
bun run dev
```

API akan berjalan di: **http://localhost:3000/api**
Dokumentasi interaktif di: **http://localhost:3000/docs**

---

## ⚙️ Konfigurasi Environment (`.env`)

```env
# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080

# Database PostgreSQL
DATABASE_URL=postgresql://sidak_user:sidak_pass@localhost:5432/sidak_db

# JWT Secret (gunakan string acak yang panjang di production!)
JWT_SECRET=your-super-secret-jwt-key-here

# MinIO / S3 Object Storage
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=sidak-bgn
S3_PUBLIC_URL=http://localhost:9000

# Cloudflare Turnstile (untuk form pengaduan)
TURNSTILE_SECRET_KEY=your-turnstile-secret-here

# SSO Ory (opsional, untuk login ASN)
ORY_ADMIN_URL=https://your-ory-instance/admin
ORY_SDK_URL=https://your-ory-instance
```

---

## 🔑 Kredensial Pengujian (Demo Login)

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `superadmin@bgn.go.id` | `demo123` |

> ⚠️ Kredensial ini hanya untuk lingkungan pengujian/development. **Ganti segera sebelum deployment ke production.**

---

## 🔒 Keamanan

- **Autentikasi JWT**: Access token (short-lived) + Refresh token (long-lived) dengan rotasi otomatis.
- **Password Hashing**: Argon2id — tidak menyimpan plaintext password.
- **Endpoint Admin Dilindungi**: Semua route CRUD admin dilindungi middleware `requireAuth` dan pengecekan role.
- **Sanitasi Input Komentar**: Library `sanitize-html` dipakai untuk menghapus XSS dari konten komentar sebelum disimpan ke DB.
- **Moderasi Komentar**: Komentar masuk ke status `pending` dan harus disetujui admin sebelum tampil ke publik.
- **CAPTCHA Anti-Spam**: Form pengaduan dilindungi Cloudflare Turnstile.

---

## 📁 Struktur Direktori Utama

```
sidak-bgn-service/
├── src/
│   ├── config.ts            # Konfigurasi & validasi env via Zod
│   ├── db/
│   │   ├── index.ts         # Koneksi database Drizzle
│   │   └── schema.ts        # Definisi schema tabel PostgreSQL
│   ├── lib/
│   │   ├── auth.ts          # Helper JWT, verifikasi, dan session
│   │   └── s3.ts            # Helper MinIO/S3 upload & bucket
│   ├── openapi/
│   │   └── docs.ts          # Definisi dokumentasi OpenAPI Scalar
│   ├── routes/
│   │   ├── auth.ts          # Route autentikasi
│   │   ├── users.ts         # Route manajemen user
│   │   ├── uploads-regions.ts
│   │   ├── feature-flags.ts
│   │   ├── resources.ts     # Aggregasi semua resource routes
│   │   └── modules/
│   │       ├── news.ts                # Route berita
│   │       ├── news-comments.ts       # Route komentar & voting
│   │       ├── article-reactions.ts   # Route like/dislike artikel
│   │       ├── inspections.ts         # Route inspeksi sidak
│   │       ├── followups.ts           # Route tindak lanjut
│   │       ├── sanctions.ts           # Route sanksi
│   │       ├── complaints.ts          # Route pengaduan
│   │       ├── kitchens.ts            # Route dapur SPPG
│   │       ├── documents.ts           # Route dokumen
│   │       ├── hero-slides.ts         # Route hero slides
│   │       ├── dashboard.ts           # Route statistik dashboard
│   │       ├── news-categories.ts     # Route kategori berita
│   │       └── master-data.ts         # Route master data referensi
│   └── services/
│       ├── news-comments.ts   # Business logic komentar (sanitasi, voting)
│       └── ...
├── drizzle/
│   └── migrations/            # File migrasi SQL Drizzle
├── .env.example
├── package.json
└── bun.lockb
```

---

## 📜 Perintah Berguna

```bash
bun run dev          # Jalankan development server dengan hot-reload
bun run db:generate  # Generate file migrasi baru dari perubahan schema
bun run db:migrate   # Jalankan migrasi ke database
bun run db:studio    # Buka Drizzle Studio (GUI database browser)
bun run db:seed      # Isi data awal ke database
```

---

## 🧑‍💻 Developer

**Dev eL — PUSDATIN, Badan Gizi Nasional (BGN)**
Branch: `dev-el-pusdatin-bgn-branch`
