# Age Terminology (Usia Kronologis, Corrected Age, PMA)

## Source

American Academy of Pediatrics, Committee on Fetus and Newborn.
**"Age Terminology During the Perinatal Period."**
*Pediatrics* (November 2004); 114(5): 1362–1364.

- URL: https://publications.aap.org/pediatrics/article/114/5/1362/67715/Age-Terminology-During-the-Perinatal-Period
- PubMed: https://pubmed.ncbi.nlm.nih.gov/15520122/
- Date consulted: 2026-09-22

## Definitions used

| Istilah | Definisi (AAP) | Satuan |
|---|---|---|
| Gestational age | Waktu antara hari pertama haid terakhir (LMP) dan hari kelahiran | minggu |
| Chronological age | Waktu sejak lahir | hari/minggu/bulan/tahun |
| Postmenstrual age (PMA) | Gestational age + chronological age | minggu |
| Corrected age | Chronological age − jumlah minggu lahir sebelum 40 minggu | minggu/bulan |

## Formula yang diimplementasikan

Implementasi: [`src/lib/growth/corrected-age.ts`](../../src/lib/growth/corrected-age.ts)

```
gestational_age_days = gestational_age_weeks × 7 + gestational_age_days
prematurity_days     = max(0, 280 − gestational_age_days)     // 280 hari = 40w0d
corrected_age_days   = chronological_age_days − prematurity_days
post_menstrual_age   = gestational_age_days + chronological_age_days
```

## Batas penerapan

AAP menyatakan corrected age digunakan **hanya untuk anak prematur hingga usia
3 tahun**. Setelah itu aplikasi memakai usia kronologis.

Konstanta: `CORRECTION_LIMIT_DAYS = 3 × 365` di `corrected-age.ts`.

## Kapan PMA vs corrected age dipakai

AAP: selama perawatan perinatal (NICU) gunakan **PMA**; setelah periode perinatal
gunakan **corrected age**. Aplikasi menyediakan keduanya — PMA dipakai sebagai
sumbu usia untuk reference pertumbuhan preterm (Fenton), corrected age
ditampilkan di profil anak.

## Data transformation

Tidak ada transformasi dataset — ini rumus kalender murni, bukan tabel.

Aritmetika tanggal memakai komponen kalender UTC (`Date.UTC`), bukan selisih
epoch lokal, agar bebas dari pergeseran DST. Bulan dihitung secara kalender,
bukan asumsi 30 hari.

## Known limitations

- Gestational age yang dicatat orang tua berasal dari taksiran klinis dan dapat
  berbeda dari penentuan obstetri (LMP vs USG trimester pertama). Aplikasi
  menyimpan nilai apa adanya dan tidak mengoreksinya.
- AAP tidak menetapkan aturan pembulatan untuk corrected age dalam satuan bulan.
  Aplikasi menghitung dalam hari dan melakukan konversi tampilan saja.
