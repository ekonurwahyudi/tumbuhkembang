"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { assertChildOwned } from "@/lib/data/children";
import {
  deleteMeasurement,
  insertMeasurement,
  updateMeasurement,
  type MeasurementValues,
} from "@/lib/data/measurements";
import { measurementSchema } from "@/schemas/measurement";
import { fail, fieldErrors, handleUnexpected, ok, type ActionResult } from "@/lib/action-result";

function parseForm(formData: FormData) {
  return measurementSchema.safeParse({
    measuredAt: formData.get("measuredAt"),
    weightKg: formData.get("weightKg"),
    lengthHeightCm: formData.get("lengthHeightCm"),
    headCircumferenceCm: formData.get("headCircumferenceCm"),
    notes: formData.get("notes"),
  });
}

/** numeric Postgres dikirim sebagai string agar presisi desimal tidak hilang lewat float. */
const toRow = (d: ReturnType<typeof measurementSchema.parse>): MeasurementValues => ({
  measuredAt: d.measuredAt,
  weightKg: d.weightKg === null ? null : d.weightKg.toFixed(3),
  lengthHeightCm: d.lengthHeightCm === null ? null : d.lengthHeightCm.toFixed(2),
  headCircumferenceCm: d.headCircumferenceCm === null ? null : d.headCircumferenceCm.toFixed(2),
  notes: d.notes,
});

function revalidateChild(childId: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/children/${childId}`);
  revalidatePath(`/children/${childId}/measurements`);
  revalidatePath(`/children/${childId}/growth`);
}

export async function createMeasurementAction(
  childId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    // childId datang dari client — verifikasi kepemilikan sebelum menulis apa pun.
    if (!(await assertChildOwned(user.id, childId)))
      return fail("NOT_FOUND", "Data anak tidak ditemukan.");

    const parsed = parseForm(formData);
    if (!parsed.success)
      return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

    const row = await insertMeasurement(childId, toRow(parsed.data));
    revalidateChild(childId);
    return ok({ id: row.id });
  } catch (err) {
    return handleUnexpected("createMeasurementAction", err);
  }
}

export async function updateMeasurementAction(
  measurementId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = parseForm(formData);
    if (!parsed.success)
      return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

    const row = await updateMeasurement(user.id, measurementId, toRow(parsed.data));
    if (!row) return fail("NOT_FOUND", "Data pengukuran tidak ditemukan.");

    revalidateChild(row.childId);
    return ok({ id: row.id });
  } catch (err) {
    return handleUnexpected("updateMeasurementAction", err);
  }
}

export async function deleteMeasurementAction(measurementId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const row = await deleteMeasurement(user.id, measurementId);
    if (!row) return fail("NOT_FOUND", "Data pengukuran tidak ditemukan.");

    revalidateChild(row.childId);
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("deleteMeasurementAction", err);
  }
}
