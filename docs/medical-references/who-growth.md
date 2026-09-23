# WHO Child Growth Standards

**Status: diterapkan** untuk weight-for-age, length/height-for-age, dan
head-circumference-for-age pada anak usia 0–5 tahun.

## Source

World Health Organization — **WHO Child Growth Standards** (2006), dikembangkan
dari WHO Multicentre Growth Reference Study (MGRS).

- Portal: https://www.who.int/tools/child-growth-standards
- Tabel: https://www.who.int/tools/child-growth-standards/standards
- **Tanggal unduh: 2026-09-22**

### Berkas yang diunduh

Seluruhnya *expanded tables* (satu baris per hari usia), format `.xlsx`,
disimpan apa adanya di [`data/who-source/`](../../data/who-source/):

| Berkas | Indikator | Sex |
|---|---|---|
| `wfa-boys-zscore-expanded-tables.xlsx` | Weight-for-age | Laki-laki |
| `wfa-girls-zscore-expanded-tables.xlsx` | Weight-for-age | Perempuan |
| `lhfa-boys-zscore-expanded-tables.xlsx` | Length/height-for-age | Laki-laki |
| `lhfa-girls-zscore-expanded-tables.xlsx` | Length/height-for-age | Perempuan |
| `hcfa-boys-zscore-expanded-tables.xlsx` | Head circumference-for-age | Laki-laki |
| `hcfa-girls-zscore-expanded-tables.xlsx` | Head circumference-for-age | Perempuan |

Setiap berkas memuat 1857 baris: hari ke-0 sampai ke-1856 (0–5 tahun), dengan
kolom `Day, L, M, S` diikuti kolom nilai `SD4neg … SD4`.

## Data transformation

Script: [`scripts/build-who-dataset.py`](../../scripts/build-who-dataset.py)
(stdlib Python saja — `.xlsx` adalah zip berisi XML).

Keluaran: `src/lib/growth/data/who-<indikator>-<sex>.json`

Yang dilakukan script:

1. Membaca kolom `Day, L, M, S` dan **menyalinnya apa adanya** — tanpa
   pembulatan, interpolasi, maupun penyesuaian nilai.
2. **Verifikasi silang:** untuk setiap baris dan setiap kolom SD milik WHO,
   z-score dihitung ulang dari L/M/S dan harus menghasilkan kembali nilai SD
   tersebut. Script berhenti dengan galat bila selisihnya melebihi 0.005.
3. Memastikan baris hari berurutan tanpa celah.

Selisih maksimum pada verifikasi terakhir:

| Dataset | Selisih maks |
|---|---|
| weight-for-age (L / P) | 1.37e-03 / 1.40e-03 |
| length-for-age (L / P) | 2.63e-04 / 2.64e-04 |
| head-circumference-for-age (L / P) | 4.28e-04 / 4.34e-04 |

Selisih sekecil ini berasal dari pembulatan tabel WHO ke 3 desimal, bukan dari
perbedaan rumus.

## Calculation formula

Sumber rumus: WHO, *Computation of centiles and z-scores for height-for-age,
weight-for-age and BMI-for-age* —
https://cdn.who.int/media/docs/default-source/child-growth/growth-reference-5-19-years/computation.pdf

Dokumen tersebut menyatakan metodenya mengikuti WHO Child Growth Standards,
yakni dataset yang dipakai aplikasi ini.

Implementasi: [`src/lib/growth/lms.ts`](../../src/lib/growth/lms.ts)

### Nilai pada z-score tertentu

```
X(z) = M × (1 + L×S×z)^(1/L)     bila L ≠ 0
X(z) = M × exp(S×z)              bila L = 0
```

### z-score dari pengukuran

```
z_ind = ((y/M)^L − 1) / (L×S)    bila L ≠ 0
z_ind = ln(y/M) / S              bila L = 0
```

### Koreksi ekor di luar ±3 SD — WAJIB

WHO membatasi distribusi Box-Cox normal pada rentang di mana data empiris
tersedia (−3 SD sampai +3 SD). Di luar itu standar deviasi dipatok pada jarak
antara 2 SD dan 3 SD:

