import type { LMS } from "./lms";

export type Sex = "MALE" | "FEMALE";

export type MeasurementType =
  | "weight-for-age"
  | "length-for-age"
  | "head-circumference-for-age";

/** Metadata reference, ikut dibawa setiap hasil agar dapat diaudit. */
export type ReferenceMeta = {
  name: string;
  version: string;
  source: string;
  population: string;
};

export type ReferenceDataset = {
  reference: ReferenceMeta;
  indicator: MeasurementType;
  sex: Sex;
  ageUnit: "day";
  minDay: number;
  maxDay: number;
  sourceFile: string;
  points: ({ day: number } & LMS)[];
};

/** Hasil satu perhitungan pertumbuhan. UI hanya menampilkan ini. */
export type GrowthResult = {
  measurementType: MeasurementType;
  ageDays: number;
  value: number;
  zScore: number;
  percentile: number;
  reference: string;
  referenceVersion: string;
  /** Sumbu usia yang dipakai. */
  ageBasis: AgeBasis;
};

/**
 * Sumbu usia perhitungan:
 * - chronological: sejak lahir (anak cukup bulan).
 * - corrected:     kronologis dikurangi prematuritas, sumbu WHO untuk prematur.
 * - postmenstrual: usia gestasi + kronologis, satu-satunya sumbu Fenton.
 */
export type AgeBasis = "chronological" | "corrected" | "postmenstrual";

/** Alasan sebuah perhitungan tidak dapat dilakukan — ditampilkan apa adanya, bukan ditebak. */
export type GrowthUnavailable = {
  measurementType: MeasurementType;
  reason:
    | "NO_VALUE"
    | "AGE_OUT_OF_RANGE"
    | "PRETERM_REFERENCE_UNAVAILABLE";
  message: string;
};

export type GrowthOutcome = GrowthResult | GrowthUnavailable;

export const isGrowthResult = (o: GrowthOutcome): o is GrowthResult => "zScore" in o;
