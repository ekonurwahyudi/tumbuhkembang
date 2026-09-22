# Tumbuh Kembang Anak

Aplikasi **Tumbuh Kembang Anak** adalah aplikasi web berbasis **PWA (Progressive Web App)** untuk membantu orang tua mencatat dan memantau pertumbuhan anak, baik bayi/anak yang lahir cukup bulan maupun bayi prematur.

Aplikasi harus memiliki desain **mobile-first**, responsive di smartphone, tablet, dan desktop, serta dapat di-install ke perangkat seperti aplikasi native melalui PWA.

> **Penting:** Aplikasi ini merupakan alat pencatatan dan pemantauan, bukan alat diagnosis medis. Perhitungan pertumbuhan dan kebutuhan nutrisi harus menggunakan sumber/referensi medis yang jelas dan tidak boleh membuat rumus medis sendiri tanpa referensi.

---

# 1. Technology Stack

Gunakan stack berikut.

## Core

- Next.js
- TypeScript
- App Router
- React
- Node.js

## UI

- Tailwind CSS
- shadcn/ui
- Lucide Icons
- Recharts
- React Hook Form
- Zod

## Backend

Backend menggunakan kemampuan server-side dari Next.js:

- Server Components
- Server Actions
- Route Handlers / REST API bila diperlukan

Tidak perlu membuat backend Express/NestJS terpisah untuk MVP.

## Database

- PostgreSQL 17
- Drizzle ORM
- Drizzle Kit untuk migration

## Authentication

Gunakan authentication berbasis session yang aman.

Pilihan utama:

- Auth.js

Requirement:

- Password harus di-hash.
- Session disimpan secara aman.
- Gunakan HTTP-only secure cookie.
- Setiap resource anak wajib diverifikasi kepemilikannya terhadap user yang sedang login.
- Jangan pernah mempercayai `user_id` yang dikirim dari client.

## PWA

Aplikasi harus mendukung:

- Web App Manifest
- Service Worker
- Install to Home Screen
- Responsive mobile UI
- Offline application shell
- Caching static assets
- Strategi offline yang aman untuk data sensitif
- Icon PWA
- Splash/icon metadata

---

# 2. Tujuan Aplikasi

Aplikasi digunakan untuk:

1. Membuat akun orang tua/pengguna.
2. Login ke aplikasi.
3. Menambahkan satu atau beberapa anak.
4. Menyimpan informasi kelahiran anak.
5. Menentukan apakah anak lahir cukup bulan atau prematur.
6. Menyimpan usia gestasi bayi prematur.
7. Mencatat berat badan.
8. Mencatat panjang/tinggi badan.
9. Mencatat lingkar kepala.
10. Menampilkan riwayat pengukuran.
11. Menampilkan grafik pertumbuhan.
12. Membandingkan pertumbuhan dengan reference pertumbuhan yang sesuai.
13. Menghitung usia kronologis.
14. Menghitung corrected age untuk bayi prematur bila sesuai.
15. Mencatat ASI/ASI perah/susu formula.
16. Menampilkan ringkasan asupan yang tercatat.
17. Menampilkan estimasi/kisaran kebutuhan asupan berdasarkan reference medis yang dipilih.
18. Menjadi PWA yang nyaman digunakan dari smartphone.

---

# 3. Prinsip Utama

## 3.1 Mobile First

Semua halaman harus didesain dari layar smartphone terlebih dahulu.

Target minimum:

```text
Mobile
Tablet
Laptop
Desktop
```

Hindari desktop sidebar besar pada layar mobile.

Untuk mobile gunakan:

- Bottom navigation
- Sheet
- Dialog/Drawer
- Cards
- Tabs
- Floating Action Button bila sesuai

---

# 4. Struktur Aplikasi

Gunakan struktur kurang lebih:

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── forgot-password/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   │
│   │   ├── children/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── growth/
│   │   │       │   └── page.tsx
│   │   │       ├── measurements/
│   │   │       │   └── page.tsx
│   │   │       └── feeding/
│   │   │           └── page.tsx
│   │   │
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── api/
│   │   ├── children/
│   │   ├── measurements/
│   │   ├── feeding/
│   │   └── auth/
│   │
│   ├── manifest.ts
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── children/
│   ├── measurements/
│   ├── growth/
│   ├── feeding/
│   └── charts/
│
├── db/
│   ├── index.ts
│   ├── schema/
│   └── migrations/
│
├── lib/
│   ├── auth/
│   ├── growth/
│   │   ├── age.ts
│   │   ├── corrected-age.ts
│   │   ├── who.ts
│   │   ├── preterm.ts
│   │   ├── zscore.ts
│   │   └── percentile.ts
│   ├── feeding/
│   │   └── calculator.ts
│   └── utils/
│
├── schemas/
│   ├── auth.ts
│   ├── child.ts
│   ├── measurement.ts
│   └── feeding.ts
│
└── types/
```

Struktur boleh berkembang selama separation of concerns tetap dipertahankan.

---

# 5. Authentication

Sediakan halaman:

```text
/login
/register
/forgot-password
```

## Register

Field:

```text
Nama
Email
Password
Konfirmasi Password
```

Validation:

- nama wajib
- email valid
- email unique
- password memiliki minimum security requirement
- password dan confirmation harus sama

Password tidak boleh disimpan dalam plaintext.

---

# 6. Login

Field:

```text
Email
Password
```

Sediakan:

```text
[ Masuk ]

