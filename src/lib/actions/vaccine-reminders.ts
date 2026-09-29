"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { assertChildAccessible } from "@/lib/data/children";
import { deleteReminder, upsertReminder } from "@/lib/data/vaccine-reminders";
import { reminderSchema } from "@/schemas/reminder";
import { fail, fieldErrors, handleUnexpected, ok, type ActionResult } from "@/lib/action-result";

export async function saveReminderAction(
  childId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    // childId datang dari client — verifikasi akses sebelum menulis apa pun.
    if (!(await assertChildAccessible(user.id, childId)))
      return fail("NOT_FOUND", "Data anak tidak ditemukan.");

    const parsed = reminderSchema.safeParse({
      catalogKey: formData.get("catalogKey"),
      remindOn: formData.get("remindOn"),
      remindTime: formData.get("remindTime"),
      notes: formData.get("notes"),
    });
    if (!parsed.success)
      return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

    const row = await upsertReminder(childId, parsed.data);
    revalidatePath(`/children/${childId}`);
    revalidatePath("/dashboard");
    return ok({ id: row.id });
  } catch (err) {
    return handleUnexpected("saveReminderAction", err);
  }
}

export async function deleteReminderAction(reminderId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const row = await deleteReminder(user.id, reminderId);
    if (!row) return fail("NOT_FOUND", "Pengingat tidak ditemukan.");

    revalidatePath(`/children/${row.childId}`);
    revalidatePath("/dashboard");
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("deleteReminderAction", err);
  }
}
