/**
 * Batas unggah foto, dipisah dari `storage.ts` karena modul itu `server-only`
 * sementara form di client perlu angka yang sama untuk pesan validasinya.
 * Server tetap yang menegakkan — ini hanya agar keduanya tidak berbeda diam-diam.
 */

/** Tipe yang boleh DIPILIH pengguna. */
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Batas berkas pilihan pengguna, sebelum dikompresi. */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/**
 * Batas yang ditegakkan server, setelah kompresi di client.
 *
 * Lebih longgar dari `MAX_PHOTO_BYTES` dengan sengaja: hasil kompresi hampir
 * selalu jauh lebih kecil, tapi client tidak bisa dipercaya — permintaan bisa
 * dibuat tanpa lewat form sama sekali. Ini pagar terakhir, bukan angka yang
 * dilihat pengguna.
 */
export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

/** Sisi terpanjang hasil kompresi. Avatar terbesar di UI 64px (128px @2x). */
export const PHOTO_MAX_DIMENSION = 512;

export const PHOTO_OUTPUT_TYPE = "image/webp";
export const PHOTO_WEBP_QUALITY = 0.82;