Lupa password?

Belum punya akun?
Daftar
```

Setelah login berhasil:

```text
/dashboard
```

---

# 7. Dashboard

Dashboard harus menampilkan:

```text
Halo, {nama user}

Anak Saya

[ Child Card ]

Nama anak
Umur
Status TERM/PRETERM

Berat terakhir
Tinggi/Panjang terakhir
Lingkar kepala terakhir

[ Lihat Perkembangan ]

+ Tambah Anak
```

User dapat memiliki lebih dari satu anak.

---

# 8. Bottom Navigation Mobile

Pada layar smartphone gunakan navigation:

```text
Home
Anak
Growth
Profil
```

Contoh:

```text
┌─────────────────────────────┐
│ 🏠       👶      📈      👤 │
│ Home     Anak    Growth Profil│
└─────────────────────────────┘
```

Navigation harus memiliki active state.

---

# 9. Tambah Anak

Halaman:

```text
/children/new
```

Field wajib:

```text
Nama Anak

Jenis Kelamin
- Laki-laki
- Perempuan

Tanggal Lahir

Status Kelahiran
- Cukup Bulan / Term
- Prematur / Preterm
```

Jenis kelamin wajib karena reference pertumbuhan dapat berbeda berdasarkan sex.

---

# 10. Bayi Prematur

Jika user memilih:

```text
Prematur
```

munculkan input tambahan:

```text
Usia Kehamilan Saat Lahir

Minggu:
[ 32 ]

Hari:
[ 4 ]
```

Contoh:

```text
32 minggu 4 hari
```

Database jangan hanya menyimpan `32.4`.

Simpan secara terpisah:

```text
gestational_age_weeks = 32
gestational_age_days = 4
```

Validation:

```text
gestational_age_days >= 0
gestational_age_days <= 6
```

Validasi gestational week harus mengikuti batas yang ditentukan domain/reference medis aplikasi.

---

# 11. Child Profile

Halaman:

```text
/children/[id]
```

Tampilkan:

```text
Nama
Jenis kelamin
Tanggal lahir
Umur kronologis
Status kelahiran
Gestational age bila premature
Corrected age bila relevan
```

Tambahkan quick actions:

```text
+ Pengukuran
+ Catat Minum

Lihat Grafik
Riwayat Pengukuran
Riwayat Asupan
```

---

# 12. Pengukuran Pertumbuhan

User dapat menambahkan pengukuran berkali-kali.

Field:

```text
Tanggal Pengukuran

Berat Badan (kg)

Panjang/Tinggi Badan (cm)

Lingkar Kepala (cm)
```

Gunakan input decimal.

Contoh:

```text
Berat:
7.40 kg

Panjang:
67.80 cm

Lingkar kepala:
43.20 cm
```

---

# 13. Measurement History

Jangan overwrite pengukuran sebelumnya.

Setiap pengukuran harus menjadi record baru.

Contoh:

```text
22 Aug 2026
6.8 kg
65.2 cm
42.0 cm

29 Aug 2026
7.0 kg
65.8 cm
42.4 cm

