"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/auth";
import {
  adminGetBlogPost,
  deleteBlogPost,
  insertBlogPost,
  setBlogCover,
  setBlogPostPublished,
  updateBlogPost,
} from "@/lib/data/blog";
import { parseBlogPostForm, toBlogPostRow } from "./blog-form";
import { fetchImageFromUrl } from "@/lib/fetch-image";
import { deletePhoto, photoStorageReady, putBlogCover } from "@/lib/storage";
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_BYTES, MAX_UPLOAD_BYTES } from "@/lib/storage-limits";
import { fail, fieldErrors, handleUnexpected, ok, type ActionResult } from "@/lib/action-result";

/**
 * Aksi blog. SEMUANYA `requireSuperadmin()` — orang tua hanya membaca.
 *
 * `requireSuperadmin()` melempar Error biasa ("FORBIDDEN"/"UNAUTHENTICATED"), yang
 * jatuh ke `handleUnexpected` dan keluar sebagai INTERNAL_ERROR generik. Disengaja:
 * orang tua yang memanggil aksi ini tidak perlu diberi tahu bedanya.
 *
 * HTML artikel dibersihkan di `blogPostSchema`, bukan di sini — satu pintu masuk,
 * jadi tidak ada aksi yang bisa lupa memanggilnya.
 */
async function revalidateBlog() {
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
}

export async function createBlogPostAction(
  formData: FormData,
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    await requireSuperadmin();
    const parsed = parseBlogPostForm(formData);
    if (!parsed.success)
      return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

    const row = await insertBlogPost(toBlogPostRow(parsed.data));
    await revalidateBlog();
    return ok({ id: row.id, slug: row.slug });
  } catch (err) {
    return handleUnexpected("createBlogPostAction", err);
  }
}

export async function updateBlogPostAction(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    await requireSuperadmin();
    const parsed = parseBlogPostForm(formData);
    if (!parsed.success)
      return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

    const row = await updateBlogPost(id, toBlogPostRow(parsed.data));
    if (!row) return fail("NOT_FOUND", "Artikel tidak ditemukan.");

    await revalidateBlog();
    return ok({ id: row.id, slug: row.slug });
  } catch (err) {
    return handleUnexpected("updateBlogPostAction", err);
  }
}

export async function deleteBlogPostAction(id: string): Promise<ActionResult> {
  try {
    await requireSuperadmin();
    const row = await deleteBlogPost(id);
    if (!row) return fail("NOT_FOUND", "Artikel tidak ditemukan.");

    // Baris dulu, objek menyusul: gagal hapus objek tidak menggagalkan aksi admin.
    if (row.coverKey) await deletePhoto(row.coverKey);

    await revalidateBlog();
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("deleteBlogPostAction", err);
  }
}

/**
 * Unggah sampul artikel. Satu berkas, bukan beberapa: artikel punya tepat satu
 * sampul, dan mengunggah yang baru menggantikan yang lama.
 *
 * Batas kepercayaan: berkas datang dari klien, jadi tipe dan ukurannya divalidasi
 * di sini — `accept` di browser hanya soal kenyamanan, bukan penjaga. Key sampul
 * tidak pernah dibaca dari formData, hanya dari hasil unggah.
 */
