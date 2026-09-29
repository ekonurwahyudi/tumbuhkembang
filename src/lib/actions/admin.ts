"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { fail, fieldErrors, handleUnexpected, ok, type ActionResult } from "@/lib/action-result";
import { requireSuperadmin } from "@/lib/auth";
import {
  adminDeleteChild,
  adminDeleteParent,
  adminUpdateChild,
  adminUpdateParent,
} from "@/lib/data/admin";
import { deleteChildPhoto, deletePhoto } from "@/lib/storage";
import { adminNewParentSchema, profileSchema } from "@/schemas/account";
import { parseChildForm, toChildRow } from "./child-form";

/**
 * Action SUPERADMIN. Bedanya dengan action lain hanya satu: penjaganya
 * `requireSuperadmin()` (yang membaca peran dari DB), dan datanya tidak ber-scope
 * pemilik. Tidak ada action di sini yang bisa mengubah kolom `role` — promosi admin
 * hanya lewat `scripts/grant-admin.ts`, jadi tidak ada jalur eskalasi hak akses.
 */

const EMAIL_TAKEN = { email: "Email sudah dipakai akun lain" };

/**
 * Buat akun orang tua dari sisi admin.
 *
 * Kata sandi awal wajib diisi admin dan lewat `passwordSchema` yang sama dengan
 * registrasi — admin tidak boleh bisa membuat akun dengan kata sandi lemah. Perannya
 * selalu USER: naikkan lewat scripts/grant-admin.ts, tidak dari sini.
 */
export async function adminCreateParentAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireSuperadmin();
    const parsed = adminNewParentSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone") ?? "",
      password: formData.get("password"),
    });
    if (!parsed.success)
      return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

    const { name, email, phone, password } = parsed.data;

    await db.insert(users).values({
      name,
      email,
      phone: phone === "" || phone == null ? null : phone,
      passwordHash: await hash(password, 12),
    });

    revalidatePath("/admin");
    revalidatePath("/admin/parents");
    return ok(undefined);
  } catch (err) {
    // Unique index email — satu-satunya bentrok yang wajar di sini.
    if (err && typeof err === "object" && "code" in err && err.code === "23505")
      return fail("EMAIL_TAKEN", "Email sudah dipakai akun lain", EMAIL_TAKEN);
    return handleUnexpected("adminCreateParentAction", err);
  }
}

export async function adminUpdateParentAction(
  userId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireSuperadmin();
    const parsed = profileSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone") ?? "",
    });
    if (!parsed.success)
      return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

    const { name, email, phone } = parsed.data;

    // Email unik dikecualikan untuk baris yang sedang diubah.
    const [conflict] = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.email}) = ${email} and ${users.id} <> ${userId}`)
      .limit(1);
    if (conflict) return fail("EMAIL_TAKEN", "Email sudah dipakai akun lain", EMAIL_TAKEN);

    const row = await adminUpdateParent(userId, {
      name,
      email,
      phone: phone === "" || phone == null ? null : phone,
    });
    if (!row) return fail("NOT_FOUND", "Akun tidak ditemukan.");

    revalidatePath("/admin");
    revalidatePath("/admin/parents");
    return ok(undefined);
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505")
      return fail("EMAIL_TAKEN", "Email sudah dipakai akun lain", EMAIL_TAKEN);
    return handleUnexpected("adminUpdateParentAction", err);
  }
}

export async function adminDeleteParentAction(userId: string): Promise<ActionResult> {
  try {
    const admin = await requireSuperadmin();
    // Satu penjaga supaya admin tidak bisa mengunci dirinya sendiri keluar dari /admin.
    if (userId === admin.id)
      return fail("SELF_DELETE", "Tidak bisa menghapus akun sendiri dari halaman ini.");

    const row = await adminDeleteParent(userId);
    if (!row) return fail("NOT_FOUND", "Akun tidak ditemukan.");

    // Baris (dan seluruh datanya, lewat cascade) sudah hilang; objek foto menyusul.
    // Gagal menghapus objek tidak dijadikan error — yang diminta sudah terjadi.
    if (row.photoKey) await deletePhoto(row.photoKey);

    revalidatePath("/admin");
    revalidatePath("/admin/parents");
    revalidatePath("/admin/children");
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("adminDeleteParentAction", err);
  }
}

export async function adminUpdateChildAction(
  childId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSuperadmin();
    const parsed = parseChildForm(formData);
    if (!parsed.success)
      return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

    const row = await adminUpdateChild(childId, toChildRow(parsed.data));
    if (!row) return fail("NOT_FOUND", "Data anak tidak ditemukan.");

    revalidatePath("/admin/children");
    // Halaman pemiliknya juga ikut basi setelah admin mengubah datanya.
    revalidatePath(`/children/${childId}`);
    revalidatePath("/dashboard");
    return ok({ id: row.id });
  } catch (err) {
    return handleUnexpected("adminUpdateChildAction", err);
  }
}

export async function adminDeleteChildAction(childId: string): Promise<ActionResult> {
  try {
    await requireSuperadmin();
    const row = await adminDeleteChild(childId);
    if (!row) return fail("NOT_FOUND", "Data anak tidak ditemukan.");
    if (row.photoKey) await deleteChildPhoto(row.photoKey);

    revalidatePath("/admin");
    revalidatePath("/admin/children");
    revalidatePath("/admin/parents");
    revalidatePath("/dashboard");
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("adminDeleteChildAction", err);
  }
}
