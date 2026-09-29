"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  deleteChild,
  getChild,
  insertChild,
  setChildPhotoKey,
  updateChild,
  type NewChild,
} from "@/lib/data/children";
import { todayYMD } from "@/lib/growth/age";
import { deleteChildPhoto, photoStorageReady, putChildPhoto } from "@/lib/storage";
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_BYTES, MAX_UPLOAD_BYTES } from "@/lib/storage-limits";
import { insertMeasurement, toMeasurementValues } from "@/lib/data/measurements";
import { childSchema } from "@/schemas/child";
import { measurementSchema } from "@/schemas/measurement";
import { fail, fieldErrors, handleUnexpected, ok, type ActionResult } from "@/lib/action-result";

/** Angka opsional dari FormData: "" -> null, selain itu Number. */
function optionalInt(v: FormDataEntryValue | null): number | null | undefined {
  if (v === null) return undefined;
  const s = String(v).trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : Number.NaN; // NaN akan ditolak Zod
}

function parseChildForm(formData: FormData) {
  return childSchema.safeParse({
    name: formData.get("name"),
    sex: formData.get("sex"),
    dateOfBirth: formData.get("dateOfBirth"),
    birthType: formData.get("birthType"),
    gestationalAgeWeeks: optionalInt(formData.get("gestationalAgeWeeks")),
    gestationalAgeDays: optionalInt(formData.get("gestationalAgeDays")),
    birthWeightGrams: optionalInt(formData.get("birthWeightGrams")),
  });
}

const toRow = (d: ReturnType<typeof childSchema.parse>): NewChild => ({
  name: d.name,
  sex: d.sex,
  dateOfBirth: d.dateOfBirth,
  birthType: d.birthType,
  gestationalAgeWeeks: d.gestationalAgeWeeks ?? null,
  gestationalAgeDays: d.gestationalAgeDays ?? null,
  birthWeightGrams: d.birthWeightGrams ?? null,
});

/**
 * Pengukuran awal yang ikut form tambah anak. Seluruhnya opsional: bila ketiganya
 * kosong tidak ada catatan yang dibuat. Divalidasi SEBELUM anak disimpan supaya
 * angka yang salah tidak meninggalkan anak tanpa pengukuran.
 */
function parseInitialMeasurement(formData: FormData) {
  const raw = {
    measuredAt: todayYMD(),
    weightKg: formData.get("weightKg"),
    lengthHeightCm: formData.get("lengthHeightCm"),
    headCircumferenceCm: formData.get("headCircumferenceCm"),
    notes: "Pengukuran awal saat profil anak dibuat",
  };
  const filled = [raw.weightKg, raw.lengthHeightCm, raw.headCircumferenceCm].some(
    (v) => String(v ?? "").trim() !== "",
  );
  return filled ? measurementSchema.safeParse(raw) : null;
}

export async function createChildAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = parseChildForm(formData);
    if (!parsed.success)
      return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

    const measurement = parseInitialMeasurement(formData);
    if (measurement && !measurement.success)
      return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(measurement.error.issues));

    const row = await insertChild(user.id, toRow(parsed.data));
    if (measurement?.success)
      await insertMeasurement(row.id, toMeasurementValues(measurement.data));

    revalidatePath("/dashboard");
    revalidatePath("/children");
    return ok({ id: row.id });
  } catch (err) {
    return handleUnexpected("createChildAction", err);
  }
}

export async function updateChildAction(
  childId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = parseChildForm(formData);
    if (!parsed.success)
      return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

    const row = await updateChild(user.id, childId, toRow(parsed.data));
    if (!row) return fail("NOT_FOUND", "Data anak tidak ditemukan.");

    revalidatePath("/dashboard");
    revalidatePath("/children");
    revalidatePath(`/children/${childId}`);
    return ok({ id: row.id });
  } catch (err) {
    return handleUnexpected("updateChildAction", err);
  }
}

