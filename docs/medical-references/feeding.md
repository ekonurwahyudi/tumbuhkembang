# Feeding / Nutrition Reference

**Status: belum diterapkan.** Modul feeding (Phase 6) belum dikerjakan, dan
kalkulator estimasi asupan belum memiliki reference yang dipilih.

## Prinsip

1. Tidak ada rumus universal buatan sendiri. Estimasi kebutuhan asupan berbeda
   menurut usia, berat, status term/preterm, dan kondisi klinis.
2. Blog atau artikel populer tidak dipakai sebagai sumber utama rumus medis.
3. Output selalu berupa **"estimasi kisaran asupan"**, tidak pernah
   "anak harus minum X ml".
4. Sesi menyusui langsung (`BREAST_DIRECT`) tanpa volume terukur **tidak**
   dijumlahkan ke total ml — hanya dihitung sebagai jumlah sesi.

## Sumber kandidat (harus dipilih dan didokumentasikan sebelum implementasi)

- Guideline pediatrik/neonatal resmi yang sesuai kelompok usia
  (mis. rekomendasi nutrisi enteral neonatus untuk bayi preterm,
  dan panduan pemberian makan bayi untuk bayi cukup bulan).
- WHO Infant and Young Child Feeding: https://www.who.int/health-topics/breastfeeding

## Yang harus dicatat sebelum kalkulator diaktifkan

- [ ] Reference yang dipilih, beserta versi/tahun
- [ ] Rentang usia dan berat yang dicakup
- [ ] Rumus persis dan satuannya
- [ ] Kondisi di mana rumus tidak berlaku
- [ ] Nilai uji untuk unit test