export async function uploadBlogCoverAction(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSuperadmin();
    if (!photoStorageReady())
      return fail("VALIDATION_ERROR", "Penyimpanan foto belum dikonfigurasi di server.");

    const file = formData.get("photo");
    if (!(file instanceof File) || file.size === 0)
      return fail("VALIDATION_ERROR", "Pilih berkas gambar terlebih dahulu.", {
        photo: "Pilih berkas gambar terlebih dahulu.",
      });

    if (!ALLOWED_PHOTO_TYPES.includes(file.type as (typeof ALLOWED_PHOTO_TYPES)[number]))
      return fail("VALIDATION_ERROR", "Format gambar tidak didukung.", {
        photo: "Gunakan berkas JPG, PNG, atau WebP.",
      });

    if (file.size > MAX_UPLOAD_BYTES)
      return fail("VALIDATION_ERROR", "Ukuran gambar terlalu besar.", {
        photo: `Maksimal ${Math.round(MAX_PHOTO_BYTES / 1024 / 1024)} MB.`,
      });

    // Artikelnya dicek ADA sebelum objek ditulis, supaya tidak ada objek yatim di
    // R2 untuk id yang tidak pernah ada.
    const existing = await adminGetBlogPost(id);
    if (!existing) return fail("NOT_FOUND", "Artikel tidak ditemukan.");

    const bytes = new Uint8Array(await file.arrayBuffer());
    const key = await putBlogCover(id, bytes, file.type);

    const res = await setBlogCover(id, key);
    if (!res) {
      // Artikel terhapus di tengah proses — jangan tinggalkan objek yatim.
      await deletePhoto(key);
      return fail("NOT_FOUND", "Artikel tidak ditemukan.");
    }
    // Sampul lama dibuang SETELAH yang baru tercatat: urutan sebaliknya membuat
    // artikel kehilangan sampul bila penulisan barisnya gagal.
    if (res.previous) await deletePhoto(res.previous);

    await revalidateBlog();
    return ok({ id });
  } catch (err) {
    return handleUnexpected("uploadBlogCoverAction", err);
  }
}

/**
 * Pasang sampul dari URL gambar, bukan dari berkas yang diunggah.
 *
 * Bytes-nya tetap disimpan di R2 kita sendiri, BUKAN di-hotlink: menautkan gambar
 * dari domain lain berarti halaman ini membocorkan siapa yang membacanya ke pihak
 * ketiga, dan sampulnya ikut mati kapan pun sumbernya memindahkan berkasnya.
 * (Alasan yang sama dengan logo bank di schemas/registry.ts.)
 *
 * Penjagaan SSRF-nya ada di `fetchImageFromUrl` — jangan panggil `fetch` di sini.
 */
export async function importBlogCoverAction(
  id: string,
  url: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSuperadmin();
    if (!photoStorageReady())
      return fail("VALIDATION_ERROR", "Penyimpanan foto belum dikonfigurasi di server.");

    if (typeof url !== "string" || url.length > 1000)
      return fail("VALIDATION_ERROR", "Tautan tidak valid.");

    const existing = await adminGetBlogPost(id);
    if (!existing) return fail("NOT_FOUND", "Artikel tidak ditemukan.");

    const fetched = await fetchImageFromUrl(url);
    if (!fetched.ok) return fail("VALIDATION_ERROR", fetched.reason, { cover: fetched.reason });

    const key = await putBlogCover(id, fetched.image.bytes, fetched.image.contentType);
    const res = await setBlogCover(id, key);
    if (!res) {
      await deletePhoto(key);
      return fail("NOT_FOUND", "Artikel tidak ditemukan.");
    }
    if (res.previous) await deletePhoto(res.previous);

    await revalidateBlog();
    return ok({ id });
  } catch (err) {
    return handleUnexpected("importBlogCoverAction", err);
  }
}

export async function removeBlogCoverAction(id: string): Promise<ActionResult> {
  try {
    await requireSuperadmin();
    const res = await setBlogCover(id, null);
    if (!res) return fail("NOT_FOUND", "Artikel tidak ditemukan.");
    if (res.previous) await deletePhoto(res.previous);

    await revalidateBlog();
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("removeBlogCoverAction", err);
  }
}

/** Tombol Terbitkan/Jadikan Draf di daftar admin. */
export async function toggleBlogPublishedAction(
  id: string,
  next: boolean,
): Promise<ActionResult> {
  try {
    await requireSuperadmin();
    const row = await setBlogPostPublished(id, next === true);
    if (!row) return fail("NOT_FOUND", "Artikel tidak ditemukan.");

    await revalidateBlog();
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("toggleBlogPublishedAction", err);
  }
}
