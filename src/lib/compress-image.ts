import {
  PHOTO_MAX_DIMENSION,
  PHOTO_OUTPUT_TYPE,
  PHOTO_WEBP_QUALITY,
} from "./storage-limits";

/**
 * Perkecil dan ubah foto ke WebP di browser sebelum diunggah.
 *
 * Dilakukan di client, bukan server: berkas besar tidak perlu dikirim utuh
 * lewat jaringan hanya untuk dibuang setelah sampai. Canvas sudah ada di
 * platform, jadi tidak perlu dependency pengolah gambar.
 */

/** Skala agar sisi terpanjang tidak melebihi `max`; gambar kecil tidak diperbesar. */
export function fitWithin(
  width: number,
  height: number,
  max: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const ratio = max / longest;
  // Minimal 1px: pembulatan ke bawah pada gambar sangat panjang bisa jadi 0,
  // dan canvas berukuran 0 melempar error.
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  // createImageBitmap menghormati orientasi EXIF; tanpa ini foto dari kamera
  // ponsel bisa tersimpan miring 90°.
  return createImageBitmap(file, { imageOrientation: "from-image" });
}

/**
 * Kembalikan berkas WebP yang sudah diperkecil.
 *
 * Bila browser tidak bisa mengencode WebP (Safari lama), berkas asli
 * dikembalikan apa adanya — unggahan tetap jalan, hanya tidak sehemat itu.
 */
export async function compressToWebp(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await loadBitmap(file);
  } catch {
    return file; // Bukan gambar yang bisa didekode browser; server yang menolak.
  }

  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, PHOTO_MAX_DIMENSION);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, PHOTO_OUTPUT_TYPE, PHOTO_WEBP_QUALITY),
    );

    // toBlob memberi PNG bila tipe yang diminta tidak didukung; jangan
    // menamainya .webp kalau isinya bukan WebP.
    if (!blob || blob.type !== PHOTO_OUTPUT_TYPE) return file;

    const name = file.name.replace(/\.[^.]+$/, "") || "foto";
    return new File([blob], `${name}.webp`, { type: PHOTO_OUTPUT_TYPE });
  } finally {
    bitmap.close();
  }
}