05 Sep 2026
7.1 kg
66.3 cm
42.7 cm
```

User harus dapat:

```text
Create
Read
Update
Delete
```

measurement miliknya sendiri.

Penghapusan sebaiknya meminta confirmation dialog.

---

# 14. Growth Charts

Gunakan:

```text
Recharts
```

Chart utama:

```text
Weight-for-age
Length/Height-for-age
Head-circumference-for-age
```

Jika dataset/reference tersedia, tambahkan:

```text
Weight-for-length
Weight-for-height
BMI-for-age
```

Chart harus menampilkan:

```text
Data anak
+
Reference growth curve
```

Bukan hanya line chart data anak.

---

# 15. WHO Growth Standard

Untuk bayi/anak cukup bulan, gunakan dataset/reference resmi:

**WHO Child Growth Standards**

Reference yang diperlukan antara lain:

```text
Weight-for-age
Length/Height-for-age
Weight-for-length/height
Head-circumference-for-age
BMI-for-age
```

Reference harus mempertimbangkan:

```text
Sex
Age
Measurement type
```

Jangan hardcode angka WHO secara acak di React component.

Data reference harus disimpan sebagai dataset yang terstruktur.

Reference utama:

https://www.who.int/tools/child-growth-standards

---

# 16. Preterm Growth

Untuk bayi prematur, gunakan reference pertumbuhan prematur yang tervalidasi dan terdokumentasi.

Salah satu reference yang dapat digunakan adalah:

```text
Fenton Preterm Growth Chart
```

Reference yang diperlukan:

```text
Weight
Length
Head Circumference
Gestational Age
Sex
```

Referensi:

https://www.aap.org/en/patient-care/newborn-infant-and-early-childhood-nutrition/newborn-and-infant-nutrition-assessment-tools/preterm-infant-growth-tools/

Jangan menggunakan WHO secara langsung pada semua fase bayi prematur tanpa mempertimbangkan corrected age/reference transition.

Aturan transisi preterm reference ke WHO harus ditentukan secara eksplisit berdasarkan guideline/reference yang digunakan.

---

# 17. Age Calculation

Buat utility terpisah.

```text
lib/growth/age.ts
```

Harus dapat menghitung:

```text
Chronological Age
```

berdasarkan:

```text
measurement_date - date_of_birth
```

Gunakan date arithmetic yang benar.

Jangan menganggap:

```text
1 month = 30 days
```

untuk semua kebutuhan UI.

---

# 18. Corrected Age

Untuk bayi prematur, sediakan:

```text
Corrected Age
```

Secara konseptual:

```text
Corrected Age =
Chronological Age -
Weeks Born Before Term
```

Namun implementasi produksi harus mengikuti guideline medis/reference yang dipilih.

Simpan gestational age asli sehingga corrected age dapat dihitung ulang.

Jangan menyimpan corrected age sebagai data statis jika dapat dihitung dari data sumber.

---

# 19. Growth Engine

Pisahkan calculation engine dari React/UI.

Struktur:

```text
Medical Reference Data
        ↓
Growth Engine
        ↓
Growth Result
        ↓
UI
```

Contoh output:

```ts
type GrowthResult = {
  measurementType: string
  ageDays: number
  value: number
  zScore?: number
  percentile?: number
  reference: string
  referenceVersion?: string
}
```

UI hanya bertugas menampilkan hasil.

---

# 20. Z-Score

Jika reference menyediakan parameter LMS, buat calculation engine terpisah.

Contoh konsep:

```text
L
M
S
```

Digunakan untuk menghitung:

```text
Z-score
Percentile
```

Jangan mencampurkan calculation logic dengan chart component.

---

# 21. Tampilan Growth

Contoh:

```text
Pertumbuhan Aisyah

[ Berat ] [ Tinggi ] [ Kepala ]

Berat Badan

10 kg ┤
      │                    ●
 9 kg ┤                ●
      │            ●
 8 kg ┤        ●
      │    ●
 7 kg ┤
      └────────────────────────
       0   3   6   9   12 bulan
```

Tambahkan reference curves bila sesuai:

```text
-3 SD
-2 SD
-1 SD
Median
+1 SD
+2 SD
+3 SD
```

Chart harus responsive.

---

# 22. Reference Metadata

Setiap calculation harus dapat dilacak terhadap reference yang digunakan.

Contoh:

```text
WHO Child Growth Standards
```

atau:

```text
Fenton Preterm Growth Chart
```

Simpan metadata seperti:

```text
reference_name
reference_version
reference_source
```

agar aplikasi dapat diaudit ketika dataset diperbarui.

---

# 23. Growth Reference Database

Pertimbangkan tabel:

```text
growth_references
```

Schema konseptual:

```text
id
name
version
source
population
sex
min_age
max_age
created_at
```

Kemudian:

```text
growth_reference_points
```

Contoh:

```text
id
reference_id
measurement_type
age_days / gestational_age
L
M
S
created_at
```

Jika dataset menggunakan percentile langsung, field dapat disesuaikan.

Jangan memaksa semua reference menggunakan struktur identik apabila format medis sumbernya berbeda.

---

# 24. Feeding

Tambahkan modul pencatatan asupan.

Jenis:

```text
BREAST_DIRECT
EXPRESSED_BREAST_MILK
FORMULA
```

UI:

```text
Catat Asupan

Jenis:
○ ASI langsung
○ ASI perah
○ Susu formula

Jumlah:
[ 90 ] ml

Jam:
[ 10:30 ]

Catatan:
[ optional ]

