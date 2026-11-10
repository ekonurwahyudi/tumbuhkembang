/**
 * Domain kanonis untuk metadata — canonical URL, sitemap, dan tautan di kartu share.
 *
 * SENGAJA tidak memakai NEXT_PUBLIC_APP_URL: variabel itu menunjuk tempat aplikasi
 * berjalan (localhost saat dev, URL preview saat staging), sedangkan yang dibutuhkan
 * di sini adalah alamat yang diiklankan ke dunia luar. Memakai yang pertama berarti
 * build dev menyisipkan `http://localhost:3000` ke setiap tag og:url dan ke sitemap,
 * dan kartu yang dibagikan menunjuk mesin yang tidak dapat dijangkau siapa pun.
 *
 * Diisi lewat NEXT_PUBLIC_SITE_URL hanya bila domainnya memang berubah.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kembangku.com";

export const SITE_NAME = "Kembangku";
export const SITE_TAGLINE = "Pantau tumbuh kembang si kecil lebih tenang.";
export const SITE_DESCRIPTION =
  "Catat pertumbuhan anak dengan kurva WHO atau Fenton, usia koreksi bayi prematur, " +
  "jadwal imunisasi, dan skrining KPSP — dalam satu aplikasi gratis.";
