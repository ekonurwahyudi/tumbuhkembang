import "server-only";
import { diffInDays } from "./age";
import { correctedAge } from "./corrected-age";
import { percentileFromZScore, zScore, valueAtZScore } from "./lms";
import { getDataset, lookupLMS } from "./who";
import type {
  GrowthOutcome,
  GrowthResult,
  MeasurementType,
  ReferenceMeta,
  Sex,
} from "./types";

/**
 * Growth engine: Data reference -> hasil perhitungan. Tidak ada React di sini.
 *
 * Pemilihan reference:
 * - Anak cukup bulan  -> WHO Child Growth Standards, sumbu usia kronologis.
 * - Bayi prematur     -> WHO dengan sumbu corrected age.
 *
 * Dasar penggunaan corrected age pada bayi prematur: AAP, "Age Terminology
 * During the Perinatal Period", Pediatrics 2004;114(5):1362-1364, yang
 * merekomendasikan koreksi usia hingga 3 tahun. Lihat
 * docs/medical-references/preterm-growth.md untuk batasan pendekatan ini.
 *
 * Reference khusus preterm (mis. Fenton) BELUM tersedia di aplikasi. Selama
 * bayi belum mencapai usia term (corrected age negatif), tidak ada reference
 * yang berlaku, dan engine menyatakan hasilnya tidak tersedia — bukan menebak.
 */

export type ChildContext = {
  sex: Sex;
  dateOfBirth: string;
  birthType: "TERM" | "PRETERM";
  gestationalAgeWeeks: number | null;
  gestationalAgeDays: number | null;
};

export type MeasurementInput = {
  measuredAt: string;
  weightKg: string | null;
  lengthHeightCm: string | null;
  headCircumferenceCm: string | null;
};

const LABEL: Record<MeasurementType, string> = {
  "weight-for-age": "Berat badan menurut usia",
  "length-for-age": "Panjang/tinggi badan menurut usia",
  "head-circumference-for-age": "Lingkar kepala menurut usia",
};

/** Usia yang dipakai untuk lookup reference, beserta dasarnya. */
export function referenceAge(
  child: ChildContext,
  onDate: string,
): { ageDays: number; basis: "chronological" | "corrected" } {
  const chronological = diffInDays(child.dateOfBirth, onDate);

  if (
    child.birthType === "PRETERM" &&
    child.gestationalAgeWeeks !== null &&
    child.gestationalAgeDays !== null
  ) {
    const corrected = correctedAge({
      dateOfBirth: child.dateOfBirth,
      gestationalAgeWeeks: child.gestationalAgeWeeks,
      gestationalAgeDays: child.gestationalAgeDays,
      asOf: onDate,
    });
    if (corrected.applicable) return { ageDays: corrected.days, basis: "corrected" };
  }

  return { ageDays: chronological, basis: "chronological" };
}

function evaluateOne(
  type: MeasurementType,
  rawValue: string | null,
  child: ChildContext,
  measuredAt: string,
): GrowthOutcome {
  if (rawValue === null) {
    return { measurementType: type, reason: "NO_VALUE", message: `${LABEL[type]} tidak dicatat.` };
  }
  const value = Number(rawValue);
  if (!Number.isFinite(value) || value <= 0) {
    return { measurementType: type, reason: "NO_VALUE", message: `${LABEL[type]} tidak dicatat.` };
  }

  const { ageDays, basis } = referenceAge(child, measuredAt);

  if (ageDays < 0) {
    return {
      measurementType: type,
      reason: "PRETERM_REFERENCE_UNAVAILABLE",
      message:
        "Bayi belum mencapai usia cukup bulan. Reference pertumbuhan khusus prematur belum tersedia di aplikasi ini.",
    };
  }

  const lms = lookupLMS(type, child.sex, ageDays);
  if (!lms) {
    const ds = getDataset(type, child.sex);
    return {
      measurementType: type,
      reason: "AGE_OUT_OF_RANGE",
      message: `Di luar cakupan usia reference WHO (0-${Math.floor(ds.maxDay / 365)} tahun).`,
    };
  }

  const z = zScore(value, lms);
  const ds = getDataset(type, child.sex);

  return {
    measurementType: type,
    ageDays,
    value,
    zScore: z,
    percentile: percentileFromZScore(z),
    reference: ds.reference.name,
    referenceVersion: ds.reference.version,
    ageBasis: basis,
  };
}

/** Evaluasi seluruh indikator untuk satu pengukuran. */
export function evaluateMeasurement(
  child: ChildContext,
  m: MeasurementInput,
): GrowthOutcome[] {
  return [
    evaluateOne("weight-for-age", m.weightKg, child, m.measuredAt),
    evaluateOne("length-for-age", m.lengthHeightCm, child, m.measuredAt),
    evaluateOne("head-circumference-for-age", m.headCircumferenceCm, child, m.measuredAt),
  ];
}

export type ReferenceCurvePoint = {
  ageDays: number;
  /** Nilai pengukuran pada tiap garis SD. */
  sd3neg: number;
  sd2neg: number;
  sd0: number;
  sd2: number;
  sd3: number;
};

/**
 * Kurva reference untuk grafik: nilai pada -3, -2, median, +2, +3 SD.
 * Disampel tiap `stepDays` supaya payload grafik tetap ringan.
 */
export function referenceCurve(
  type: MeasurementType,
  sex: Sex,
  fromDay: number,
  toDay: number,
  stepDays = 7,
): ReferenceCurvePoint[] {
  const ds = getDataset(type, sex);
  const start = Math.max(ds.minDay, Math.floor(fromDay));
  const end = Math.min(ds.maxDay, Math.ceil(toDay));
  if (end < start) return [];

  const out: ReferenceCurvePoint[] = [];
  for (let day = start; day <= end; day += stepDays) {
    const lms = lookupLMS(type, sex, day);
    if (!lms) continue;
    out.push({
      ageDays: day,
      sd3neg: valueAtZScore(-3, lms),
      sd2neg: valueAtZScore(-2, lms),
      sd0: lms.m,
      sd2: valueAtZScore(2, lms),
      sd3: valueAtZScore(3, lms),
    });
  }
  // Pastikan titik akhir ikut tergambar meski tidak kelipatan stepDays.
  const lastLms = lookupLMS(type, sex, end);
  if (lastLms && out.at(-1)?.ageDays !== end) {
    out.push({
      ageDays: end,
      sd3neg: valueAtZScore(-3, lastLms),
      sd2neg: valueAtZScore(-2, lastLms),
      sd0: lastLms.m,
      sd2: valueAtZScore(2, lastLms),
      sd3: valueAtZScore(3, lastLms),
    });
  }
  return out;
}

export function referenceMeta(type: MeasurementType, sex: Sex): ReferenceMeta {
  return getDataset(type, sex).reference;
}

export type { GrowthResult };
