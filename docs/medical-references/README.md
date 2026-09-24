# Medical References

Seluruh perhitungan medis dalam aplikasi ini harus dapat dilacak ke sumber
primer yang terdokumentasi. Folder ini mencatat sumber, versi, tanggal
pengambilan, transformasi data, rumus, dan keterbatasan yang diketahui.

## Aturan

1. **Tidak ada konstanta medis yang dikarang.** Setiap angka punya sumber di sini.
2. Fitur yang referensinya belum tersedia ditampilkan sebagai *belum tersedia*,
   bukan diisi nilai dummy.
3. Setiap dataset dicatat versinya sehingga hasil perhitungan lama tetap dapat diaudit.

## Daftar dokumen

| Dokumen | Cakupan | Status |
|---|---|---|
| [age-terminology.md](./age-terminology.md) | Usia kronologis, corrected age, PMA | Diterapkan |
| [who-growth.md](./who-growth.md) | WHO Child Growth Standards (LMS, z-score, persentil) | Diterapkan |
| [preterm-growth.md](./preterm-growth.md) | Reference preterm (Fenton) | Belum diterapkan |
| [feeding.md](./feeding.md) | Estimasi asupan (AAP) + aturan agregasi | Diterapkan sebagian |
| [immunization.md](./immunization.md) | Katalog vaksin wajib (Kemenkes RI) | Diterapkan sebagian |
