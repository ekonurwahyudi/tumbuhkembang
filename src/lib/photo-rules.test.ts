import { describe, expect, it } from "vitest";
import { formatPhotoSize, photoSizeError, photoTypeError } from "./photo-rules";
import { MAX_PHOTO_BYTES } from "./storage-limits";

describe("photoTypeError", () => {
  it("menerima tipe gambar yang didukung", () => {
    for (const t of ["image/jpeg", "image/png", "image/webp"])
      expect(photoTypeError(t)).toBeNull();
  });

  it("menolak yang lain", () => {
    expect(photoTypeError("application/pdf")).toBeTruthy();
    expect(photoTypeError("image/heic")).toBeTruthy();
    expect(photoTypeError("")).toBeTruthy();
  });
});

describe("photoSizeError", () => {
  /**
   * Inti aturannya: yang diukur adalah HASIL kompresi, bukan berkas mentah.
   * Foto 8 MB dari kamera HP menyusut jadi puluhan KB setelah diubah ke WebP
   * 512px — menolaknya di muka berarti menyuruh orang tua mengerjakan sendiri
   * apa yang sudah dilakukan aplikasi ini.
   */
  it("menerima hasil kompresi yang kecil, berapa pun ukuran aslinya", () => {
    expect(photoSizeError(40 * 1024)).toBeNull();
    expect(photoSizeError(900 * 1024)).toBeNull();
  });

  it("menerima tepat di batas", () => {
    expect(photoSizeError(MAX_PHOTO_BYTES)).toBeNull();
  });

  it("menolak hasil kompresi yang masih di atas batas", () => {
    // Terjadi saat browser tidak bisa mengencode WebP: berkas asli diteruskan.
    const err = photoSizeError(MAX_PHOTO_BYTES + 1);
    expect(err).toBeTruthy();
    // Pesannya harus menyebut "setelah dikecilkan" — kalau tidak, orang mengira
    // aplikasinya belum mencoba mengompres.
    expect(err).toContain("setelah dikecilkan");
  });
});

describe("formatPhotoSize", () => {
  it("memakai MB di atas satu megabita, KB di bawahnya", () => {
    expect(formatPhotoSize(2.5 * 1024 * 1024)).toBe("2,5 MB");
    expect(formatPhotoSize(300 * 1024)).toBe("300 KB");
  });

  it("berkas sangat kecil tidak tampil sebagai 0 KB", () => {
    expect(formatPhotoSize(120)).toBe("1 KB");
  });
});
