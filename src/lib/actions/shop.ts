"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/auth";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import {
  addShopProductPhoto,
  adminGetShopProduct,
  deleteShopProduct,
  insertShopProduct,
  removeShopProductPhoto,
  setShopProductPublished,
  updateShopProduct,
} from "@/lib/data/shop";
import { MAX_SHOP_PHOTOS } from "@/schemas/shop";
import { parseShopProductForm, toShopProductRow } from "./shop-form";
import { fetchStorePreview, storeBrandOf, type StoreBrand } from "@/lib/store-preview";
import { deletePhoto, photoStorageReady, putShopPhoto } from "@/lib/storage";
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_BYTES, MAX_UPLOAD_BYTES } from "@/lib/storage-limits";
import { fail, fieldErrors, handleUnexpected, ok, type ActionResult } from "@/lib/action-result";

/**
 * Aksi katalog Shop. SEMUANYA `requireSuperadmin()` — tidak ada satu pun aksi tulis
 * yang bisa dipanggil orang tua, termasuk `readStoreLinkAction` yang membuat server
 * menembak jaringan luar.
 *
 * `requireSuperadmin()` melempar Error biasa ("FORBIDDEN"/"UNAUTHENTICATED"), yang
 * jatuh ke `handleUnexpected` dan keluar sebagai INTERNAL_ERROR generik. Itu disengaja:
 * orang tua yang memanggil aksi ini tidak perlu diberi tahu bedanya.
 */

/** Empat tempat berubah setiap kali katalog berubah; drafnya hanya terlihat di /admin. */
async function revalidateShop() {
  revalidatePath("/admin/shop");
  revalidatePath("/shop");
  revalidatePath("/shop/[productId]", "page");
  // Grid di beranda ikut — kalau tidak, produk baru tidak muncul sampai cache basi.
  revalidatePath("/dashboard");
}

export async function createShopProductAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSuperadmin();
    const parsed = parseShopProductForm(formData);
    if (!parsed.success)
      return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

    const row = await insertShopProduct(toShopProductRow(parsed.data));
    await revalidateShop();
    return ok({ id: row.id });
  } catch (err) {
    return handleUnexpected("createShopProductAction", err);
  }
}

export async function updateShopProductAction(
  productId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSuperadmin();
    const parsed = parseShopProductForm(formData);
    if (!parsed.success)
      return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

    const row = await updateShopProduct(productId, toShopProductRow(parsed.data));
    if (!row) return fail("NOT_FOUND", "Produk tidak ditemukan.");

    await revalidateShop();
    return ok({ id: row.id });
  } catch (err) {
    return handleUnexpected("updateShopProductAction", err);
  }
}

export async function deleteShopProductAction(productId: string): Promise<ActionResult> {
  try {
    await requireSuperadmin();
    const row = await deleteShopProduct(productId);
    if (!row) return fail("NOT_FOUND", "Produk tidak ditemukan.");

    // Baris dulu, objek menyusul: gagal hapus objek tidak menggagalkan aksi pengguna.
    await Promise.all(row.photoKeys.map(deletePhoto));

    await revalidateShop();
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("deleteShopProductAction", err);
  }
}

/** Tombol Terbitkan/Jadikan Draf di daftar admin. */
export async function toggleShopPublishedAction(
  productId: string,
  next: boolean,
): Promise<ActionResult> {
  try {
    await requireSuperadmin();
    const row = await setShopProductPublished(productId, next === true);
    if (!row) return fail("NOT_FOUND", "Produk tidak ditemukan.");

    await revalidateShop();
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("toggleShopPublishedAction", err);
  }
}

/**
 * Tambah satu atau beberapa foto produk sekaligus.
 *
 * Batas kepercayaan: berkas datang dari client, jadi tipe dan ukurannya divalidasi
 * di sini — `accept` di browser hanya soal kenyamanan, bukan penjaga. Key foto
 * tidak pernah dibaca dari formData, hanya dari hasil unggah.
 *
 * Semua berkas divalidasi lebih dulu, baru diunggah: satu berkas buruk di tengah
 * pilihan tidak menyisakan sebagian foto sudah tersimpan dan sebagian tidak.
 */
