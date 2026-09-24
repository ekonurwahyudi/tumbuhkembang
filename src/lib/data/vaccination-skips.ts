import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { children, vaccinationSkips } from "@/db/schema";

/** Sama seperti data/vaccinations.ts: selalu di-join ke `children` untuk otorisasi. */

export async function listSkippedCatalogKeys(userId: string, childId: string): Promise<string[]> {
  const rows = await db
    .select({ catalogKey: vaccinationSkips.catalogKey })
    .from(vaccinationSkips)
    .innerJoin(children, eq(children.id, vaccinationSkips.childId))
    .where(and(eq(vaccinationSkips.childId, childId), eq(children.userId, userId)));
  return rows.map((r) => r.catalogKey);
}

/** Caller wajib sudah memverifikasi kepemilikan `childId` lewat assertChildOwned. */
export async function skipVaccination(childId: string, catalogKey: string) {
  const [row] = await db.insert(vaccinationSkips).values({ childId, catalogKey }).returning();
  return row;
}

export async function unskipVaccination(
  userId: string,
  childId: string,
  catalogKey: string,
): Promise<boolean> {
  const owned = await db
    .select({ id: children.id })
    .from(children)
    .where(and(eq(children.id, childId), eq(children.userId, userId)))
    .limit(1);
  if (!owned.length) return false;

  const deleted = await db
    .delete(vaccinationSkips)
    .where(and(eq(vaccinationSkips.childId, childId), eq(vaccinationSkips.catalogKey, catalogKey)))
    .returning({ id: vaccinationSkips.id });
  return deleted.length > 0;
}
