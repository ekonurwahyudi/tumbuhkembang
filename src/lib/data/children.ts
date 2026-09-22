import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { children, growthMeasurements, type Child } from "@/db/schema";

/**
 * Semua akses data anak melalui modul ini.
 *
 * Aturan keras: setiap query menyertakan `user_id` pemilik. `childId` yang
 * datang dari client tidak pernah dipercaya sendirian — ia selalu dipasangkan
 * dengan id user dari session. Tidak ada helper "ambil anak tanpa user" di sini,
 * supaya tidak ada jalur yang bisa melewatkan otorisasi.
 */

export async function listChildren(userId: string) {
  return db
    .select()
    .from(children)
    .where(eq(children.userId, userId))
    .orderBy(desc(children.createdAt));
}

export async function getChild(userId: string, childId: string): Promise<Child | undefined> {
  const [row] = await db
    .select()
    .from(children)
    .where(and(eq(children.id, childId), eq(children.userId, userId)))
    .limit(1);
  return row;
}

/** Cek kepemilikan tanpa menarik seluruh baris. Dipakai sebelum menulis measurement. */
export async function assertChildOwned(userId: string, childId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: children.id })
    .from(children)
    .where(and(eq(children.id, childId), eq(children.userId, userId)))
    .limit(1);
  return !!row;
}

export type NewChild = Omit<typeof children.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">;

export async function insertChild(userId: string, values: NewChild) {
  const [row] = await db
    .insert(children)
    .values({ ...values, userId })
    .returning();
  return row;
}

export async function updateChild(userId: string, childId: string, values: NewChild) {
  const [row] = await db
    .update(children)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(children.id, childId), eq(children.userId, userId)))
    .returning();
  return row;
}

export async function deleteChild(userId: string, childId: string) {
  const [row] = await db
    .delete(children)
    .where(and(eq(children.id, childId), eq(children.userId, userId)))
    .returning({ id: children.id });
  return row;
}

/** Anak + pengukuran terakhirnya, untuk kartu dashboard. Satu query, bukan N+1. */
export async function listChildrenWithLatestMeasurement(userId: string) {
  const latest = db
    .select({
      childId: growthMeasurements.childId,
      measuredAt: growthMeasurements.measuredAt,
      weightKg: growthMeasurements.weightKg,
      lengthHeightCm: growthMeasurements.lengthHeightCm,
      headCircumferenceCm: growthMeasurements.headCircumferenceCm,
      rn: sql<number>`row_number() over (
        partition by ${growthMeasurements.childId}
        order by ${growthMeasurements.measuredAt} desc, ${growthMeasurements.createdAt} desc
      )`.as("rn"),
    })
    .from(growthMeasurements)
    .as("latest");

  return db
    .select({
      child: children,
      latestMeasuredAt: latest.measuredAt,
      latestWeightKg: latest.weightKg,
      latestLengthHeightCm: latest.lengthHeightCm,
      latestHeadCircumferenceCm: latest.headCircumferenceCm,
    })
    .from(children)
    .leftJoin(latest, and(eq(latest.childId, children.id), eq(latest.rn, 1)))
    .where(eq(children.userId, userId))
    .orderBy(desc(children.createdAt));
}