export async function uploadShopPhotoAction(
  productId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSuperadmin();
    if (!photoStorageReady())
      return fail("VALIDATION_ERROR", "Penyimpanan foto belum dikonfigurasi di server.");

    const files = formData
      .getAll("photo")
      .filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0)
      return fail("VALIDATION_ERROR", "Pilih berkas foto terlebih dahulu.", {
        photo: "Pilih berkas foto terlebih dahulu.",
      });

    if (files.length > MAX_SHOP_PHOTOS)
      return fail("VALIDATION_ERROR", "Foto terlalu banyak.", {
        photo: `Maksimal ${MAX_SHOP_PHOTOS} foto per produk.`,
      });

    for (const file of files) {
      if (!ALLOWED_PHOTO_TYPES.includes(file.type as (typeof ALLOWED_PHOTO_TYPES)[number]))
        return fail("VALIDATION_ERROR", "Format foto tidak didukung.", {
          photo: "Gunakan berkas JPG, PNG, atau WebP.",
        });

      if (file.size > MAX_UPLOAD_BYTES)
        return fail("VALIDATION_ERROR", "Ukuran foto terlalu besar.", {
          photo: `Maksimal ${Math.round(MAX_PHOTO_BYTES / 1024 / 1024)} MB per foto.`,
        });
    }

    // Produknya dicek ADA sebelum objek ditulis, supaya tidak ada objek yatim di R2
    // untuk id yang tidak pernah ada.
    const existing = await adminGetShopProduct(productId);
    if (!existing) return fail("NOT_FOUND", "Produk tidak ditemukan.");

    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const key = await putShopPhoto(productId, bytes, file.type);

      const res = await addShopProductPhoto(productId, key);
      // Produk terhapus di tengah proses, atau kuotanya penuh — jangan tinggalkan
      // objek yatim di R2.
      if (!res || "full" in res) {
        await deletePhoto(key);
        if (!res) return fail("NOT_FOUND", "Produk tidak ditemukan.");
        return fail("VALIDATION_ERROR", "Foto sudah penuh.", {
          photo: `Maksimal ${MAX_SHOP_PHOTOS} foto per produk.`,
        });
      }
    }

    await revalidateShop();
    return ok({ id: productId });
  } catch (err) {
    return handleUnexpected("uploadShopPhotoAction", err);
  }
}

/** `photoKey` null berarti hapus semua foto produk ini. */
export async function removeShopPhotoAction(
  productId: string,
  photoKey: string | null = null,
): Promise<ActionResult> {
  try {
    await requireSuperadmin();
    const res = await removeShopProductPhoto(productId, photoKey);
    if (!res) return fail("NOT_FOUND", "Produk tidak ditemukan.");
    await Promise.all(res.removed.map(deletePhoto));

    await revalidateShop();
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("removeShopPhotoAction", err);
  }
}

/**
 * Satu kolom tautan, tokonya ditebak dari host-nya — itu seluruh gunanya aksi ini:
 * form Shop hanya punya satu kolom input, jadi server yang memutuskan kolom tautan
 * toko mana yang terisi (`brand` di hasilnya).
 *
 * Batasnya jujur dan dikembalikan apa adanya, bukan disembunyikan:
 * - TikTok TIDAK dibaca — robots.txt-nya melarang halaman produknya (lihat
 *   store-preview.ts). Yang dikembalikan hanya `brand`, supaya kolom tautannya tetap
 *   terisi di klien dan datanya diisi tangan.
 * - Shopee tidak menyajikan harga, jadi `priceIdr` dari sana selalu null.
 *
 * Rate limit tetap ada walau pemakainya superadmin: aksi ini membuat server menembak
 * jaringan luar atas perintah isian orang. Kuncinya per-user, bukan per-IP — sesinya
 * pasti ada di sini, dan dua admin di satu kantor tidak perlu saling menghabiskan kuota.
 */
export async function readStoreLinkAction(url: string): Promise<
  ActionResult<{
    name: string;
    photo: { dataUrl: string } | null;
    priceIdr: number | null;
    brand: StoreBrand;
  }>
> {
  try {
    const admin = await requireSuperadmin();

    // Divalidasi sebelum menyentuh rate limit: tautan yang jelas salah bentuk tidak
    // menembak jaringan, jadi tidak ada alasan ia menghabiskan kuota orangnya.
    if (typeof url !== "string" || url.length > 500)
      return fail("VALIDATION_ERROR", "Tautan tidak valid.");

    const brand = storeBrandOf(url);
    if (!brand)
      return fail(
        "VALIDATION_ERROR",
        "Tautan itu bukan dari Shopee, Tokopedia, atau TikTok. Periksa lagi tautannya.",
      );

    if (brand === "tiktok") return ok({ name: "", photo: null, priceIdr: null, brand });

    const limit = checkRateLimit(`shop-store-read:${admin.id}`, 30);
    if (!limit.allowed)
      return fail(
        "RATE_LIMITED",
        `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(limit.retryAfterSec / 60)} menit.`,
      );

    const preview = await fetchStorePreview(url);
    if (!preview)
      return fail(
        "VALIDATION_ERROR",
        "Tidak bisa membaca tautan itu. Pastikan tautannya halaman produk, atau isi datanya manual.",
      );

    // Data URL, bukan Uint8Array: yang terakhir tidak menyeberang batas server action
    // utuh, dan bentuk ini bisa langsung dijadikan File di klien lewat
    // fetch(dataUrl).blob() — jalur unggah yang sama dengan foto pilihan tangan, jadi
    // fotonya berakhir di R2 kita, bukan di-hotlink dari CDN toko.
    return ok({
      name: preview.name,
      photo: preview.image
        ? {
            dataUrl: `data:${preview.image.type};base64,${Buffer.from(preview.image.bytes).toString("base64")}`,
          }
        : null,
      priceIdr: preview.priceIdr,
      brand,
    });
  } catch (err) {
    return handleUnexpected("readStoreLinkAction", err);
  }
}
