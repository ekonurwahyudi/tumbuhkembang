"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/auth";
import {
  deleteBlogPost,
  insertBlogPost,
  setBlogPostPublished,
  updateBlogPost,
} from "@/lib/data/blog";
import { parseBlogPostForm, toBlogPostRow } from "./blog-form";
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

    await revalidateBlog();
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("deleteBlogPostAction", err);
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
