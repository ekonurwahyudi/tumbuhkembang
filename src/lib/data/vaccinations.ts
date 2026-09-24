import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { children, vaccinations, type Vaccination } from "@/db/schema";

/**
 * Akses catatan vaksinasi selalu di-join ke `children` agar terikat pada pemiliknya.
 * Tidak pernah ada query `WHERE vaccinations.id = ?` tanpa pemeriksaan user.
 */

export async function listVaccinations(userId: string, childId: string): Promise<Vaccination[]> {
  const rows = await db
    .select({ v: vaccinations })
    .from(vaccinations)
    .innerJoin(children, eq(children.id, vaccinations.childId))
    .where(and(eq(vaccinations.childId, childId), eq(children.userId, userId)))
    .orderBy(asc(vaccinations.givenAt));
  return rows.map((r) => r.v);
}

export async function getVaccination(
  userId: string,
  vaccinationId: string,
): Promise<Vaccination | undefined> {
  const [row] = await db
    .select({ v: vaccinations })
    .from(vaccinations)
    .innerJoin(children, eq(children.id, vaccinations.childId))
    .where(and(eq(vaccinations.id, vaccinationId), eq(children.userId, userId)))
    .limit(1);
  return row?.v;
}

export type VaccinationValues = {
  catalogKey: string | null;
  name: string;
  givenAt: string;
  notes: string | null;
};

/** Caller wajib sudah memverifikasi kepemilikan `childId` lewat assertChildOwned. */
export async function insertVaccination(childId: string, values: VaccinationValues) {
  const [row] = await db
    .insert(vaccinations)
    .values({ ...values, childId })
    .returning();
  return row;
}

export async function updateVaccination(
  userId: string,
  vaccinationId: string,
  values: VaccinationValues,
) {
  const existing = await getVaccination(userId, vaccinationId);
  if (!existing) return undefined;

  const [row] = await db
    .update(vaccinations)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(vaccinations.id, vaccinationId))
    .returning();
  return row;
}

export async function deleteVaccination(userId: string, vaccinationId: string) {
  const existing = await getVaccination(userId, vaccinationId);
  if (!existing) return undefined;

  const [row] = await db
    .delete(vaccinations)
    .where(eq(vaccinations.id, vaccinationId))
    .returning({ id: vaccinations.id, childId: vaccinations.childId });
  return row;
}
