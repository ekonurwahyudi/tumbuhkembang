# WHO Child Growth Standards

**Status: belum diterapkan.** Dataset belum dimasukkan ke repository, sehingga
aplikasi belum menampilkan z-score, percentile, maupun kurva reference.
Halaman growth menyatakan hal ini apa adanya, bukan menampilkan nilai dummy.

## Source yang akan digunakan

World Health Organization — **WHO Child Growth Standards** (0–5 tahun).

- Portal: https://www.who.int/tools/child-growth-standards
- Tabel indikator: https://www.who.int/tools/child-growth-standards/standards
- Publikasi metode: *WHO Child Growth Standards: Methods and development*
  (WHO, 2006), yang menjelaskan penggunaan metode Box-Cox power exponential
  dan penyajian parameter **LMS**.

## Indikator yang diperlukan

| Indikator | Sumbu usia | Dipisahkan per sex |
|---|---|---|
| Weight-for-age | usia (hari/bulan) | ya |
| Length/height-for-age | usia (hari/bulan) | ya |
| Weight-for-length/height | panjang/tinggi (cm) | ya |
| Head circumference-for-age | usia (hari/bulan) | ya |
| BMI-for-age | usia (hari/bulan) | ya |

## Rumus z-score dari parameter LMS

Untuk pengukuran `X` dengan parameter reference `L`, `M`, `S` pada usia/sex
yang sesuai:

```
Z = ((X / M)^L − 1) / (L × S)        bila L ≠ 0
Z = ln(X / M) / S                    bila L = 0
```

WHO menerapkan koreksi tambahan pada ekor distribusi (|Z| > 3) untuk indikator
berbasis berat. Aturan ini akan diimplementasikan persis sesuai dokumen WHO,
tidak diaproksimasi.

## Yang harus dicatat saat dataset dimasukkan

- [ ] Nama file sumber dan URL unduhan
- [ ] Tanggal unduh
- [ ] Versi/tahun publikasi tabel
- [ ] Transformasi (mis. xlsx → JSON), beserta script-nya
- [ ] Nilai uji dari tabel resmi untuk unit test
- [ ] Ketentuan lisensi/penggunaan ulang dataset WHO

## Known limitations (untuk diisi)

- Cakupan usia standar WHO adalah 0–5 tahun; di luar itu diperlukan reference lain.
- Bayi prematur tidak langsung dipetakan ke WHO — lihat [preterm-growth.md](./preterm-growth.md).