```
z* = 3 + (y − SD3pos) / SD23pos      bila z_ind > 3
z* = −3 + (y − SD3neg) / SD23neg     bila z_ind < −3
z* = z_ind                            selain itu

SD3pos  = M(1 + L×S×3)^(1/L)
SD23pos = M(1 + L×S×3)^(1/L) − M(1 + L×S×2)^(1/L)
SD3neg  = M(1 − L×S×3)^(1/L)
SD23neg = M(1 − L×S×2)^(1/L) − M(1 − L×S×3)^(1/L)
```

Tanpa koreksi ini, nilai ekstrem meleset dari tabel resmi WHO. Hal tersebut
terbukti saat dataset dibangun: verifikasi silang gagal pada kolom `SD4`/`SD4neg`
dengan selisih 0.17, sementara kolom ±1 sampai ±3 sudah cocok. Setelah koreksi
diterapkan, seluruh kolom cocok.

### Persentil

Persentil dihitung dari z-score memakai fungsi distribusi kumulatif normal
standar, dengan pendekatan fungsi error Abramowitz & Stegun 7.1.26
(galat maksimum 1.5e-7).

## Lookup usia

Tabel WHO menyediakan satu baris per hari, sehingga lookup adalah indeks
langsung tanpa interpolasi. Usia di luar 0–1856 hari **tidak diekstrapolasi** —
aplikasi menyatakan hasilnya di luar cakupan.

Implementasi: [`src/lib/growth/who.ts`](../../src/lib/growth/who.ts)

## Pemilihan sumbu usia

| Kondisi anak | Sumbu usia |
|---|---|
| Cukup bulan | Usia kronologis |
| Prematur, corrected age ≥ 0, usia kronologis ≤ 3 tahun | Corrected age |
| Prematur, corrected age < 0 (belum mencapai term) | Tidak dihitung — reference preterm belum tersedia |
| Prematur, usia kronologis > 3 tahun | Usia kronologis (batas koreksi AAP) |

Lihat [age-terminology.md](./age-terminology.md) dan
[preterm-growth.md](./preterm-growth.md).

## Unit test

[`src/lib/growth/lms.test.ts`](../../src/lib/growth/lms.test.ts) dan
[`src/lib/growth/engine.test.ts`](../../src/lib/growth/engine.test.ts)
menguji terhadap **nilai yang tercetak di tabel WHO**, bukan sekadar memastikan
fungsi berjalan. Contoh nilai acuan yang dipakai:

| Indikator | Sex | Hari | L | M | S | Median | −2 SD | +3 SD |
|---|---|---|---|---|---|---|---|---|
| Weight-for-age | L | 0 | 0.3487 | 3.3464 | 0.14602 | 3.346 | 2.459 | 5.031 |
| Weight-for-age | L | 365 | 0.0645 | 9.6460 | 0.10925 | 9.646 | 7.741 | 13.341 |
| Weight-for-age | P | 1856 | −0.3531 | 18.3890 | 0.14892 | 18.389 | 13.854 | 29.903 |
| Length-for-age | L | 0 | 1.0000 | 49.8842 | 0.03795 | 49.884 | 46.098 | 55.564 |
| Head circ.-for-age | P | 365 | 1.0000 | 44.8940 | 0.03027 | 44.894 | 42.176 | — |

## Known limitations

- Cakupan standar WHO adalah **0–5 tahun**. Di atas itu diperlukan WHO Growth
  Reference 5–19 tahun, yang belum diterapkan.
- Indikator **weight-for-length/height** dan **BMI-for-age** belum diterapkan:
  keduanya memakai sumbu panjang/tinggi, bukan usia, sehingga butuh struktur
  dataset tersendiri.
- Bayi prematur dinilai memakai WHO dengan corrected age. Ini pendekatan yang
  lazim setelah bayi mencapai usia term, tetapi **bukan** pengganti reference
  khusus preterm (mis. Fenton) pada fase sebelum term. Lihat
  [preterm-growth.md](./preterm-growth.md).
- Distribusi z-score dapat sedikit menyimpang dari normal pada ekor ekstrem
  (di luar ±3 SD) — konsekuensi yang dinyatakan sendiri oleh WHO.

## Lisensi dan penggunaan ulang

Ketentuan penggunaan dataset WHO harus diperiksa sebelum repository
dipublikasikan. Berkas sumber disimpan di `data/who-source/` agar asal-usulnya
jelas dan dapat ditelusuri.
