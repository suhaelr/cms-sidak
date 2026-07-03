# CMS Sidak BGN — Monorepo

> Portal Pengawasan SPPG (Satuan Pelayanan Penyelamat Gizi) — Badan Gizi Nasional (BGN)
> Program Makan Bergizi Gratis (MBG)

---

## 📁 Struktur Monorepo

```
cms-sidak/
├── web/          # Frontend (React + Vite + TypeScript + Tailwind CSS)
│   └── README.md  → lihat web/README.md untuk panduan lengkap frontend
│
├── service/      # Backend REST API (Bun + Elysia + Drizzle ORM + PostgreSQL)
│   └── README.md  → lihat service/README.md untuk panduan lengkap backend
│
└── README.md     # (ini file ini)
```

---

## 🚀 Quick Start

### Frontend (web/)
```bash
cd web
npm install
cp .env.example .env  # sudah berisi nilai development default
npm run dev
# → http://localhost:8080
```

### Backend (service/)
```bash
cd service
bun install
cp .env.example .env  # sudah berisi nilai development default
bun run db:migrate
bun run dev
# → http://localhost:3000/api
# → http://localhost:3000/docs  (Scalar OpenAPI docs)
```

---

## 🔑 Kredensial Demo

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `superadmin@bgn.go.id` | `demo123` |

> ⚠️ Hanya untuk development. Ganti sebelum production.

---

## 📚 Dokumentasi Detail

- **Frontend**: lihat [web/README.md](./web/README.md)
- **Backend**: lihat [service/README.md](./service/README.md)

---

## 🧑‍💻 Developer

**Dev eL — PUSDATIN, Badan Gizi Nasional (BGN)**
