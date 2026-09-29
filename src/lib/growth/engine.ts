import "server-only";
import { diffInDays } from "./age";
import { correctedAge, postMenstrualAgeDays } from "./corrected-age";
import * as fenton from "./fenton";
import { percentileFromZScore, zScore, valueAtZScore } from "./lms";
import * as who from "./who";
import type {
  AgeBasis,
  GrowthOutcome,
  GrowthResult,
  MeasurementType,
  ReferenceDataset,
  ReferenceMeta,
  Sex,
} from "./types";

/**
 * Growth engine: Data reference -> hasil perhitungan. Tidak ada React di sini.
 *
 * Pemilihan reference:
 * - Anak cukup bulan  -> WHO Child Growth Standards, sumbu usia kronologis.
 * - Bayi prematur     -> Fenton 2013 selama PMA-nya masih tercakup Fenton,
 *                        lalu WHO dengan sumbu corrected age setelahnya.
 *
 * Dasar penggunaan corrected age pada bayi prematur: AAP, "Age Terminology
 * During the Perinatal Period", Pediatrics 2004;114(5):1362-1364, yang
 * merekomendasikan koreksi usia hingga 3 tahun. Lihat
 * docs/medical-references/preterm-growth.md untuk batasan pendekatan ini.
 *
 * Fenton dipakai pada sumbunya sendiri — usia pascamenstruasi — bukan pada usia
 * terkoreksi; keduanya berbeda tepat satu usia gestasi term. Di luar cakupan
 * Fenton dan sebelum bayi mencapai usia term, tidak ada reference yang berlaku
 * dan engine menyatakan hasilnya tidak tersedia, bukan menebak.
 */

export type ChildContext = {
  sex: Sex;
  dateOfBirth: string;
  birthType: "TERM" | "PRETERM";
  gestationalAgeWeeks: number | null;
  gestationalAgeDays: number | null;
  /**
   * Matikan Fenton walau bayinya prematur — saklar yang dipegang pengguna.
   * Default (undefined) = aktif, karena itu yang benar secara klinis.
   */
  useFenton?: boolean;
};

/** Satu reference terpilih, sudah lengkap dengan sumbu usianya. */
type Selection = {
  source: typeof who | typeof fenton;
  ageDays: number;
  basis: AgeBasis;
};

function gestation(child: ChildContext) {
  if (
    child.birthType !== "PRETERM" ||
    child.gestationalAgeWeeks === null ||
    child.gestationalAgeDays === null
  ) {
    return null;
  }
  return { weeks: child.gestationalAgeWeeks, days: child.gestationalAgeDays };
}

/**
 * Batas atas usia gestasi yang membuat Fenton berlaku: 37 minggu 0 hari.
 * Definisi WHO "preterm" adalah < 37 minggu lengkap, jadi 37w0d sendiri sudah
 * term — tapi permintaan produknya "<= 37 minggu", dan Fenton memang masih
 * menggambar sampai sana, sehingga 37w0d ikut masuk sementara 37w1d tidak.
 */
export const FENTON_MAX_GESTATION_DAYS = 37 * 7;

function isPreterm(ga: { weeks: number; days: number }): boolean {
  return ga.weeks * 7 + ga.days <= FENTON_MAX_GESTATION_DAYS;
}

/**
 * Apakah anak ini kandidat grafik Fenton — dipakai untuk memutuskan apakah
 * saklarnya perlu ditampilkan. Berlakunya Fenton pada satu pengukuran masih
 * bergantung PMA-nya; itu dijawab `ageBasis` hasil perhitungan.
 */
export function fentonEligible(child: ChildContext): boolean {
  const ga = gestation(child);
  return ga !== null && isPreterm(ga);
}

