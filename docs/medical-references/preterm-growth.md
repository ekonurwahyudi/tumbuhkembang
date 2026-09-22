# Preterm Growth Reference

**Status: belum diterapkan.** Dataset preterm belum dimasukkan ke repository.
Yang sudah diterapkan hanya perhitungan usia (corrected age dan post-menstrual
age) — lihat [age-terminology.md](./age-terminology.md).

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
