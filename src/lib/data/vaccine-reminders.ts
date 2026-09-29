import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { children, vaccineReminders, type VaccineReminder } from "@/db/schema";
import { childVisibleTo } from "./children";

/**
 * Sama seperti catatan vaksinasi: akses pengingat selalu di-join ke `children`
 * agar terikat pada pemiliknya. Tidak pernah ada query `WHERE id = ?` sendirian.
 */

export async function listReminders(
  userId: string,
  childId: string,
): Promise<VaccineReminder[]> {
  const rows = await db
    .select({ r: vaccineReminders })
    .from(vaccineReminders)
    .innerJoin(children, eq(children.id, vaccineReminders.childId))
    .where(and(eq(vaccineReminders.childId, childId), childVisibleTo(userId)))
    .orderBy(asc(vaccineReminders.remindOn), asc(vaccineReminders.remindTime));
  return rows.map((r) => r.r);
}

export async function getReminder(
  userId: string,
  reminderId: string,
): Promise<VaccineReminder | undefined> {
  const [row] = await db
    .select({ r: vaccineReminders })
    .from(vaccineReminders)
    .innerJoin(children, eq(children.id, vaccineReminders.childId))
    .where(and(eq(vaccineReminders.id, reminderId), childVisibleTo(userId)))
    .limit(1);
  return row?.r;
}

export type ReminderValues = {
  catalogKey: string;
  remindOn: string;
  remindTime: string;
  notes: string | null;
};

/**
 * Caller wajib sudah memverifikasi akses `childId` lewat assertChildAccessible.
 *
 * Upsert pada (childId, catalogKey): menjadwal ulang vaksin yang sama mengganti
 * pengingat lama, bukan menumpuknya — orang tua hanya butuh satu alarm per dosis.
 */
export async function upsertReminder(childId: string, values: ReminderValues) {
  const [row] = await db
    .insert(vaccineReminders)
    .values({ ...values, childId })
    .onConflictDoUpdate({
      target: [vaccineReminders.childId, vaccineReminders.catalogKey],
      set: {
        remindOn: values.remindOn,
        remindTime: values.remindTime,
        notes: values.notes,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row;
}

export async function deleteReminder(userId: string, reminderId: string) {
  const existing = await getReminder(userId, reminderId);
  if (!existing) return undefined;

  const [row] = await db
    .delete(vaccineReminders)
    .where(eq(vaccineReminders.id, reminderId))
    .returning({ id: vaccineReminders.id, childId: vaccineReminders.childId });
  return row;
}