/**
 * Reference dan sumbu usia untuk satu pengukuran.
 *
 * Fenton didahulukan selama PMA-nya masih di dalam dataset: di rentang itu ia
 * memang reference yang tepat untuk bayi prematur, dan WHO — yang dimulai pada
 * bayi cukup bulan — belum punya baris untuk usia terkoreksi yang masih negatif.
 * Begitu PMA melewati cakupan Fenton, sumbunya berpindah ke WHO + corrected age.
 */
function selectReference(
  child: ChildContext,
  type: MeasurementType,
  onDate: string,
): Selection {
  const ga = gestation(child);

  if (ga && child.useFenton !== false && isPreterm(ga)) {
    const pma = postMenstrualAgeDays({
      dateOfBirth: child.dateOfBirth,
      gestationalAgeWeeks: ga.weeks,
      gestationalAgeDays: ga.days,
      asOf: onDate,
    });
    const ds = fenton.getDataset(type, child.sex);
    if (pma >= ds.minDay && pma <= ds.maxDay) {
      return { source: fenton, ageDays: pma, basis: "postmenstrual" };
    }
  }

  const { ageDays, basis } = referenceAge(child, onDate);
  return { source: who, ageDays, basis };
}

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
): { ageDays: number; basis: AgeBasis } {
  const chronological = diffInDays(child.dateOfBirth, onDate);
  const ga = gestation(child);

  if (ga) {
    const corrected = correctedAge({
      dateOfBirth: child.dateOfBirth,
      gestationalAgeWeeks: ga.weeks,
      gestationalAgeDays: ga.days,
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

  const { source, ageDays, basis } = selectReference(child, type, measuredAt);

  if (ageDays < 0) {
    return {
      measurementType: type,
      reason: "PRETERM_REFERENCE_UNAVAILABLE",
      message:
        "Bayi belum mencapai usia cukup bulan dan usia pascamenstruasinya di luar cakupan grafik Fenton yang tersedia.",
    };
  }

  const lms = source.lookupLMS(type, child.sex, ageDays);
  if (!lms) {
    const ds = source.getDataset(type, child.sex);
    return {
      measurementType: type,
      reason: "AGE_OUT_OF_RANGE",
      message: `Di luar cakupan usia reference WHO (0-${Math.floor(ds.maxDay / 365)} tahun).`,
    };
  }

  const z = zScore(value, lms);
  const ds = source.getDataset(type, child.sex);

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

/** Reference yang dipakai satu sumbu usia. Fenton hanya hidup di sumbu PMA. */
function sourceFor(basis: AgeBasis) {
  return basis === "postmenstrual" ? fenton : who;
}

/**
 * Kurva reference untuk grafik: nilai pada -3, -2, median, +2, +3 SD.
 * Disampel tiap `stepDays` supaya payload grafik tetap ringan.
 *
 * `basis` menentukan reference-nya, bukan cuma label sumbunya: kurva Fenton
 * hanya benar terhadap PMA, kurva WHO hanya benar terhadap usia kronologis atau
 * terkoreksi. Menggambar salah satunya di sumbu yang lain menghasilkan grafik
 * yang meleset satu usia gestasi penuh.
 */
export function referenceCurve(
  type: MeasurementType,
  sex: Sex,
  fromDay: number,
  toDay: number,
  stepDays = 7,
  basis: AgeBasis = "chronological",
): ReferenceCurvePoint[] {
  const { getDataset, lookupLMS } = sourceFor(basis);
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

export function referenceMeta(
  type: MeasurementType,
  sex: Sex,
  basis: AgeBasis = "chronological",
): ReferenceMeta {
  return sourceFor(basis).getDataset(type, sex).reference;
}

/** Rentang usia yang tercakup reference pada sumbu itu, dalam hari. */
export function referenceRange(
  type: MeasurementType,
  sex: Sex,
  basis: AgeBasis,
): { minDay: number; maxDay: number } {
  const ds: ReferenceDataset = sourceFor(basis).getDataset(type, sex);
  return { minDay: ds.minDay, maxDay: ds.maxDay };
}

export type { GrowthResult };
