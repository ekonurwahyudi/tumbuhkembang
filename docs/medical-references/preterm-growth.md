# Preterm Growth Reference

**Status: diterapkan (Fenton 2013, hasil digitasi).** Lihat `src/lib/growth/fenton.ts`
dan `src/lib/growth/data/fenton-*.json`.

## Apa yang dilakukan aplikasi untuk bayi prematur

| Kondisi | Perlakuan |
|---|---|
| Usia kehamilan saat lahir <= 37 minggu **dan** PMA di dalam cakupan dataset Fenton | **Fenton 2013**, sumbu **post-menstrual age (PMA)**. |
| PMA di luar cakupan Fenton, corrected age >= 0 | WHO Child Growth Standards, sumbu **corrected age**. |
| PMA di luar cakupan Fenton, corrected age < 0 | **Tidak dinilai** — aplikasi menyatakan reference tidak tersedia. |
| Usia kronologis > 3 tahun | WHO dengan usia kronologis (batas koreksi AAP). |

Ambang 37 minggu (`FENTON_MAX_GESTATION_DAYS` di `src/lib/growth/engine.ts`)
sedikit lebih longgar daripada definisi WHO "preterm" (< 37 minggu lengkap):
37w0d ikut masuk, 37w1d tidak. Grafik sumbernya memang masih menggambar sampai
sana, dan ini ambang yang diminta produk.

Perpindahan Fenton → WHO terjadi **otomatis** begitu PMA melewati cakupan
dataset; tidak ada aksi pengguna yang diperlukan.

Pengguna dapat mematikan Fenton lewat `?fenton=off` — saklarnya ada di atas
grafik pada `/children/[id]` dan `/children/[id]/growth`
(`src/components/growth/fenton-switch.tsx`). Saat dimatikan, aturan lama berlaku
dan fase sebelum term kembali tidak dinilai.

Satu grafik hanya menggambar satu sumbu usia. Bayi yang riwayatnya melintasi
batas Fenton→WHO digambar pada sumbu pengukuran **terbaru**; pengukuran lama
tetap punya z-score-nya sendiri, hanya tidak ikut digambar bersama — kedua sumbu
terpaut satu usia gestasi penuh, jadi menggabungkannya akan membuat lintasan
melompat mundur.

Perhitungan usianya sendiri — corrected age dan PMA — lihat
[age-terminology.md](./age-terminology.md).

## Sumber data

- Fenton TR, Kim JH. "A systematic review and meta-analysis to revise the Fenton
  growth chart for preterm infants." *BMC Pediatrics* 2013;13:59.
- Grafik yang didigitasi: Buku KIA Kementerian Kesehatan RI, halaman grafik
  Fenton untuk bayi perempuan dan laki-laki.
- Skrip digitasi: `scripts/fenton/digitize.py` (gambar → LMS mingguan; `build()`
  membaca kolom lengkap, `extend()` melanjutkan tiap indikator di PMA akhir) dan
  `scripts/fenton/emit.py` (LMS mingguan → dataset harian yang dipakai aplikasi).

Tabel LMS Fenton tidak diterbitkan dengan lisensi terbuka; angka di repositori
ini **hasil digitasi grafik**, bukan salinan tabel resmi. Untuk pemakaian klinis
yang memerlukan angka resmi, hubungi penulisnya (https://ucalgary.ca/fenton).

## Cakupan sebenarnya, dan mengapa lebih sempit dari grafiknya

Grafik sumber menggambar 22–50 minggu PMA. Dataset di repositori ini sedikit
lebih sempit, dan **cakupannya berbeda per indikator**:

| | Berat | Panjang | Lingkar kepala |
|---|---|---|---|
| Laki-laki | 24–49 minggu | 24–46 minggu | 24–49 minggu |
| Perempuan | 23–49 minggu | 23–46 minggu | 23–46 minggu |

Sebabnya, semuanya sifat gambar sumbernya:

- **Di bawah ~23–24 minggu kurvanya memang belum digambar** — pemeriksaan
  langsung pada gambar menunjukkan bidang plotnya kosong di sana.
- **Kurva panjang badan keluar dari tepi atas grafik.** Sumbu sentimeter
  berakhir di ~59,9 cm sementara persentil 97 panjang sudah melewati 60 cm pada
  minggu 47; garisnya tidak ada lagi untuk dibaca.
- **Minggu 50 tidak punya cukup kolom** — itu tepi kanan bidang gambar, tempat
  kurvanya bertemu bingkai.

Di atas ~46 minggu pengurutan-menurut-Y milik digitizer runtuh: persentil 97
berat naik melewati 6,3 kg, tinggi gambar yang pada sumbu kiri terbaca 33 cm,
sehingga rumpun berat menyusup ke rumpun lingkar kepala. Yang runtuh hanya cara
mengenali pita, bukan garisnya. Tahap `extend()` di digitizer melewati batas itu
dengan menambatkan tiap indikator pada posisinya sendiri di minggu sebelumnya,
jadi perlintasan antar-rumpun tidak lagi mengganggu.

Menerbitkan tebakan di luar rentang itu lebih buruk daripada menyatakan tidak
tersedia, jadi di luar cakupan aplikasi berpindah ke WHO atau menyatakan
reference tidak berlaku.

Batas terendah, 46 minggu PMA, setara sekitar 6 minggu usia terkoreksi — sudah
berada di dalam cakupan WHO, sehingga tidak ada usia yang kehilangan reference.

## Ketepatan

- Residual LMS tiap minggu yang diterbitkan <= 0,05 unit (ambang `MAX_RMSE` di
  digitizer); minggu yang melewatinya dibuang, bukan diterbitkan.
- Patokan luar: P50 laki-laki pada PMA 30 minggu cocok dengan angka terbitan
  Fenton (berat 1,41 kg; panjang 39,2 cm; lingkar kepala 27,5 cm). Diperiksa
  ulang terhadap berkas JSON yang benar-benar dipakai aplikasi di
  `src/lib/growth/fenton.test.ts`, bukan hanya di dalam digitizer.
- Nilai harian diinterpolasi linear di antara minggu bulat; galat interpolasi
  jauh di bawah galat digitasi (~0,02 unit).

## Known limitations

- Fenton 2013 adalah *growth reference* (deskriptif), berbeda sifat dari WHO yang
  merupakan *growth standard* (preskriptif). Keduanya tidak disamakan dalam satu
  grafik — lihat aturan satu-sumbu di atas.
- Angka hasil digitasi membawa galat pembacaan gambar; bukan pengganti tabel
  resmi untuk keperluan yang menuntut ketepatan penuh.
