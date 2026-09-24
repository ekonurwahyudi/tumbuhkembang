"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { assertChildOwned } from "@/lib/data/children";
import { skipVaccination, unskipVaccination } from "@/lib/data/vaccination-skips";
import { CATALOG_KEYS } from "@/lib/immunization/catalog";
import { fail, handleUnexpected, ok, type ActionResult } from "@/lib/action-result";
import { isDuplicateKey } from "@/lib/pg-error";

export async function skipVaccinationAction(
  childId: string,
  catalogKey: string,
): Promise<ActionResult> {
  try {
    if (!CATALOG_KEYS.includes(catalogKey))
      return fail("VALIDATION_ERROR", "Vaksin tidak dikenal.");

    const user = await requireUser();
    if (!(await assertChildOwned(user.id, childId)))
      return fail("NOT_FOUND", "Data anak tidak ditemukan.");

    await skipVaccination(childId, catalogKey);
    revalidatePath(`/children/${childId}`);
    return ok(undefined);
  } catch (err) {
    if (isDuplicateKey(err)) return ok(undefined); // sudah dilewati — idempoten
    return handleUnexpected("skipVaccinationAction", err);
  }
}

export async function unskipVaccinationAction(
  childId: string,
  catalogKey: string,
): Promise<ActionResult> {
  try {
    if (!CATALOG_KEYS.includes(catalogKey))
      return fail("VALIDATION_ERROR", "Vaksin tidak dikenal.");

    const user = await requireUser();
    await unskipVaccination(user.id, childId, catalogKey);
    revalidatePath(`/children/${childId}`);
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("unskipVaccinationAction", err);
  }
}
