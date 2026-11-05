import { chronologicalAge, formatYMD, addDays } from "@/lib/growth/age";
import { gestationalAgeInDays, TERM_GESTATION_DAYS } from "@/lib/growth/corrected-age";
import { KPSP_FORMS } from "./catalog";

export type KpspChild = {
  dateOfBirth: string;
  birthType: "TERM" | "PRETERM";
  gestationalAgeWeeks: number | null;
  gestationalAgeDays: number | null;
};

export function kpspAge(child: KpspChild, asOf: string) {
  const chronological = chronologicalAge(child.dateOfBirth, asOf);
  if (chronological.days < 0) return null;
  const corrected = chronological.totalMonths < 24 && child.birthType === "PRETERM"
    && child.gestationalAgeWeeks !== null && child.gestationalAgeDays !== null
    && gestationalAgeInDays(child.gestationalAgeWeeks, child.gestationalAgeDays) < 38 * 7;
  const birth = corrected
    ? formatYMD(addDays(child.dateOfBirth, TERM_GESTATION_DAYS - gestationalAgeInDays(child.gestationalAgeWeeks!, child.gestationalAgeDays!)))
    : child.dateOfBirth;
  const age = chronologicalAge(birth, asOf);
  const roundedMonths = age.days < 0 ? 0 : age.totalMonths + (age.remainingDays > 16 ? 1 : 0);
  return {
    roundedMonths,
    corrected,
    form: roundedMonths > 72 ? null : [...KPSP_FORMS].reverse().find((f) => f.ageMonths <= roundedMonths) ?? null,
  };
}

export function kpspResult(answers: (boolean | null)[]) {
  if (answers.length !== 10 || answers.some((a) => typeof a !== "boolean")) return null;
  const yes = answers.filter(Boolean).length;
  return { yes, status: yes >= 9 ? "Sesuai" : yes >= 7 ? "Meragukan" : "Kemungkinan ada penyimpangan" } as const;
}