[ Simpan ]
```

Untuk ASI langsung, volume boleh kosong karena tidak selalu dapat diketahui.

---

# 25. Feeding History

Contoh:

```text
Hari ini

06:30
ASI langsung

09:00
ASI perah
90 ml

11:30
ASI langsung

14:00
Sufor
100 ml
```

Ringkasan:

```text
ASI langsung:
3 sesi

ASI perah:
180 ml

Sufor:
200 ml

Total volume terukur:
380 ml
```

Jangan memasukkan sesi direct breastfeeding ke total ml jika volume tidak diketahui.

---

# 26. Feeding Calculator

Aplikasi dapat menyediakan estimasi/kisaran asupan berdasarkan:

```text
Berat badan terbaru
Usia
Status TERM/PRETERM
Reference medis
```

Jangan membuat satu rumus universal tanpa reference.

Output harus menggunakan wording seperti:

```text
Estimasi kisaran asupan
```

bukan:

```text
Anak harus minum X ml.
```

Tampilkan:

```text
Berat terakhir
Reference yang digunakan
Kisaran estimasi per hari
Informasi tambahan bila tersedia
```

---

# 27. Medical Disclaimer

Tampilkan disclaimer yang proporsional pada fitur growth/feeding:

```text
Informasi pada aplikasi ini digunakan untuk membantu pencatatan dan
pemantauan pertumbuhan anak dan bukan pengganti diagnosis, pemeriksaan,
atau rekomendasi dokter, dokter anak, bidan, maupun tenaga kesehatan.
```

Jangan membuat UI penuh warning pada setiap halaman sehingga aplikasi sulit digunakan.

---

# 28. Database Schema

Minimal tabel berikut:

```text
users
children
growth_measurements
feeding_logs
growth_references
growth_reference_points
```

---

# 29. Users

Contoh:

```text
users
-----
id UUID PK
name VARCHAR
email VARCHAR UNIQUE
password_hash VARCHAR
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

# 30. Children

```text
children
--------
id UUID PK
user_id UUID FK
name VARCHAR
sex ENUM
date_of_birth DATE
birth_type ENUM
gestational_age_weeks INTEGER NULL
gestational_age_days INTEGER NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

Enum:

```text
sex:
MALE
FEMALE
```

```text
birth_type:
TERM
PRETERM
```

Jika:

```text
birth_type = TERM
```

maka:

```text
gestational_age_weeks
gestational_age_days
```

boleh NULL.

Jika:

```text
birth_type = PRETERM
```

gestational age wajib tersedia.

---

# 31. Growth Measurements

```text
growth_measurements
-------------------
id UUID PK
child_id UUID FK
measured_at DATE
weight_kg DECIMAL
length_height_cm DECIMAL
head_circumference_cm DECIMAL
notes TEXT NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

Jangan menggunakan floating point bila precision database penting.

Gunakan numeric/decimal yang sesuai.

---

# 32. Feeding Logs

```text
feeding_logs
------------
id UUID PK
child_id UUID FK
feeding_type ENUM
amount_ml DECIMAL NULL
fed_at TIMESTAMP
notes TEXT NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

Enum:

```text
BREAST_DIRECT
EXPRESSED_BREAST_MILK
FORMULA
```

---

# 33. Database Relationship

```text
USER
 │
 ├──────── CHILD
 │           │
 │           ├──────── GROWTH_MEASUREMENT
 │           │
 │           └──────── FEEDING_LOG
 │
 └──────── CHILD
             │
             ├──────── GROWTH_MEASUREMENT
             └──────── FEEDING_LOG
```

Satu user dapat memiliki banyak anak.

Satu anak dapat memiliki banyak measurement dan feeding log.

---

# 34. Authorization

Ini WAJIB.

Setiap operasi:

```text
GET child
UPDATE child
DELETE child
CREATE measurement
UPDATE measurement
DELETE measurement
CREATE feeding
UPDATE feeding
DELETE feeding
```

harus memastikan:

```text
resource.user_id === authenticated_user.id
```

Jangan hanya melakukan:

```text
SELECT * FROM children WHERE id = ?
```

Gunakan konsep:

```text
SELECT ...
FROM children
WHERE id = ?
AND user_id = authenticated_user_id
```

atau authorization equivalent melalui ORM.

---

# 35. Validation

Gunakan:

```text
Zod
```

untuk validasi server-side.

Client validation hanya untuk UX.

Server tetap harus melakukan validation ulang.

Contoh validasi:

```text
weight > 0
height > 0
head circumference > 0

measurement_date <= today

date_of_birth <= today

