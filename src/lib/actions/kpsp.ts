"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getChildForViewer } from "@/lib/data/children";
import { setKpspAnswer } from "@/lib/data/kpsp";
import { KPSP_ENABLED_AGES, KPSP_FORMS } from "@/lib/kpsp/catalog";
import { fail, handleUnexpected, ok, type ActionResult } from "@/lib/action-result";

export async function saveKpspAnswerAction(
  childId: string,
  ageMonths: number,
  questionKey: string,
  answer: boolean,
): Promise<ActionResult> {
  try {
    if (typeof childId !== "string" || !/^[0-9a-f-]{36}$/i.test(childId)
      || !Number.isInteger(ageMonths) || typeof questionKey !== "string" || typeof answer !== "boolean")
      return fail("VALIDATION_ERROR", "Jawaban tidak valid.");
    const form = KPSP_ENABLED_AGES.some((a) => a === ageMonths)
      ? KPSP_FORMS.find((f) => f.ageMonths === ageMonths)
      : undefined;
    if (!form?.questions.some((q) => q.key === questionKey))
      return fail("VALIDATION_ERROR", "Pertanyaan tidak dikenal.");

    const user = await requireUser();
    if (user.membershipTier !== "VIP" && user.membershipTier !== "VVIP")
      return fail("FORBIDDEN", "Skrining KPSP tersedia untuk member VIP dan VVIP.");
    const viewer = await getChildForViewer(user.id, childId);
    if (!viewer) return fail("NOT_FOUND", "Data anak tidak ditemukan.");

    await setKpspAnswer(childId, ageMonths, questionKey, answer);
    revalidatePath(`/children/${childId}/kpsp`);
    return ok(undefined);
  } catch (error) {
    return handleUnexpected("saveKpspAnswerAction", error);
  }
}
