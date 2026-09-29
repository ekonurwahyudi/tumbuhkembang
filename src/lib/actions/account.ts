"use server";

import { compare, hash } from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import { fail, fieldErrors, handleUnexpected, ok, type ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/auth";
import { deletePhoto, photoStorageReady, putUserPhoto } from "@/lib/storage";
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_BYTES, MAX_UPLOAD_BYTES } from "@/lib/storage-limits";
import { passwordChangeSchema, profileSchema } from "@/schemas/account";

const BCRYPT_ROUNDS = 12;

function refreshLayout() {
  revalidatePath("/settings");
  // Header dashboard memakai name dari session — revalidate layout agar ikut.
  revalidatePath("/(dashboard)", "layout");
}

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success)
    return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

  const { name, email, phone } = parsed.data;

  try {
    // Email unik dikecualikan untuk baris sendiri.
    const [conflict] = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.email}) = ${email} and ${users.id} <> ${user.id}`)
      .limit(1);
    if (conflict)
      return fail("EMAIL_TAKEN", "Email sudah dipakai akun lain", {
        email: "Email sudah dipakai akun lain",
      });

    await db
      .update(users)
      .set({ name, email, phone: phone === "" ? null : phone, updatedAt: new Date() })
      .where(eq(users.id, user.id));
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505")
      return fail("EMAIL_TAKEN", "Email sudah dipakai akun lain", {
        email: "Email sudah dipakai akun lain",
      });
    return handleUnexpected("updateProfileAction", err);
  }

  refreshLayout();
  return ok(undefined);
}

export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword") ?? undefined,
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success)
    return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

  try {
    const [row] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    if (!row) return fail("NOT_FOUND", "Akun tidak ditemukan");

    // Akun password: wajib kata sandi lama. Akun Google (hash null): set pertama kali.
    if (row.passwordHash) {
      const current = String(formData.get("currentPassword") ?? "");
      if (!current)
        return fail("CURRENT_REQUIRED", "Kata sandi lama wajib diisi", {
          currentPassword: "Kata sandi lama wajib diisi",
        });
      if (!(await compare(current, row.passwordHash)))
        return fail("WRONG_PASSWORD", "Kata sandi lama salah", {
          currentPassword: "Kata sandi lama salah",
        });
    }

    await db
      .update(users)
      .set({ passwordHash: await hash(parsed.data.newPassword, BCRYPT_ROUNDS), updatedAt: new Date() })
      .where(eq(users.id, user.id));
  } catch (err) {
    return handleUnexpected("changePasswordAction", err);
  }

  return ok(undefined);
}

export async function uploadUserPhotoAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireUser();
    if (!photoStorageReady())
      return fail("VALIDATION_ERROR", "Penyimpanan foto belum dikonfigurasi di server.");

    const file = formData.get("photo");
    if (!(file instanceof File) || file.size === 0)
      return fail("VALIDATION_ERROR", "Pilih berkas foto terlebih dahulu.");

    if (!ALLOWED_PHOTO_TYPES.includes(file.type as (typeof ALLOWED_PHOTO_TYPES)[number]))
      return fail("VALIDATION_ERROR", "Gunakan berkas JPG, PNG, atau WebP.");

    if (file.size > MAX_UPLOAD_BYTES)
      return fail("VALIDATION_ERROR", `Maksimal ${Math.round(MAX_PHOTO_BYTES / 1024 / 1024)} MB.`);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const key = await putUserPhoto(user.id, bytes, file.type);

    const [row] = await db
      .select({ photoKey: users.photoKey })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    const previousKey = row?.photoKey;

    await db
      .update(users)
      .set({ photoKey: key, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    if (previousKey) await deletePhoto(previousKey);

    refreshLayout();
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("uploadUserPhotoAction", err);
  }
}

export async function removeUserPhotoAction(): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const [row] = await db
      .select({ photoKey: users.photoKey })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (row?.photoKey) {
      await db
        .update(users)
        .set({ photoKey: null, updatedAt: new Date() })
        .where(eq(users.id, user.id));
      await deletePhoto(row.photoKey);
    }

    refreshLayout();
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("removeUserPhotoAction", err);
  }
}
