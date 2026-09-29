"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { assertChildAccessible } from "@/lib/data/children";
import {
  deleteFeedingLog,
  insertFeedingLog,
  updateFeedingLog,
  type FeedingValues,
} from "@/lib/data/feeding";
import { feedingSchema } from "@/schemas/feeding";
import { fail, fieldErrors, handleUnexpected, ok, type ActionResult } from "@/lib/action-result";

function parseForm(formData: FormData) {
  return feedingSchema.safeParse({
    feedingType: formData.get("feedingType"),
    fedDate: formData.get("fedDate"),
    fedTime: formData.get("fedTime"),
    amountMl: formData.get("amountMl"),
    notes: formData.get("notes"),
  });
}

/** numeric Postgres dikirim sebagai string agar presisi tidak hilang lewat float. */
const toRow = (d: ReturnType<typeof feedingSchema.parse>): FeedingValues => ({
  feedingType: d.feedingType,
  amountMl: d.amountMl === null ? null : d.amountMl.toFixed(1),
  fedAt: d.fedAt,
  notes: d.notes,
});

function revalidateChild(childId: string) {
  revalidatePath(`/children/${childId}`);
  revalidatePath(`/children/${childId}/feeding`);
}

export async function createFeedingAction(
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

    const row = await insertFeedingLog(childId, toRow(parsed.data));
    revalidateChild(childId);
    return ok({ id: row.id });
  } catch (err) {
    return handleUnexpected("createFeedingAction", err);
  }
}

export async function updateFeedingAction(
  logId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = parseForm(formData);
    if (!parsed.success)
      return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

    const row = await updateFeedingLog(user.id, logId, toRow(parsed.data));
    if (!row) return fail("NOT_FOUND", "Catatan asupan tidak ditemukan.");

    revalidateChild(row.childId);
    return ok({ id: row.id });
  } catch (err) {
    return handleUnexpected("updateFeedingAction", err);
  }
}

export async function deleteFeedingAction(logId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const row = await deleteFeedingLog(user.id, logId);
    if (!row) return fail("NOT_FOUND", "Catatan asupan tidak ditemukan.");

    revalidateChild(row.childId);
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("deleteFeedingAction", err);
  }
}