gestational_days >= 0
gestational_days <= 6
```

Batas medis yang lebih spesifik harus menggunakan domain rules yang terdokumentasi.

---

# 36. API Response

Jika menggunakan Route Handlers, gunakan response yang konsisten.

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data tidak valid"
  }
}
```

Jangan expose:

```text
stack trace
SQL error
database credential
internal server information
```

ke client.

---

# 37. UI Components

Gunakan shadcn/ui untuk komponen utama.

Gunakan antara lain:

```text
Button
Card
Input
Label
Select
RadioGroup
Dialog
AlertDialog
Sheet
Tabs
Badge
Alert
Table
DropdownMenu
Avatar
Skeleton
Calendar
Popover
Sonner
```

Jangan membuat ulang komponen dasar jika shadcn sudah menyediakannya.

---

# 38. Design Language

UI harus:

```text
Clean
Friendly
Modern
Soft
Mobile-first
Tidak terlalu ramai
Mudah digunakan orang tua
```

Gunakan:

- whitespace yang cukup
- card radius konsisten
- typography hierarchy jelas
- touch target cukup besar
- icon + text untuk navigation penting

Hindari penggunaan warna sebagai satu-satunya indikator status.

---

# 39. Accessibility

Minimum:

```text
Semantic HTML
Keyboard accessible
ARIA bila diperlukan
Label pada setiap form
Visible focus state
Adequate contrast
Touch target mobile yang memadai
```

Chart harus memiliki text summary agar informasi tidak hanya tersedia secara visual.

---

# 40. Dashboard Mobile Concept

```text
┌──────────────────────────┐
│ Tumbuh Kembang           │
│                          │
│ Halo, Ayah/Bunda         │
├──────────────────────────┤
│ Anak Saya                │
│                          │
│ ┌──────────────────────┐ │
│ │ 👶 Aisyah             │ │
│ │ 8 bulan              │ │
│ │                      │ │
│ │ Berat     7.4 kg     │ │
│ │ Tinggi    67.8 cm    │ │
│ │ Kepala    43.2 cm    │ │
│ │                      │ │
│ │ Lihat Perkembangan → │ │
│ └──────────────────────┘ │
│                          │
│ + Tambah Anak            │
│                          │
├──────────────────────────┤
│ 🏠    👶    📈     👤    │
│ Home Anak Growth Profil  │
└──────────────────────────┘
```

---

# 41. Growth Page Mobile

```text
┌──────────────────────────┐
│ ← Pertumbuhan            │
├──────────────────────────┤
│                          │
│ Aisyah                   │
│ 8 bulan                  │
│                          │
│ [Berat][Tinggi][Kepala] │
│                          │
│ ┌──────────────────────┐ │
│ │                      │ │
│ │    Growth Chart      │ │
│ │                      │ │
│ └──────────────────────┘ │
│                          │
│ Pengukuran terakhir      │
│                          │
│ Berat        7.4 kg      │
│ Tinggi       67.8 cm     │
│ Kepala       43.2 cm     │
│                          │
│ + Tambah Pengukuran      │
│                          │
└──────────────────────────┘
```

---

# 42. PWA Requirements

Buat:

```text
manifest.ts
```

Minimal metadata:

```text
name
short_name
description
start_url
display
background_color
theme_color
icons
```

Gunakan:

```text
display: standalone
```

Sediakan icon:

```text
192x192
512x512
maskable icon
```

---

# 43. Offline Strategy

Prioritas caching:

```text
Application shell
Static CSS
Static JS
Icons
Fonts jika digunakan
```

Untuk data anak:

Jangan cache secara agresif tanpa mempertimbangkan keamanan.

Data sensitif harus diperlakukan berbeda dari static asset.

Mutation offline harus memiliki strategi conflict/sync yang jelas sebelum diaktifkan.

---

# 44. Loading State

Setiap proses async harus memiliki state.

Gunakan:

```text
Skeleton
Spinner
Disabled button
Loading label
```

Contoh:

```text
[ Menyimpan... ]
```

Hindari double submit.

---

# 45. Empty State

Contoh ketika belum ada anak:

```text
Belum ada data anak.

Tambahkan profil anak untuk mulai
memantau pertumbuhannya.

[ + Tambah Anak ]
```

Ketika belum ada measurement:

```text
Belum ada pengukuran.

Tambahkan pengukuran pertama untuk
mulai membuat grafik pertumbuhan.

[ + Tambah Pengukuran ]
```

---

# 46. Error Handling

Gunakan user-friendly error.

Contoh:

```text
Data belum berhasil disimpan.
Silakan coba kembali.
```

Bukan:

```text
Postgres error 23505
```

Technical error tetap dicatat server-side untuk debugging.

---

# 47. Date Handling

Database timestamps sebaiknya disimpan secara konsisten.

