"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  addRegistryItemPhoto,
  claimItem,
  deleteRegistryItem,
  ensureRegistryToken,
  findClaimByToken,
  findPublicRegistry,
  getRegistryItem,
  getRegistrySettings,
  insertRegistryItem,
  removeRegistryItemPhoto,
  setRegistryPublic,
  MAX_ITEM_PHOTOS,
  updateClaimTracking,
  updateRegistryItem,
} from "@/lib/data/registry";
import {
  parseClaimForm,
  parseRegistryItemForm,
  toClaimValues,
  toRegistryItemRow,
} from "./registry-form";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { registryTrackingSchema } from "@/schemas/registry";
import { deletePhoto, photoStorageReady, putRegistryPhoto } from "@/lib/storage";
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_BYTES, MAX_UPLOAD_BYTES } from "@/lib/storage-limits";
import { fail, fieldErrors, handleUnexpected, ok, type ActionResult } from "@/lib/action-result";

/** Halaman privat + publik + ubin dashboard ikut berubah setiap kali daftar berubah. */
async function revalidateRegistry(userId: string) {
  revalidatePath("/registry");
  revalidatePath("/dashboard");
  // Halaman detail juga, kalau tidak rinciannya masih versi lama setelah diubah.
  revalidatePath("/registry/[itemId]", "page");
  const token = (await getRegistrySettings(userId))?.token;
  if (token) revalidatePath(`/kado/${token}`);
  revalidatePath("/kado/[token]/barang/[itemId]", "page");
}

export async function createRegistryItemAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = parseRegistryItemForm(formData);
    if (!parsed.success)
      return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

    const row = await insertRegistryItem(user.id, toRegistryItemRow(parsed.data));
    await revalidateRegistry(user.id);
    return ok({ id: row.id });
  } catch (err) {
    return handleUnexpected("createRegistryItemAction", err);
  }
}

export async function updateRegistryItemAction(
  itemId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = parseRegistryItemForm(formData);
    if (!parsed.success)
      return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

    const row = await updateRegistryItem(user.id, itemId, toRegistryItemRow(parsed.data));
    if (!row) return fail("NOT_FOUND", "Barang tidak ditemukan.");

    await revalidateRegistry(user.id);
    return ok({ id: row.id });
  } catch (err) {
    return handleUnexpected("updateRegistryItemAction", err);
  }
}

export async function deleteRegistryItemAction(itemId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const row = await deleteRegistryItem(user.id, itemId);
    if (!row) return fail("NOT_FOUND", "Barang tidak ditemukan.");

    // Baris dulu, objek menyusul: gagal hapus objek tidak menggagalkan aksi pengguna.
    await Promise.all(row.photoKeys.map(deletePhoto));

    await revalidateRegistry(user.id);
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("deleteRegistryItemAction", err);
  }
}

/**
 * Tambah satu atau beberapa foto barang sekaligus.
 *
 * Batas kepercayaan: berkas datang dari client, jadi tipe dan ukurannya divalidasi
 * di sini — `accept` di browser hanya soal kenyamanan, bukan penjaga. Key foto
 * tidak pernah dibaca dari formData, hanya dari hasil unggah.
 *
 * Semua berkas divalidasi lebih dulu, baru diunggah: satu berkas buruk di tengah
 * pilihan tidak menyisakan sebagian foto sudah tersimpan dan sebagian tidak.
 */
export async function uploadRegistryPhotoAction(
  itemId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    if (!photoStorageReady())
      return fail("VALIDATION_ERROR", "Penyimpanan foto belum dikonfigurasi di server.");

    const files = formData.getAll("photo").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0)
      return fail("VALIDATION_ERROR", "Pilih berkas foto terlebih dahulu.", {
        photo: "Pilih berkas foto terlebih dahulu.",
      });

    if (files.length > MAX_ITEM_PHOTOS)
      return fail("VALIDATION_ERROR", "Foto terlalu banyak.", {
        photo: `Maksimal ${MAX_ITEM_PHOTOS} foto per barang.`,
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

    // Kepemilikan dicek sebelum objek ditulis, supaya tidak ada objek tertulis
    // untuk barang milik orang lain.
    const existing = await getRegistryItem(user.id, itemId);
    if (!existing) return fail("NOT_FOUND", "Barang tidak ditemukan.");

    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const key = await putRegistryPhoto(itemId, bytes, file.type);

      const res = await addRegistryItemPhoto(user.id, itemId, key);
      // Barang terhapus di tengah proses, atau kuotanya penuh — jangan
      // tinggalkan objek yatim di R2.
      if (!res || "full" in res) {
        await deletePhoto(key);
        if (!res) return fail("NOT_FOUND", "Barang tidak ditemukan.");
        return fail("VALIDATION_ERROR", "Foto sudah penuh.", {
          photo: `Maksimal ${MAX_ITEM_PHOTOS} foto per barang.`,
        });
      }
    }

    await revalidateRegistry(user.id);
    return ok({ id: itemId });
  } catch (err) {
    return handleUnexpected("uploadRegistryPhotoAction", err);
  }
}

