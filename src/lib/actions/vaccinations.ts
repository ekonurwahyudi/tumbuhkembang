"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { assertChildAccessible } from "@/lib/data/children";
import {
  deleteVaccination,
  insertVaccination,
  updateVaccination,
  type VaccinationValues,
} from "@/lib/data/vaccinations";
import { vaccinationSchema } from "@/schemas/vaccination";
import { fail, fieldErrors, handleUnexpected, ok, type ActionResult } from "@/lib/action-result";
import { isDuplicateKey } from "@/lib/pg-error";

function parseForm(formData: FormData) {
  return vaccinationSchema.safeParse({
    catalogKey: formData.get("catalogKey"),
    customName: formData.get("customName"),
    givenAt: formData.get("givenAt"),
    notes: formData.get("notes"),
  });
}

const toRow = (d: ReturnType<typeof vaccinationSchema.parse>): VaccinationValues => ({
  catalogKey: d.catalogKey,
  name: d.name,
  givenAt: d.givenAt,
  notes: d.notes,
});


export async function createVaccinationAction(
  childId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    // childId datang dari client — verifikasi kepemilikan sebelum menulis apa pun.
    if (!(await assertChildAccessible(user.id, childId)))
      return fail("NOT_FOUND", "Data anak tidak ditemukan.");

    const parsed = parseForm(formData);
    if (!parsed.success)
      return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

    const row = await insertVaccination(childId, toRow(parsed.data));
    revalidatePath(`/children/${childId}`);
    return ok({ id: row.id });
  } catch (err) {
    if (isDuplicateKey(err))
      return fail("DUPLICATE", "Vaksin ini sudah pernah dicatat untuk anak ini.");
    return handleUnexpected("createVaccinationAction", err);
  }
}

export async function updateVaccinationAction(
  vaccinationId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = parseForm(formData);
    if (!parsed.success)
      return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

    const row = await updateVaccination(user.id, vaccinationId, toRow(parsed.data));
    if (!row) return fail("NOT_FOUND", "Catatan vaksinasi tidak ditemukan.");

    revalidatePath(`/children/${row.childId}`);
    return ok({ id: row.id });
  } catch (err) {
    if (isDuplicateKey(err))
      return fail("DUPLICATE", "Vaksin ini sudah pernah dicatat untuk anak ini.");
    return handleUnexpected("updateVaccinationAction", err);
  }
}

export async function deleteVaccinationAction(vaccinationId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const row = await deleteVaccination(user.id, vaccinationId);
    if (!row) return fail("NOT_FOUND", "Catatan vaksinasi tidak ditemukan.");

    revalidatePath(`/children/${row.childId}`);
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("deleteVaccinationAction", err);
  }
}
