import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { children, growthMeasurements, type GrowthMeasurement } from "@/db/schema";
import { childVisibleTo } from "./children";
import type { MeasurementOutput } from "@/schemas/measurement";

/**
 * Akses measurement selalu di-join ke `children` agar terikat pada pemilik.
 * Tidak pernah ada query `WHERE measurement.id = ?` tanpa pemeriksaan user.
 */

export async function listMeasurements(userId: string, childId: string, order: "asc" | "desc" = "desc") {
  const sort = order === "asc" ? asc : desc;
  const rows = await db
    .select({ m: growthMeasurements })
    .from(growthMeasurements)
    .innerJoin(children, eq(children.id, growthMeasurements.childId))
    .where(and(eq(growthMeasurements.childId, childId), childVisibleTo(userId)))
    .orderBy(sort(growthMeasurements.measuredAt), sort(growthMeasurements.createdAt));
  return rows.map((r) => r.m);
}

export async function getMeasurement(
  userId: string,
  measurementId: string,
): Promise<GrowthMeasurement | undefined> {
  const [row] = await db
    .select({ m: growthMeasurements })
    .from(growthMeasurements)
    .innerJoin(children, eq(children.id, growthMeasurements.childId))
    .where(and(eq(growthMeasurements.id, measurementId), childVisibleTo(userId)))
    .limit(1);
  return row?.m;
}

export async function getLatestMeasurement(userId: string, childId: string) {
  const rows = await listMeasurements(userId, childId, "desc");
  return rows[0];
}

export type MeasurementValues = {
  measuredAt: string;
  weightKg: string | null;
  lengthHeightCm: string | null;
  headCircumferenceCm: string | null;
  notes: string | null;
};

/** numeric Postgres dikirim sebagai string agar presisi desimal tidak hilang lewat float. */
export function toMeasurementValues(d: MeasurementOutput): MeasurementValues {
  return {
    measuredAt: d.measuredAt,
    weightKg: d.weightKg === null ? null : d.weightKg.toFixed(3),
    lengthHeightCm: d.lengthHeightCm === null ? null : d.lengthHeightCm.toFixed(2),
    headCircumferenceCm: d.headCircumferenceCm === null ? null : d.headCircumferenceCm.toFixed(2),
    notes: d.notes,
  };
}

/** Caller wajib sudah memverifikasi kepemilikan `childId` lewat assertChildOwned. */
export async function insertMeasurement(childId: string, values: MeasurementValues) {
  const [row] = await db
    .insert(growthMeasurements)
    .values({ ...values, childId })
    .returning();
  return row;
}

export async function updateMeasurement(
  userId: string,
  measurementId: string,
  values: MeasurementValues,
) {
  const existing = await getMeasurement(userId, measurementId);
  if (!existing) return undefined;

  const [row] = await db
    .update(growthMeasurements)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(growthMeasurements.id, measurementId))
    .returning();
  return row;
}

export async function deleteMeasurement(userId: string, measurementId: string) {
  const existing = await getMeasurement(userId, measurementId);
  if (!existing) return undefined;

  const [row] = await db
    .delete(growthMeasurements)
    .where(eq(growthMeasurements.id, measurementId))
    .returning({ id: growthMeasurements.id, childId: growthMeasurements.childId });
  return row;
}