/** `photoKey` null berarti hapus semua foto barang ini. */
export async function removeRegistryPhotoAction(
  itemId: string,
  photoKey: string | null = null,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const res = await removeRegistryItemPhoto(user.id, itemId, photoKey);
    if (!res) return fail("NOT_FOUND", "Barang tidak ditemukan.");
    await Promise.all(res.removed.map(deletePhoto));

    await revalidateRegistry(user.id);
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("removeRegistryPhotoAction", err);
  }
}

/** Menyalakan/mematikan tautan publik. Token dibuat sekali lalu dipakai ulang. */
export async function shareRegistryAction(
  on: boolean,
): Promise<ActionResult<{ token: string | null; isPublic: boolean }>> {
  try {
    const user = await requireUser();
    const token = on
      ? await ensureRegistryToken(user.id)
      : (await getRegistrySettings(user.id))?.token;
    const row = await setRegistryPublic(user.id, on);
    if (!row) return fail("NOT_FOUND", "Akun tidak ditemukan.");

    revalidatePath("/registry");
    if (token) revalidatePath(`/kado/${token}`);
    return ok({ token: token ?? null, isPublic: row.isPublic });
  } catch (err) {
    return handleUnexpected("shareRegistryAction", err);
  }
}

/** Kunci rate limit dari IP proxy. Dipakai dua action tanpa sesi di bawah. */
async function clientKey(scope: string) {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  return `${scope}:${ip}`;
}

/**
 * TANPA `requireUser()` — dan itu memang tujuannya: yang mengklaim kado adalah
 * teman atau keluarga yang tidak punya akun di sini. Penjaganya tiga lapis, bukan
 * sesi: rate limit per IP, batas panjang di `registryClaimSchema`, dan pemeriksaan
 * kuota transaksional di `claimItem` (token registry diuji di dalam query itu).
 *
 * `claimToken` yang dikembalikan adalah satu-satunya kunci pengklaim untuk kembali
 * mengisi nomor resinya, jadi halaman pemanggil wajib menampilkannya.
 */
export async function claimItemAction(
  token: string,
  itemId: string,
  formData: FormData,
): Promise<ActionResult<{ claimToken: string }>> {
  try {
    const limit = checkRateLimit(await clientKey("registry-claim"));
    if (!limit.allowed)
      return fail(
        "RATE_LIMITED",
        `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(limit.retryAfterSec / 60)} menit.`,
      );

    const parsed = parseClaimForm(formData);
    if (!parsed.success)
      return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

    const res = await claimItem(token, itemId, toClaimValues(parsed.data));
    if (!res) return fail("NOT_FOUND", "Barang tidak tersedia lagi.");
    if ("over" in res)
      return fail(
        "VALIDATION_ERROR",
        res.over > 0
          ? `Sisa yang dibutuhkan hanya ${res.over}.`
          : "Barang ini sudah dihadiahi orang lain.",
        { qty: res.over > 0 ? `Maksimal ${res.over}` : "Sudah dihadiahi" },
      );

    revalidatePath(`/kado/${token}`);
    revalidatePath("/kado/[token]/barang/[itemId]", "page");
    revalidatePath("/registry");
    revalidatePath("/registry/[itemId]", "page");
    revalidatePath("/dashboard");
    return ok({ claimToken: res.claim.claimToken });
  } catch (err) {
    return handleUnexpected("claimItemAction", err);
  }
}

/**
 * Juga tanpa sesi: pengklaim kembali lewat tautan pribadinya untuk menambahkan
 * nomor resi setelah barangnya dikirim. `claimToken` di URL adalah otorisasinya —
 * hanya orang yang menyimpan tautan itu yang bisa mengubah klaim tersebut.
 */
export async function updateClaimTrackingAction(
  claimToken: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const limit = checkRateLimit(await clientKey("registry-tracking"));
    if (!limit.allowed)
      return fail(
        "RATE_LIMITED",
        `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(limit.retryAfterSec / 60)} menit.`,
      );

    const parsed = registryTrackingSchema.safeParse({
      trackingNumber: formData.get("trackingNumber"),
    });
    if (!parsed.success)
      return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

    const row = await updateClaimTracking(claimToken, parsed.data.trackingNumber);
    if (!row) return fail("NOT_FOUND", "Klaim tidak ditemukan.");

    const ctx = await findClaimByToken(claimToken);
    if (ctx?.registryToken) revalidatePath(`/kado/${ctx.registryToken}`);
    revalidatePath("/registry");
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("updateClaimTrackingAction", err);
  }
}

/** Dipakai halaman publik untuk memastikan token masih hidup sebelum merender. */
export async function getPublicRegistry(token: string) {
  return findPublicRegistry(token);
}