Bedakan:

```text
DATE
```

untuk:

```text
tanggal lahir
tanggal pengukuran
```

dan timestamp/timezone-aware handling untuk:

```text
feeding time
created_at
updated_at
```

UI harus menampilkan tanggal sesuai locale pengguna.

---

# 48. Performance

Gunakan Server Components jika sesuai.

Jangan membuat seluruh aplikasi:

```text
"use client"
```

Client Component hanya digunakan ketika diperlukan, misalnya:

```text
Form interaction
Chart
Dialog
Dynamic interaction
```

Gunakan server-side data fetching untuk dashboard bila memungkinkan.

---

# 49. Security Checklist

Wajib:

```text
[ ] Password hashing
[ ] Secure session
[ ] HTTP-only cookie
[ ] HTTPS production
[ ] CSRF consideration
[ ] Rate limiting login
[ ] Zod server validation
[ ] Resource authorization
[ ] Secure headers
[ ] Environment variables
[ ] No secrets in client bundle
[ ] Database backup
[ ] Audit/error logging
```

---

# 50. Environment Variables

Contoh:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Jangan commit `.env`.

Sediakan:

```text
.env.example
```

tanpa credential asli.

---

# 51. Development Database

Target:

```text
PostgreSQL 17
```

Development dapat menggunakan Docker.

Contoh service:

```yaml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: tumbuh_kembang
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Credential development tersebut tidak boleh digunakan di production.

---

# 52. Suggested Development Commands

Target developer experience:

```bash
npm install

npm run dev

npm run lint

npm run typecheck

npm run test

npm run db:generate

npm run db:migrate

npm run db:studio

npm run build
```

Semua command yang didokumentasikan harus benar-benar tersedia di `package.json`.

---

# 53. Testing

Minimum testing untuk calculation engine:

```text
Chronological age
Corrected age
Gestational age
WHO lookup
Preterm lookup
Z-score
Percentile
Feeding calculation
```

Calculation engine medis harus memiliki unit test.

Tambahkan integration test untuk:

```text
Register
Login
Create child
Create measurement
Authorization
Feeding log
```

---

# 54. Medical Calculation Tests

Jangan hanya menguji bahwa function berhasil dijalankan.

Gunakan known reference values dari sumber medis.

Contoh konsep:

```text
INPUT:
sex
age
weight

