# Feeding / Nutrition Reference

**Status: diterapkan sebagian.** Pencatatan asupan berjalan penuh. Estimasi
kebutuhan tersedia untuk **susu formula pada bayi cukup bulan maupun
prematur, usia 5 hari sampai sekitar 6 bulan** — di luar itu aplikasi
menyatakan estimasi tidak tersedia.

## Prinsip

1. Tidak ada rumus universal buatan sendiri.
2. Blog atau artikel populer tidak dipakai sebagai sumber rumus medis.
3. Output berupa **"estimasi kisaran asupan"**, tidak pernah "anak harus minum X ml".
4. Sesi menyusui langsung tanpa volume terukur **tidak** dijumlahkan ke total ml —
   hanya dihitung sebagai jumlah sesi.

## Source

Dua sumber terpisah, satu per status kelahiran — bukan satu rumus untuk
semua, karena kebutuhan bayi prematur dan cukup bulan berbeda dan masing-
masing sumber hanya bicara tentang populasinya sendiri.

**Bayi prematur** — ESPGHAN, *"Enteral Nutrition in Preterm Infants"* (2022)

- URL: https://www.espghan.org/dam/jcr:092f7f5a-6557-433c-98d6-7259ab1a9cfa/Enteral%20Nutrition%20in%20Preterm%20Infants%202022%20A.204.pdf
- Tanggal dikonsultasikan: 2026-09-24
- Dikutip apa adanya: "Target feeding volume 150–180 mL/kg/day for preterm
  infants... most stable growing infants require fluid intakes 150–180
  mL/kg/day to achieve appropriate growth."

**Bayi cukup bulan** — Children's Health Queensland Hospital and Health
Service, *"Your guide to the first 12 months"*, dikutip lewat halaman klinis
Nutricia

- URL: https://nutricia.com.au/paediatrics/resources/how-much-formula-to-give-baby/
- Tanggal dikonsultasikan: 2026-09-24
- Dikutip apa adanya (via Nutricia): "5 days–3 months: 150 mL/kg bodyweight
  per day"; "3–6 months: 120mL/kg bodyweight per day".
- **Catatan kejujuran sumber**: dua URL qld.gov.au yang menyebut angka yang
  sama (dikonfirmasi lewat cuplikan hasil pencarian, teratribusi ke Children's
  Health Queensland) mengembalikan HTTP 403 saat dicoba diambil langsung dari
  lingkungan ini. Angka di atas TIDAK diverifikasi langsung terhadap halaman
  qld.gov.au primernya — hanya lewat relay Nutricia dan cuplikan pencarian
  yang keduanya mengatribusikan ke sumber yang sama. Sama seperti BCG di
  [immunization.md](./immunization.md), ini dicatat sebagai keterbatasan,
  bukan disembunyikan.

Rentang usia 0–5 hari (30–60 mL/kg, naik harian) dan AAP's rumus per-pon lama
tidak lagi dipakai — lihat "Known limitations" dan riwayat git untuk versi
sebelumnya.

## Calculation formula

Implementasi: [`src/lib/feeding/calculator.ts`](../../src/lib/feeding/calculator.ts)

```
// Prematur (ESPGHAN)
estimasi_ml_min = round(berat_kg × 150)
estimasi_ml_max = round(berat_kg × 180)

// Cukup bulan, 5 hari – 3 bulan (Children's Health Queensland)
estimasi_ml = round(berat_kg × 150)

// Cukup bulan, 3 – 6 bulan (Children's Health Queensland)
estimasi_ml = round(berat_kg × 120)
```

Konstanta `PRETERM_ML_PER_KG_MIN = 150`, `PRETERM_ML_PER_KG_MAX = 180`,
`TERM_ML_PER_KG_5DAYS_TO_3MONTHS = 150`, `TERM_ML_PER_KG_3TO6MONTHS = 120` —
seluruhnya berasal dari kutipan di atas, tidak ada yang diturunkan sendiri.
150 mL/kg tidak diperpanjang ke rentang 3–6 bulan meski sama-sama "bayi cukup
bulan", karena sumbernya sendiri memberi angka berbeda (120) untuk rentang
usia itu — memperpanjang 150 ke sana berarti melampaui apa yang dikutip.

## Kapan estimasi TIDAK ditampilkan

| Kondisi | Alasan |
|---|---|
| Belum ada berat badan tercatat | Tidak ada dasar perhitungan; tidak ditebak. |
| Usia < 5 hari | Sumber menyatakan volume naik bertahap tiap hari (30–60 mL/kg) pada rentang ini, bukan satu angka mL/kg yang tetap — tidak dimodelkan. |
| Usia ≥ 6 bulan (183 hari) | Makanan pendamping mulai menyumbang asupan, sehingga kebutuhan susu tidak lagi dapat dihitung dari berat badan saja. |
| Bayi menyusu langsung | Lihat di bawah. |

## Mengapa tidak ada target volume untuk ASI langsung

World Health Organization — **Infant and young child feeding**

- URL: https://www.who.int/news-room/fact-sheets/detail/infant-and-young-child-feeding
- Tanggal dikonsultasikan: 2026-09-23

WHO menganjurkan menyusui **responsif**, yaitu "as often as the child wants, day
and night", serta ASI eksklusif selama 6 bulan pertama. Dokumen tersebut **tidak
mencantumkan target volume dalam ml sama sekali**.

Karena itu aplikasi tidak pernah menampilkan target ml untuk bayi yang menyusu
langsung, dan tidak memperkirakan volume sesi menyusui yang tidak terukur.

## Aturan agregasi harian

Implementasi: [`src/lib/feeding/summary.ts`](../../src/lib/feeding/summary.ts)

- Sesi `BREAST_DIRECT` tanpa `amount_ml` dihitung sebagai **jumlah sesi**, tidak
  pernah masuk total ml.
- `null` dibedakan dari `0`: tidak ada volume terukur bukan berarti nol ml.
- Bila ada sesi tanpa volume, layar menyatakan bahwa total hanya mencakup sesi
  yang volumenya tercatat.

## Unit test

[`src/lib/feeding/calculator.test.ts`](../../src/lib/feeding/calculator.test.ts)
menguji setiap tier: rentang prematur 150–180 mL/kg, cukup bulan 150 mL/kg
(<3 bulan) dan 120 mL/kg (3–6 bulan), serta kapan estimasi ditolak (tanpa
berat, usia <5 hari, usia ≥6 bulan).
[`src/lib/feeding/summary.test.ts`](../../src/lib/feeding/summary.test.ts)
menguji aturan agregasi, termasuk contoh dari spesifikasi (3 sesi ASI langsung +
180 ml perah + 200 ml sufor = total terukur 380 ml).

## Known limitations

- Angka cukup bulan (Children's Health Queensland) hanya diverifikasi lewat
  relay Nutricia dan cuplikan hasil pencarian, bukan langsung terhadap halaman
  qld.gov.au primernya (403 saat diakses dari lingkungan ini) — lihat catatan
  kejujuran sumber di atas.
- Estimasi ini tidak memperhitungkan kondisi klinis, kebutuhan kejar tumbuh,
  maupun anjuran dokter yang merawat.
- Usia 0–5 hari tidak diestimasi — volumenya naik bertahap tiap hari, bukan
  satu angka mL/kg tetap.
