import { addDays, chronologicalAge, diffInDays, formatYMD, type ChronologicalAge } from "./age";

/**
 * Corrected (adjusted) age untuk bayi prematur.
 *
 * Definisi mengikuti AAP (American Academy of Pediatrics), Policy Statement
 * "Age Terminology During the Perinatal Period" (Pediatrics, 2004;114(5):1362-1364,
 * reaffirmed): corrected age = usia kronologis dikurangi jumlah minggu bayi
 * lahir sebelum 40 minggu (term).
 *
 *   corrected_age_days = chronological_age_days - (40w0d - gestational_age_at_birth)
 *
 * AAP merekomendasikan koreksi usia dipakai hingga sekitar 3 tahun; setelah itu
 * usia kronologis yang dipakai. Lihat docs/medical-references/preterm-growth.md
 */

/** 40 minggu 0 hari = 280 hari. Titik acuan "term" pada definisi AAP. */
export const TERM_GESTATION_DAYS = 280;

/** Batas atas koreksi menurut rekomendasi AAP (3 tahun usia kronologis). */
export const CORRECTION_LIMIT_DAYS = 3 * 365;

export type CorrectedAge = {
  /** Usia terkoreksi dalam hari. Negatif berarti bayi belum mencapai usia term. */
  days: number;
  /** Jumlah hari bayi lahir sebelum term. */
  prematurityDays: number;
  /** false bila usia kronologis sudah melewati batas koreksi. */
  applicable: boolean;
  chronological: ChronologicalAge;
};

export function gestationalAgeInDays(weeks: number, days: number): number {
  if (!Number.isInteger(weeks) || !Number.isInteger(days))
    throw new RangeError("Usia gestasi harus bilangan bulat");
  if (days < 0 || days > 6) throw new RangeError("Hari usia gestasi harus 0-6");
  if (weeks < 0) throw new RangeError("Minggu usia gestasi tidak boleh negatif");
  return weeks * 7 + days;
}

export function correctedAge(params: {
  dateOfBirth: string | Date;
  gestationalAgeWeeks: number;
  gestationalAgeDays: number;
  asOf?: string | Date;
}): CorrectedAge {
  const { dateOfBirth, gestationalAgeWeeks, gestationalAgeDays, asOf = new Date() } = params;

  const gaDays = gestationalAgeInDays(gestationalAgeWeeks, gestationalAgeDays);
  const prematurityDays = Math.max(0, TERM_GESTATION_DAYS - gaDays);
  const chronological = chronologicalAge(dateOfBirth, asOf);
  const chronoDays = diffInDays(dateOfBirth, asOf);

  return {
    days: chronoDays - prematurityDays,
    prematurityDays,
    applicable: chronoDays <= CORRECTION_LIMIT_DAYS && prematurityDays > 0,
    chronological,
  };
}

/**
 * Post-menstrual age (PMA) = usia gestasi saat lahir + usia kronologis.
 * Ini sumbu usia yang dipakai chart pertumbuhan preterm (mis. Fenton).
 */
export function postMenstrualAgeDays(params: {
  dateOfBirth: string | Date;
  gestationalAgeWeeks: number;
  gestationalAgeDays: number;
  asOf?: string | Date;
}): number {
  const { dateOfBirth, gestationalAgeWeeks, gestationalAgeDays, asOf = new Date() } = params;
  return gestationalAgeInDays(gestationalAgeWeeks, gestationalAgeDays) + diffInDays(dateOfBirth, asOf);
}

/** Tampilan PMA konvensional: "34 minggu 2 hari". */
export function formatWeeksDays(totalDays: number): string {
  if (totalDays < 0) return "-";
  const w = Math.floor(totalDays / 7);
  const d = totalDays % 7;
  return d === 0 ? `${w} minggu` : `${w} minggu ${d} hari`;
}

/**
 * Estimated date of delivery (EDD) — tanggal anak *seharusnya* lahir bila cukup bulan.
 * AAP mendefinisikan EDD sebagai 40 minggu setelah hari pertama haid terakhir; di sini
 * diturunkan dari tanggal lahir + jumlah hari prematuritas, yang ekuivalen.
 *
 * Berguna untuk menampilkan corrected age memakai aritmetika kalender yang sama dengan
 * usia kronologis: corrected age = usia kronologis dihitung dari EDD.
 */
export function estimatedDueDate(params: {
  dateOfBirth: string | Date;
  gestationalAgeWeeks: number;
  gestationalAgeDays: number;
}): string {
  const gaDays = gestationalAgeInDays(params.gestationalAgeWeeks, params.gestationalAgeDays);
  const prematurityDays = Math.max(0, TERM_GESTATION_DAYS - gaDays);
  return formatYMD(addDays(params.dateOfBirth, prematurityDays));
}
