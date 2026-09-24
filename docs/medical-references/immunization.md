# Immunization Reference

**Status: diterapkan sebagian.** Katalog vaksin wajib usia 0–24 bulan
diterapkan. Booster usia sekolah (BIAS) dan vaksin non-wajib (mis. HPV,
varisela, dengue, influenza, tifoid) tidak dimasukkan katalog — orang tua
dapat mencatatnya lewat entri custom.

## Source

Program Imunisasi Nasional (*Imunisasi Rutin Lengkap* / *Imunisasi Dasar dan
Lanjutan Baduta*), Kementerian Kesehatan RI.

- https://ayosehat.kemkes.go.id/materi---poster-jadwal-imunisasi-dasar
- https://ayosehat.kemkes.go.id/1000-hari-pertama-kehidupan/seputar-imunisasi
- Cross-check jadwal 2024 (penambahan IPV2 untuk eradikasi polio):
  https://www.biofarma.co.id/id/announcement/detail/catat-jadwal-imunisasi-anak-terbaru-2024
  (mereproduksi jadwal rekomendasi IDAI 2024, kolom "Mandatory" dipakai
  sebagai penanda vaksin program pemerintah)
- Tanggal dikonsultasikan: 2026-09-24

## Implementasi

Katalog: [`src/lib/immunization/catalog.ts`](../../src/lib/immunization/catalog.ts).

Setiap entri katalog punya `minAgeMonths` — usia kalender penuh (bulan)
minimum saat dosis itu mulai boleh diberikan, dihitung dengan fungsi yang
sama dipakai di seluruh aplikasi untuk usia:
`chronologicalAge(...).totalMonths` (lihat
[`src/lib/growth/age.ts`](../../src/lib/growth/age.ts)).

## Syarat berat badan

Koreksi dari dua versi sebelumnya dokumen ini (awalnya "tidak ada syarat
berat sama sekali", lalu "hanya HB0"). Jadwal rutin untuk anak cukup bulan
berat normal memang murni berbasis usia, tapi ada **tiga syarat berat
terpisah** di sumber yang dipakai, dengan dua bentuk mekanisme yang berbeda:

### Bentuk 1 — `delayToAge`: menunda ke usia kalender tetap

**HB0**, berat lahir < 2000 gram → ditunda sampai usia 1 bulan (bukan
diberikan di 0–24 jam seperti bayi cukup berat). ini satu-satunya sumber yang
memberi usia pengganti yang tetap ("1 bulan"), sehingga dimodelkan sebagai
pergeseran `minAgeMonths`.

- Sumber: https://hellosehat.com/parenting/bayi/bayi-prematur/imunisasi-bayi-prematur/
  (dikonsultasikan 2026-09-24), cross-check dengan pedoman IDAI/Kemenkes
  untuk imunisasi bayi prematur/BBLR.

### Bentuk 2 — `requireCurrentWeight`: menunda sampai berat TERKINI pulih

Dua kasus lain tidak punya usia pengganti tetap — sumbernya bilang "tunggu
sampai berat badan mencapai X", bukan "tunggu sampai usia Y". Ini berarti
gate-nya harus mengecek berat badan **saat ini** (dari pengukuran
pertumbuhan terakhir, `growth_measurements.weightKg`), bukan berat lahir —
berat lahir hanya dipakai untuk menentukan APAKAH syarat ini berlaku untuk
anak tersebut.

- **BCG**, bayi BBLR (berat lahir < 2500 gram): satu artikel Sari Pediatri
  membandingkan hasil uji tuberkulin pada bayi BBLR yang diberi BCG segera
  setelah lahir vs. yang menunggu berat badan pulih > 2500 gram — "Uji
  Tuberkulin pada Bayi BBLR yang Mendapat BCG Segera Setelah Lahir dan yang
  Menunggu Berat Badan > 2500 Gram", Sari Pediatri
  (https://saripediatri.org/index.php/sari-pediatri/article/view/733,
  dikonsultasikan 2026-09-24). **Catatan kejujuran sumber**: ini adalah
  artikel studi perbandingan dua protokol, BUKAN rekomendasi resmi
  Kemenkes/IDAI yang mewajibkan angka 2500 gram — tidak ditemukan sumber
  resmi yang menetapkan angka berat spesifik untuk BCG. Angka 2500 gram
  diterapkan di sini sebagai ambang yang secara eksplisit diteliti dan
  dilaporkan, bukan konstanta yang dikarang, tapi levelnya di bawah HB0's
  2000 gram (yang muncul di pedoman praktik klinis, bukan hanya studi
  perbandingan). BCG's syarat usia gestasi (< 34 minggu → ditunda, per
  sumber hellosehat) tetap dimodelkan terpisah lewat `gestationalAgeWeeks`
  pada `children`, tidak digabung ke gate berat ini.
