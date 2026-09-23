# Feeding / Nutrition Reference

**Status: diterapkan sebagian.** Pencatatan asupan berjalan penuh. Estimasi
kebutuhan hanya tersedia untuk **susu formula pada bayi cukup bulan di bawah
usia 6 bulan** — di luar itu aplikasi menyatakan estimasi tidak tersedia.

## Prinsip

1. Tidak ada rumus universal buatan sendiri.
2. Blog atau artikel populer tidak dipakai sebagai sumber rumus medis.
3. Output berupa **"estimasi kisaran asupan"**, tidak pernah "anak harus minum X ml".
4. Sesi menyusui langsung tanpa volume terukur **tidak** dijumlahkan ke total ml —
   hanya dihitung sebagai jumlah sesi.

## Source

American Academy of Pediatrics — **"Amount and Schedule of Baby Formula Feedings"**

- URL: https://www.healthychildren.org/English/ages-stages/baby/formula-feeding/Pages/amount-and-schedule-of-formula-feedings.aspx
- Tanggal dikonsultasikan: 2026-09-23

Aturan yang dikutip, apa adanya:

> "about 2½ ounces (75 mL) of infant formula a day for every pound (453 g) of body weight"

> "no more than an average of about 32 ounces (960 mL) of formula in 24 hours"

AAP juga menyatakan bayi mengatur sendiri asupannya dan jumlahnya bervariasi
antar individu; penyimpangan yang menetap sebaiknya dibicarakan dengan dokter anak.

## Calculation formula

Implementasi: [`src/lib/feeding/calculator.ts`](../../src/lib/feeding/calculator.ts)

```
pon              = berat_gram / 453
dari_berat_ml    = round(pon × 75)
estimasi_ml      = min(dari_berat_ml, 960)
```

Konstanta `AAP_ML_PER_POUND_PER_DAY = 75`, `POUND_IN_GRAMS = 453`,
`AAP_DAILY_MAX_ML = 960` — seluruhnya berasal dari kutipan di atas, tidak ada
yang diturunkan sendiri.

## Kapan estimasi TIDAK ditampilkan

| Kondisi | Alasan |
|---|---|
| Belum ada berat badan tercatat | Tidak ada dasar perhitungan; tidak ditebak. |
| Bayi prematur | Kebutuhan nutrisi enteral bayi prematur mengikuti guideline neonatal tersendiri yang belum diterapkan. Aturan per-berat AAP di atas ditujukan untuk bayi cukup bulan. |
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
menguji terhadap angka AAP: 1 pon → 75 ml, 5 kg → 828 ml, dan penerapan batas
960 ml/hari. [`src/lib/feeding/summary.test.ts`](../../src/lib/feeding/summary.test.ts)
menguji aturan agregasi, termasuk contoh dari spesifikasi (3 sesi ASI langsung +
180 ml perah + 200 ml sufor = total terukur 380 ml).

## Known limitations

- Aturan AAP yang dikutip berbicara tentang **susu formula**. Aplikasi memakai
  total volume terukur (termasuk ASI perah) hanya sebagai pembanding di layar,
  bukan sebagai klaim bahwa angka yang sama berlaku untuk ASI perah.
- Estimasi ini tidak memperhitungkan kondisi klinis, kebutuhan kejar tumbuh,
  maupun anjuran dokter yang merawat.
- Belum ada reference untuk bayi prematur maupun untuk usia di atas 6 bulan.
