# Tumbuh Kembang Anak

Aplikasi web PWA untuk mencatat dan memantau pertumbuhan anak — bayi cukup bulan
maupun prematur. Mobile-first, dapat di-install ke layar utama.

> **Bukan alat diagnosis.** Aplikasi ini membantu pencatatan dan pemantauan,
> bukan pengganti pemeriksaan atau rekomendasi tenaga kesehatan.

Spesifikasi lengkap: [README.md — Tumbuh Kembang Anak.md](./README.md%20—%20Tumbuh%20Kembang%20Anak.md)

## Status implementasi

| Phase | Cakupan | Status |
|---|---|---|
| 1 | Next.js, TypeScript, Tailwind, shadcn/ui, PostgreSQL, Drizzle, Auth, PWA, layout responsif | Selesai |
| 2 | CRUD anak, multi-anak, TERM/PRETERM, gestational age, profil anak | Selesai |
| 3 | CRUD pengukuran, riwayat, pengukuran terakhir | Selesai |
| 4 | Growth engine (dataset WHO/Fenton, LMS, z-score, percentile) | Belum |
| 5 | Growth charts dengan kurva reference | Belum |
| 6 | Feeding | Belum |
| 7 | PWA produksi lengkap (offline shell sudah ada) | Sebagian |

Fitur yang bergantung pada dataset medis (grafik, z-score, percentile, kalkulator
asupan) **sengaja ditampilkan sebagai belum tersedia** selama dataset resminya
belum dimasukkan — bukan diisi nilai perkiraan. Lihat
[docs/medical-references/](./docs/medical-references/).

## Menjalankan

Prasyarat: Node.js 20+ dan PostgreSQL.

```bash
npm install
cp .env.example .env.local     # isi DATABASE_URL dan AUTH_SECRET
npm run db:migrate
npm run dev
```

`AUTH_SECRET` dapat dibuat dengan `npx auth secret` atau `openssl rand -base64 32`.

### Database

PostgreSQL 17 lewat Docker:

```bash
docker compose up -d
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tumbuh_kembang"
```

Atau PostgreSQL lokal yang sudah terpasang:

```bash
createdb tumbuh_kembang
# DATABASE_URL="postgresql://$USER@localhost:5432/tumbuh_kembang"
```

Kredensial pada `docker-compose.yml` hanya untuk pengembangan.

### Data contoh

```bash
npm run db:seed     # demo@tumbuhkembang.local / Demo1234
```

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm run start` | Menjalankan hasil build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, tanpa emit |
| `npm run test` | Vitest (butuh database untuk test integrasi) |
| `npm run test:watch` | Vitest mode watch |
| `npm run db:generate` | Membuat file migration dari schema |
| `npm run db:migrate` | Menerapkan migration |
| `npm run db:push` | Push schema langsung (khusus development) |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Data contoh pengembangan |

## Struktur

```
src/
├── app/
│   ├── (auth)/            login, register, forgot-password
│   ├── (dashboard)/       dashboard, children, growth, settings
│   ├── api/auth/          Auth.js route handler
│   └── manifest.ts        PWA manifest
├── components/            ui (shadcn), layout, children, measurements
├── db/                    schema Drizzle + migrations
├── lib/
│   ├── actions/           server actions (children, measurements)
│   ├── auth/              Auth.js, rate limit, actions
│   ├── data/              akses database terotorisasi
│   └── growth/            calculation engine (usia, corrected age)
├── schemas/               validasi Zod
└── middleware.ts          proteksi route
```

Pemisahan yang dijaga: **UI → server action → data layer → database**, dengan
perhitungan medis terisolasi di `lib/growth/` dan tidak pernah di dalam komponen React.

## Keamanan

| Kontrol | Penerapan |
|---|---|
| Password hashing | bcrypt, 12 rounds |
| Session | Auth.js JWT, cookie HTTP-only |
| Otorisasi resource | Setiap query menyertakan `user_id` pemilik ([src/lib/data/](./src/lib/data/)) |
| Validasi server | Zod pada setiap server action, terlepas dari validasi client |
| Rate limiting login | 5 percobaan per 15 menit per IP+email |
| Integritas data | CHECK constraint di database, `numeric` untuk pengukuran |
| Error handling | Detail teknis hanya di log server; client menerima pesan umum |
| Security headers | `next.config.ts` |

`user_id` tidak pernah diambil dari client. Test otorisasi:
[src/lib/data/authorization.test.ts](./src/lib/data/authorization.test.ts).

## Perhitungan medis

Yang sudah diterapkan hanya perhitungan usia, mengikuti AAP
*Age Terminology During the Perinatal Period*, Pediatrics 2004;114(5):1362–1364:

- usia kronologis (aritmetika kalender, bukan asumsi 30 hari/bulan);
- corrected age untuk bayi prematur, berlaku hingga 3 tahun;
- post-menstrual age.

Dokumentasi dan rumusnya: [docs/medical-references/age-terminology.md](./docs/medical-references/age-terminology.md).

## PWA

Manifest, ikon (192/512/maskable), dan service worker tersedia. Strategi cache
sengaja konservatif: hanya aset statis yang di-cache. Halaman berisi data anak
tidak pernah masuk cache; saat offline ditampilkan shell offline. Mutasi offline
belum diaktifkan karena strategi konflik/sync-nya belum ditentukan.

## Lisensi

Belum ditentukan. Dataset medis memiliki ketentuan penggunaan masing-masing dan
harus diperiksa sebelum dimasukkan ke repository publik.