EXPECTED:
reference
L
M
S
z-score
```

Nilai expected harus berasal dari dataset/reference resmi.

---

# 55. Auditability

Untuk calculation yang penting, aplikasi harus dapat mengetahui:

```text
Measurement
Reference
Reference version
Calculation method
Calculation result
```

Tujuannya agar perubahan dataset di masa depan dapat dilacak.

---

# 56. Jangan Lakukan Ini

Jangan:

```text
❌ Membuat percentile random
❌ Mengarang WHO data
❌ Mengarang Fenton data
❌ Menentukan status medis hanya berdasarkan warna grafik
❌ Menganggap semua bayi memiliki kebutuhan susu sama
❌ Menganggap ASI langsung selalu dapat dihitung dalam ml
❌ Menghapus measurement lama ketika memasukkan data baru
❌ Mempercayai child_id dari client tanpa authorization
❌ Menaruh database password di source code
❌ Menaruh medical calculation langsung di React component
❌ Menggunakan floating point sembarangan untuk data measurement
❌ Menggunakan localStorage untuk menyimpan password/token sensitif
```

---

# 57. Development Phases

## Phase 1 — Foundation

Implement:

```text
[ ] Next.js
[ ] TypeScript
[ ] Tailwind CSS
[ ] shadcn/ui
[ ] PostgreSQL 17
[ ] Drizzle
[ ] Authentication
[ ] Basic PWA
[ ] Responsive layout
```

---

## Phase 2 — Child Management

Implement:

```text
[ ] Add child
[ ] Edit child
[ ] Delete child
[ ] Multiple children
[ ] TERM/PRETERM
[ ] Sex
[ ] Date of birth
[ ] Gestational age
[ ] Child profile
```

---

## Phase 3 — Measurement

Implement:

```text
[ ] Add measurement
[ ] Edit measurement
[ ] Delete measurement
[ ] Measurement history
[ ] Latest measurement
```

---

## Phase 4 — Growth Engine

Implement:

```text
[ ] Age calculation
[ ] Corrected age
[ ] WHO dataset
[ ] Preterm dataset
[ ] Reference lookup
[ ] LMS calculation
[ ] Z-score
[ ] Percentile
[ ] Unit tests
```

Jangan melanjutkan medical interpretation sebelum calculation engine tervalidasi.

---

## Phase 5 — Growth Charts

Implement:

```text
[ ] Weight chart
[ ] Length/height chart
[ ] Head circumference chart
[ ] Reference curves
[ ] Child trajectory
[ ] Responsive charts
[ ] Text summary
```

---

## Phase 6 — Feeding

Implement:

```text
[ ] Breastfeeding log
[ ] Expressed milk log
[ ] Formula log
[ ] Daily history
[ ] Daily summary
[ ] Reference-based feeding calculator
```

---

## Phase 7 — Production PWA

Implement:

```text
[ ] Production manifest
[ ] Service worker
[ ] Installability
[ ] Offline shell
[ ] Safe caching strategy
[ ] PWA icons
[ ] Lighthouse testing
```

---

# 58. Definition of Done

Feature dianggap selesai jika:

```text
[ ] Responsive
[ ] Mobile usable
[ ] Server validated
[ ] Authorized
[ ] Type safe
[ ] Error handled
[ ] Loading handled
[ ] Empty state handled
[ ] Accessible
[ ] Tested
```

Untuk medical calculation:

```text
[ ] Reference documented
[ ] Dataset source documented
[ ] Reference version known
[ ] Unit tested against known values
[ ] No invented constants
```

---

# 59. MVP Acceptance Criteria

MVP dianggap berhasil ketika user dapat:

```text
1. Register
2. Login
3. Tambah anak
4. Pilih laki-laki/perempuan
5. Pilih TERM/PRETERM
6. Input gestational age jika PRETERM
7. Input berat badan
8. Input panjang/tinggi badan
9. Input lingkar kepala
10. Melihat measurement history
11. Melihat grafik pertumbuhan
12. Melihat reference curve yang sesuai
13. Melihat chronological age
14. Melihat corrected age jika relevan
15. Mencatat ASI/ASI perah/sufor
16. Melihat daily feeding summary
17. Menggunakan aplikasi dari HP
18. Install aplikasi sebagai PWA
```

---

# 60. Coding Rules

Gunakan:

```text
TypeScript strict mode
```

Hindari:

```text
any
```

jika tidak benar-benar diperlukan.

Gunakan:

```text
async/await
```

dengan proper error handling.

Pisahkan:

```text
UI
Business logic
Database
Validation
Medical calculation
```

Jangan membuat satu file/page dengan seluruh logic aplikasi.

---

# 61. Naming

Gunakan English untuk source code:

```text
child
measurement
feeding
growth
weight
height
headCircumference
gestationalAge
correctedAge
```

UI dapat menggunakan Bahasa Indonesia.

Contoh:

```tsx
<Button>Tambah Pengukuran</Button>
```

tetapi function:

```ts
createMeasurement()
```

bukan:

```ts
buatPengukuran()
```

---

# 62. Medical Reference Sources

Gunakan sumber primer/resmi bila memungkinkan.

## WHO Child Growth Standards

https://www.who.int/tools/child-growth-standards

Digunakan untuk reference pertumbuhan anak sesuai cakupan standar WHO.

## Preterm Growth

American Academy of Pediatrics — Preterm Infant Growth Tools:

https://www.aap.org/en/patient-care/newborn-infant-and-early-childhood-nutrition/newborn-and-infant-nutrition-assessment-tools/preterm-infant-growth-tools/

Reference yang dipilih harus didokumentasikan termasuk versi dan dataset yang digunakan.

## Feeding/Nutrition

Gunakan guideline pediatrik/neonatal yang sesuai dengan kelompok usia dan kondisi anak.

Jangan menggunakan artikel blog sebagai sumber utama formula medis.

---

# 63. README Medical Data Documentation

Ketika dataset WHO/preterm sudah dimasukkan ke repository, tambahkan dokumentasi:

```text
docs/
└── medical-references/
    ├── README.md
    ├── who-growth.md
    ├── preterm-growth.md
    └── feeding.md
