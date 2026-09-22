"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  deleteChild,
  getChild,
  insertChild,
  updateChild,
  type NewChild,
} from "@/lib/data/children";
import { childSchema } from "@/schemas/child";
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
  });
}

const toRow = (d: ReturnType<typeof childSchema.parse>): NewChild => ({
  name: d.name,
  sex: d.sex,
  dateOfBirth: d.dateOfBirth,
  birthType: d.birthType,
  gestationalAgeWeeks: d.gestationalAgeWeeks ?? null,
  gestationalAgeDays: d.gestationalAgeDays ?? null,
});

export async function createChildAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = parseChildForm(formData);
    if (!parsed.success)
      return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

    const row = await insertChild(user.id, toRow(parsed.data));
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
    const row = await deleteChild(user.id, childId);
    if (!row) return fail("NOT_FOUND", "Data anak tidak ditemukan.");

    revalidatePath("/dashboard");
    revalidatePath("/children");
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("deleteChildAction", err);
  }
}

/** Dipakai halaman edit — tetap lewat otorisasi pemilik. */
export async function getOwnedChild(childId: string) {
  const user = await requireUser();
  return getChild(user.id, childId);
}
