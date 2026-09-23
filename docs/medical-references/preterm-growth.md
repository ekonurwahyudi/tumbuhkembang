# Preterm Growth Reference

**Status: belum diterapkan.** Dataset preterm belum dimasukkan ke repository.

## Apa yang dilakukan aplikasi saat ini untuk bayi prematur

| Kondisi | Perlakuan |
|---|---|
| Corrected age < 0 (belum mencapai usia term) | **Tidak dinilai.** Aplikasi menyatakan reference preterm belum tersedia, bukan memakai WHO yang tidak berlaku pada fase ini. |
| Corrected age >= 0, usia kronologis <= 3 tahun | Dinilai dengan WHO Child Growth Standards memakai **corrected age** sebagai sumbu usia. |
| Usia kronologis > 3 tahun | Dinilai dengan WHO memakai usia kronologis (batas koreksi AAP). |

Pemakaian WHO dengan corrected age setelah bayi mencapai usia term adalah
pendekatan yang lazim, tetapi **bukan pengganti** reference khusus preterm pada
fase sebelum term. Karena itu fase tersebut sengaja tidak dinilai.

Perhitungan usianya sendiri — corrected age dan post-menstrual age — sudah
diterapkan; lihat [age-terminology.md](./age-terminology.md).

## Source yang akan digunakan

American Academy of Pediatrics — **Preterm Infant Growth Tools**

- https://www.aap.org/en/patient-care/newborn-infant-and-early-childhood-nutrition/newborn-and-infant-nutrition-assessment-tools/preterm-infant-growth-tools/

Kandidat reference: **Fenton Preterm Growth Chart (2013 revision)**.

- Fenton TR, Kim JH. "A systematic review and meta-analysis to revise the Fenton
  growth chart for preterm infants." *BMC Pediatrics* 2013;13:59.
- Cakupan: 22–50 minggu post-menstrual age, terpisah untuk bayi laki-laki dan perempuan.
- Indikator: weight, length, head circumference.

## Sumbu usia

Chart preterm memakai **post-menstrual age (PMA)**, bukan usia kronologis:

```
PMA = gestational_age_at_birth + chronological_age
```

Sudah diimplementasikan di `postMenstrualAgeDays()`.

## Aturan transisi ke WHO — BELUM DITENTUKAN

Pertanyaan yang harus dijawab dengan reference eksplisit sebelum fitur grafik
diaktifkan:

- [ ] Pada PMA/usia berapa aplikasi berpindah dari Fenton ke WHO?
- [ ] Setelah transisi, sumbu usia yang dipakai: corrected age atau usia kronologis?
- [ ] Sampai usia berapa koreksi diterapkan pada grafik? (AAP menyebut 3 tahun
      untuk terminologi usia; aturan untuk plotting grafik harus dirujuk terpisah.)

Selama pertanyaan ini belum terjawab dengan sumber, aplikasi **tidak** menampilkan
kurva reference untuk bayi prematur.

## Known limitations

- Fenton 2013 adalah *growth reference* (deskriptif, menggambarkan pertumbuhan
  janin/bayi preterm), berbeda sifat dari WHO yang merupakan *growth standard*
  (preskriptif). Keduanya tidak boleh disamakan begitu saja dalam satu grafik.
- Ketentuan lisensi/distribusi dataset Fenton harus diperiksa sebelum file
  datanya dimasukkan ke repository publik.