- **Polio (OPV/IPV) & DPT-HB-Hib**, bayi **prematur** (`birthType ===
  "PRETERM"`, bukan sekadar berat lahir rendah): sumber hellosehat.com yang
  sama menyebutkan dosis-dosis ini pada bayi prematur baru diberikan setelah
  usia > 2 bulan DAN berat badan SAAT INI > 2000 gram — dua syarat yang
  harus dipenuhi bersamaan (usia lewat `minAgeMonths` normal masing-masing
  dosis, sudah ≥2 bulan untuk semua entri katalog OPV/DPT-HB-Hib; berat
  lewat gate ini). Diterapkan ke semua dosis OPV1–4 dan DPT-HB-Hib 1–4
  (bukan hanya dosis pertama) karena sumber tidak merinci per-dosis dan
  tidak ada dasar untuk mempersempitnya — batasan ini dicatat di bawah.
  IPV1/IPV2 tidak diberi gate ini karena sumber spesifik menyebut
  "Polio"/OPV dan DPT, tidak eksplisit menyebut IPV suntik.

Vaksin program lain (PCV, Rotavirus, IPV, MR) tidak memiliki syarat berat
badan di sumber manapun yang dipakai — tetap murni usia.

### Implementasi

- `children.birthWeightGrams` (nullable, gram) — [`src/schemas/child.ts`](../../src/schemas/child.ts),
  [`src/db/schema/index.ts`](../../src/db/schema/index.ts). Opsional untuk
  semua status kelahiran (BBLR bisa terjadi juga pada bayi cukup bulan).
  Dipakai juga sebagai fallback "berat terkini" sebelum ada pengukuran
  pertumbuhan tercatat (lihat `page.tsx`'s `currentWeightGrams`).
- `CatalogVaccine.lowBirthWeight` di
  [`src/lib/immunization/catalog.ts`](../../src/lib/immunization/catalog.ts)
  — union dua bentuk:
  - `{ kind: "delayToAge", triggerBelowGrams, minAgeMonths }` — hanya `HB0`.
    Dibaca oleh `effectiveMinAgeMonths(cv, birthWeightGrams)`.
  - `{ kind: "requireCurrentWeight", requiredGrams, triggerBelowGrams?,
    pretermOnly? }` — `BCG` (triggerBelowGrams: 2500) dan semua entri
    OPV/DPT-HB-Hib (pretermOnly: true). Dibaca oleh
    `weightGateSatisfied(cv, child, currentWeightGrams)`, yang mengembalikan
    `true` (tidak menahan) bila: tidak ada rule jenis ini, rule tidak
    berlaku untuk anak ini (bukan BBLR/bukan prematur sesuai rule), atau
    berat terkini belum diketahui (konsisten dengan `effectiveMinAgeMonths`
    — berat tidak diketahui tidak pernah dianggap menunda apa pun).

## Menandai vaksin tidak berlaku untuk anak tertentu

Katalog di atas berlaku untuk semua anak secara default, tapi orang tua bisa
menandai satu entri katalog sebagai "tidak berlaku" untuk anak tertentu
(alergi, kontraindikasi medis, dosis sudah diberikan di luar negeri tanpa
catatan resmi, dll.) tanpa menghapus data historis apa pun. Ini disimpan di
tabel `vaccination_skips` ([`src/db/schema/index.ts`](../../src/db/schema/index.ts))
— pencatatan preferensi per anak, bukan fakta medis, jadi tidak tunduk pada
aturan "tidak ada konstanta medis yang dikarang". Bisa dibatalkan kapan saja
lewat tombol "Batalkan" pada baris yang sudah ditandai.

## Kapan status "Perlu diberikan" ditampilkan

`chronologicalAge(child.dateOfBirth).totalMonths >= effectiveMinAgeMonths(...)`
DAN `weightGateSatisfied(...)` bernilai `true` DAN belum ada catatan untuk
`catalogKey` tersebut. Ini adalah syarat **minimum** boleh diberikan menurut
jadwal rutin, bukan batas maksimum/keterlambatan — aplikasi tidak menilai
keterlambatan, karena jadwal kejar (*catch-up schedule*) untuk imunisasi yang
tertunda punya aturan interval tersendiri yang belum diterapkan.

## Known limitations

- Sumber sekunder (bukan teks resmi Permenkes/Kepmenkes) karena poster resmi
  Kemenkes berupa gambar, bukan teks yang dapat diekstrak. Jadwal
  dikonfirmasi silang di tiga sumber sebelum dipakai; namun rincian jadwal
  program pemerintah memang direvisi dari waktu ke waktu (PCV dan Rotavirus
  masuk program nasional 2022, IPV2 ditambahkan 2024) — versi di atas adalah
  yang berlaku saat tanggal dikonsultasikan.
- Booster usia sekolah (BIAS, kelas 1/2/5 SD) tidak dimasukkan katalog karena
  cakupan usia aplikasi ini secara umum masih berhenti di awal masa kanak
  (lihat batas usia growth reference lain di [who-growth.md](./who-growth.md)).
  Orang tua tetap bisa mencatatnya sebagai vaksin custom.
- Tidak ada jadwal kejar (*catch-up*) untuk dosis yang terlewat/terlambat —
  di luar cakupan versi ini.
- Gate berat OPV/DPT-HB-Hib diterapkan sama ke semua dosis dalam serinya
  (1–4), bukan hanya dosis pertama, karena sumber tidak merinci per-dosis.
  Bila kelak ditemukan sumber yang membedakan (mis. hanya dosis awal seri
  yang disyaratkan), sempit ke entri katalog yang relevan saja.
- BCG's angka 2500 gram berasal dari artikel studi perbandingan (Sari
  Pediatri), bukan pedoman resmi Kemenkes/IDAI — lihat catatan kejujuran
  sumber di atas.