export async function deleteChildAction(childId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const existing = await getChild(user.id, childId);
    const row = await deleteChild(user.id, childId);
    if (!row) return fail("NOT_FOUND", "Data anak tidak ditemukan.");

    // Baris sudah hilang; objeknya menyusul. Gagal hapus objek tidak
    // mengembalikan error — barisnya sudah terhapus dan itu yang diminta.
    if (existing?.photoKey) await deleteChildPhoto(existing.photoKey);

    revalidatePath("/dashboard");
    revalidatePath("/children");
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("deleteChildAction", err);
  }
}

/**
 * Unggah/ganti foto anak.
 *
 * Batas kepercayaan: berkas datang dari client, jadi tipe dan ukurannya
 * divalidasi di sini — `accept` dan pengecekan di browser hanya soal
 * kenyamanan, bukan penjaga.
 */
export async function uploadChildPhotoAction(
  childId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    if (!photoStorageReady())
      return fail("VALIDATION_ERROR", "Penyimpanan foto belum dikonfigurasi di server.");

    const file = formData.get("photo");
    if (!(file instanceof File) || file.size === 0)
      return fail("VALIDATION_ERROR", "Pilih berkas foto terlebih dahulu.", {
        photo: "Pilih berkas foto terlebih dahulu.",
      });

    if (!ALLOWED_PHOTO_TYPES.includes(file.type as (typeof ALLOWED_PHOTO_TYPES)[number]))
      return fail("VALIDATION_ERROR", "Format foto tidak didukung.", {
        photo: "Gunakan berkas JPG, PNG, atau WebP.",
      });

    // Yang sampai di sini adalah hasil kompresi client, jadi batasnya
    // `MAX_UPLOAD_BYTES` — bukan `MAX_PHOTO_BYTES` yang berlaku untuk berkas
    // yang dipilih pengguna. Permintaan bisa dibuat tanpa lewat form, jadi
    // pemeriksaan ini tetap wajib ada.
    if (file.size > MAX_UPLOAD_BYTES)
      return fail("VALIDATION_ERROR", "Ukuran foto terlalu besar.", {
        photo: `Maksimal ${Math.round(MAX_PHOTO_BYTES / 1024 / 1024)} MB.`,
      });

    // Kepemilikan dicek sebelum apa pun diunggah, supaya tidak ada objek
    // tertulis untuk anak milik orang lain.
    const existing = await getChild(user.id, childId);
    if (!existing) return fail("NOT_FOUND", "Data anak tidak ditemukan.");

    const bytes = new Uint8Array(await file.arrayBuffer());
    const key = await putChildPhoto(childId, bytes, file.type);

    const res = await setChildPhotoKey(user.id, childId, key);
    if (!res) {
      // Anak terhapus di tengah proses — jangan tinggalkan objek yatim.
      await deleteChildPhoto(key);
      return fail("NOT_FOUND", "Data anak tidak ditemukan.");
    }
    if (res.previousKey) await deleteChildPhoto(res.previousKey);

    revalidatePath("/dashboard");
    revalidatePath("/children");
    revalidatePath(`/children/${childId}`);
    revalidatePath("/settings");
    return ok({ id: childId });
  } catch (err) {
    return handleUnexpected("uploadChildPhotoAction", err);
  }
}

export async function removeChildPhotoAction(childId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const res = await setChildPhotoKey(user.id, childId, null);
    if (!res) return fail("NOT_FOUND", "Data anak tidak ditemukan.");
    if (res.previousKey) await deleteChildPhoto(res.previousKey);

    revalidatePath("/dashboard");
    revalidatePath("/children");
    revalidatePath(`/children/${childId}`);
    revalidatePath("/settings");
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("removeChildPhotoAction", err);
  }
}

/** Dipakai halaman edit — tetap lewat otorisasi pemilik. */
export async function getOwnedChild(childId: string) {
  const user = await requireUser();
  return getChild(user.id, childId);
}
