import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_BYTES } from "./storage-limits";

/**
 * Aturan penerimaan foto, tanpa menyentuh DOM.
 *
 * Dipisah dari `pickPhoto` (yang hidup di komponen klien dan butuh canvas) supaya
 * aturannya bisa diuji di node — dan supaya URUTANNYA tidak diam-diam terbalik
 * lagi. Urutan itu pernah salah: berkas >5 MB ditolak SEBELUM dikompres, padahal
 * kompresi ke WebP 512px menyusutkan foto 8 MB jadi puluhan KB. Yang diukur
 * seharusnya hasil kompresinya, bukan berkas mentah dari kamera.
 */
const MB = Math.round(MAX_PHOTO_BYTES / 1024 / 1024);

export const formatPhotoSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`
    : `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("id-ID")} KB`;

/** Tipe berkas yang boleh DIPILIH. Diuji sebelum kompresi — menolak PDF lebih awal. */
export function photoTypeError(type: string): string | null {
  return ALLOWED_PHOTO_TYPES.includes(type as (typeof ALLOWED_PHOTO_TYPES)[number])
    ? null
    : "Gunakan berkas JPG, PNG, atau WebP.";
}

/**
 * Ukuran HASIL kompresi. Tetap perlu diuji: `compressToWebp` mengembalikan berkas
 * asli apa adanya bila browser tidak bisa mengencode WebP (Safari lama) atau
 * berkasnya tidak bisa didekode — di jalur itu ukurannya memang tidak menyusut.
 */
export function photoSizeError(compressedBytes: number): string | null {
  if (compressedBytes <= MAX_PHOTO_BYTES) return null;
  return (
    `Ukuran foto ${formatPhotoSize(compressedBytes)} setelah dikecilkan, masih melebihi ` +
    `batas ${MB} MB. Pilih foto lain atau perkecil dulu.`
  );
}