```

Setiap dokumen harus mencatat:

```text
Source
URL
Version/publication
Date downloaded
Data transformation
Calculation formula
Known limitations
```

---

# 64. Future Features

Setelah MVP stabil, pertimbangkan:

```text
Vaccination tracking
Development milestone tracking
Sleep tracking
Solid food / MPASI tracking
Medication notes
Doctor visit history
Export PDF
Export CSV
Reminder measurement
Reminder feeding
Push notification
Family/caregiver sharing
Pediatrician sharing
Growth report
Dark mode
Multi-language
```

Fitur tersebut bukan prioritas MVP.

---

# 65. AI Coding Agent Instructions

Jika project ini dikerjakan menggunakan AI coding agent:

1. Baca seluruh README sebelum mengubah code.
2. Jangan mengganti technology stack tanpa alasan yang jelas.
3. Jangan membuat medical constants sendiri.
4. Jangan mengarang data WHO/Fenton.
5. Jangan menghapus migration lama setelah digunakan.
6. Gunakan PostgreSQL 17.
7. Gunakan Drizzle.
8. Gunakan shadcn/ui.
9. Pertahankan mobile-first design.
10. Pertahankan PWA support.
11. Semua input harus divalidasi server-side.
12. Semua child resources harus melalui authorization.
13. Medical calculation harus dipisahkan dari UI.
14. Tambahkan test ketika membuat calculation.
15. Jangan menganggap UI yang terlihat benar berarti calculation benar.
16. Jangan menampilkan dummy medical calculation sebagai hasil produksi.
17. Jika reference medis belum tersedia, tampilkan fitur sebagai belum tersedia daripada mengarang nilai.
18. Jalankan lint, typecheck, test, dan production build sebelum menyatakan task selesai.
19. Jangan menonaktifkan TypeScript/ESLint hanya agar build lolos.
20. Perbaiki root cause error, bukan menyembunyikannya.

---

# 66. Development Priority

Prioritas implementasi:

```text
SECURITY
   ↓
DATA INTEGRITY
   ↓
MEDICAL CALCULATION CORRECTNESS
   ↓
FUNCTIONALITY
   ↓
MOBILE UX
   ↓
VISUAL POLISH
```

Jangan mengorbankan correctness calculation hanya untuk mempercepat UI.

---

# 67. Project Goal

Target akhir project adalah aplikasi yang:

- mudah digunakan orang tua;
- berjalan baik di smartphone;
- installable sebagai PWA;
- menyimpan riwayat pertumbuhan secara aman;
- mendukung bayi cukup bulan dan prematur;
- menggunakan growth reference yang terdokumentasi;
- memiliki chart yang mudah dipahami;
- mencatat ASI/ASI perah/susu formula;
- tidak mengarang data medis;
- memiliki architecture yang memungkinkan reference medis diperbarui tanpa menulis ulang UI.

---

# 68. Final Architecture

```text
                         ┌────────────────────┐
                         │       PWA          │
                         │ Next.js + shadcn   │
                         └─────────┬──────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                 AUTH                        DASHBOARD
                    │                             │
                    │                       ┌─────┴─────┐
                    │                       │           │
                    │                    CHILDREN    SETTINGS
                    │                       │
                    │              ┌────────┼────────┐
                    │              │        │        │
                    │          PROFILE   GROWTH   FEEDING
                    │                       │        │
                    │                  MEASUREMENT  LOG
                    │                       │        │
                    │                  GROWTH ENGINE│
                    │                       │        │
                    │               ┌───────┴───┐    │
                    │               │           │    │
                    │              WHO       PRETERM │
                    │               │           │    │
                    └───────────────┴─────┬─────┴────┘
                                          │
                                    PostgreSQL 17
```

---

# 69. Start Implementation

Urutan pengerjaan pertama:

```text
1. Initialize Next.js + TypeScript
2. Configure Tailwind CSS
3. Configure shadcn/ui
4. Configure PostgreSQL 17
5. Configure Drizzle
6. Create database schema
7. Configure authentication
8. Create responsive application shell
9. Create PWA manifest
10. Create Register
11. Create Login
12. Create Dashboard
13. Create Add Child wizard
14. Create Child Profile
15. Create Measurement CRUD
16. Validate foundation with lint/typecheck/test/build
17. Implement growth reference datasets
18. Implement growth engine
19. Validate growth calculation
20. Implement growth charts
21. Implement feeding module
22. Complete PWA/offline strategy
```

Do not skip medical calculation validation.

---

# 70. Important Rule

**Never invent medical data.**

Jika suatu nilai, percentile, z-score, growth curve, corrected-age rule, atau feeding recommendation belum memiliki reference yang tervalidasi:

```text
DO NOT GUESS.
DO NOT HARDCODE RANDOM VALUES.
DO NOT PRESENT DUMMY VALUES AS REAL RESULTS.
```

Cari dan dokumentasikan reference terlebih dahulu.

---

## License

Tentukan license project sebelum aplikasi didistribusikan.

Medical reference datasets mungkin memiliki ketentuan penggunaan masing-masing. Pastikan hak penggunaan dan distribusi dataset diperiksa sebelum memasukkannya ke public repository.

---

**Project:** Tumbuh Kembang Anak  
**Platform:** Web + PWA  
**Frontend/Backend:** Next.js + TypeScript  
**UI:** shadcn/ui + Tailwind CSS  
**Database:** PostgreSQL 17  
**ORM:** Drizzle  
**Primary Device:** Smartphone / Mobile First