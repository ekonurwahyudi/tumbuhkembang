import "server-only";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { children, feedingLogs, type FeedingLog } from "@/db/schema";

/**
 * Akses catatan asupan selalu di-join ke `children` agar terikat pada pemiliknya.
 * Tidak pernah ada query `WHERE feeding_logs.id = ?` tanpa pemeriksaan user.
 */

export async function listFeedingLogs(
  userId: string,
  childId: string,
  opts: { from?: Date; to?: Date; limit?: number } = {},
): Promise<FeedingLog[]> {
  const conditions = [eq(feedingLogs.childId, childId), eq(children.userId, userId)];
  if (opts.from) conditions.push(gte(feedingLogs.fedAt, opts.from));
  if (opts.to) conditions.push(lt(feedingLogs.fedAt, opts.to));

  const query = db
    .select({ f: feedingLogs })
    .from(feedingLogs)
    .innerJoin(children, eq(children.id, feedingLogs.childId))
    .where(and(...conditions))
    .orderBy(desc(feedingLogs.fedAt), desc(feedingLogs.createdAt));

  const rows = opts.limit ? await query.limit(opts.limit) : await query;
  return rows.map((r) => r.f);
}

export async function getFeedingLog(
  userId: string,
  logId: string,
): Promise<FeedingLog | undefined> {
  const [row] = await db
    .select({ f: feedingLogs })
    .from(feedingLogs)
    .innerJoin(children, eq(children.id, feedingLogs.childId))
    .where(and(eq(feedingLogs.id, logId), eq(children.userId, userId)))
    .limit(1);
  return row?.f;
}

export type FeedingValues = {
  feedingType: FeedingLog["feedingType"];
  amountMl: string | null;
  fedAt: Date;
  notes: string | null;
};

/** Caller wajib sudah memverifikasi kepemilikan `childId` lewat assertChildOwned. */
export async function insertFeedingLog(childId: string, values: FeedingValues) {
  const [row] = await db
    .insert(feedingLogs)
    .values({ ...values, childId })
    .returning();
  return row;
}

export async function updateFeedingLog(userId: string, logId: string, values: FeedingValues) {
  const existing = await getFeedingLog(userId, logId);
  if (!existing) return undefined;

  const [row] = await db
    .update(feedingLogs)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(feedingLogs.id, logId))
    .returning();
  return row;
}

export async function deleteFeedingLog(userId: string, logId: string) {
  const existing = await getFeedingLog(userId, logId);
  if (!existing) return undefined;

  const [row] = await db
    .delete(feedingLogs)
    .where(eq(feedingLogs.id, logId))
    .returning({ id: feedingLogs.id, childId: feedingLogs.childId });
  return row;
}
