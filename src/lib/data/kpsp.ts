import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { children, kpspAnswers } from "@/db/schema";
import { KPSP_VERSION } from "@/lib/kpsp/catalog";
import { childVisibleTo } from "./children";

export async function listKpspAnswers(userId: string, childId: string, ageMonths: number) {
  return db
    .select({ questionKey: kpspAnswers.questionKey, answer: kpspAnswers.answer, catalogVersion: kpspAnswers.catalogVersion })
    .from(kpspAnswers)
    .innerJoin(children, eq(children.id, kpspAnswers.childId))
    .where(and(
      eq(kpspAnswers.childId, childId),
      eq(kpspAnswers.ageMonths, ageMonths),
      childVisibleTo(userId),
    ));
}

/** Caller memeriksa akses anak, keanggotaan, dan usia formulir sebelum menulis. */
export async function setKpspAnswer(childId: string, ageMonths: number, questionKey: string, answer: boolean) {
  await db.insert(kpspAnswers)
    .values({ childId, ageMonths, questionKey, answer, catalogVersion: KPSP_VERSION })
    .onConflictDoUpdate({
      target: [kpspAnswers.childId, kpspAnswers.ageMonths, kpspAnswers.questionKey],
      set: { answer, catalogVersion: KPSP_VERSION, updatedAt: new Date() },
    });
}
