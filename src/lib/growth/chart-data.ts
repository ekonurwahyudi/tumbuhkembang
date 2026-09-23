import "server-only";
import { diffInDays } from "./age";
import { evaluateMeasurement, referenceAge, referenceCurve, referenceMeta } from "./engine";
import type { ChildContext, MeasurementInput } from "./engine";
import { isGrowthResult, type MeasurementType } from "./types";

/**
 * Susun data siap-gambar untuk satu grafik pertumbuhan.
 *
 * Seluruh perhitungan terjadi di sini (server); komponen chart hanya menerima
 * angka jadi. Kurva reference dan lintasan anak berbagi satu sumbu usia yang
 * sama — kronologis untuk anak cukup bulan, corrected age untuk bayi prematur.
 */

export type ChartPoint = {
  ageDays: number;
  /** Nilai anak pada usia ini; null pada titik yang hanya berisi kurva reference. */
  child: number | null;
  sd3neg: number;
  sd2neg: number;
  sd0: number;
  sd2: number;
  sd3: number;
};

export type ChartSeries = {
  measurementType: MeasurementType;
  label: string;
  unit: string;
  points: ChartPoint[];
  /** Titik data anak saja, untuk ringkasan teks dan tabel. */
  childPoints: {
    ageDays: number;
    measuredAt: string;
    value: number;
    zScore: number;
    percentile: number;
  }[];
  ageBasis: "chronological" | "corrected";
  reference: { name: string; version: string };
  /** Alasan grafik kosong, bila tidak ada satu pun titik anak yang dapat dinilai. */
  unavailable?: string;
};

const META: Record<MeasurementType, { label: string; unit: string }> = {
  "weight-for-age": { label: "Berat badan", unit: "kg" },
  "length-for-age": { label: "Panjang/tinggi badan", unit: "cm" },
  "head-circumference-for-age": { label: "Lingkar kepala", unit: "cm" },
};

const VALUE_OF: Record<MeasurementType, (m: MeasurementInput) => string | null> = {
  "weight-for-age": (m) => m.weightKg,
  "length-for-age": (m) => m.lengthHeightCm,
  "head-circumference-for-age": (m) => m.headCircumferenceCm,
};

/** Jarak sampel kurva reference: rapat saat bayi, renggang setelahnya. */
function stepFor(maxDay: number): number {
  if (maxDay <= 120) return 3;
  if (maxDay <= 400) return 7;
  return 14;
}

export function buildChartSeries(
  child: ChildContext,
  measurements: MeasurementInput[],
  type: MeasurementType,
): ChartSeries {
  const meta = META[type];
  const getValue = VALUE_OF[type];

  const childPoints: ChartSeries["childPoints"] = [];
  let basis: "chronological" | "corrected" = "chronological";
  let blockedReason: string | undefined;

  for (const m of measurements) {
    if (getValue(m) === null) continue;

    const outcome = evaluateMeasurement(child, m).find((o) => o.measurementType === type);
    if (!outcome) continue;

    if (!isGrowthResult(outcome)) {
      blockedReason ??= outcome.message;
      continue;
    }

    basis = outcome.ageBasis;
    childPoints.push({
      ageDays: outcome.ageDays,
      measuredAt: m.measuredAt,
      value: outcome.value,
      zScore: outcome.zScore,
      percentile: outcome.percentile,
    });
  }

  childPoints.sort((a, b) => a.ageDays - b.ageDays);

  const refMeta = referenceMeta(type, child.sex);
  const reference = { name: refMeta.name, version: refMeta.version };

  if (childPoints.length === 0) {
    return {
      measurementType: type,
      label: meta.label,
      unit: meta.unit,
      points: [],
      childPoints: [],
      ageBasis: basis,
      reference,
      unavailable:
        blockedReason ?? `Belum ada pengukuran ${meta.label.toLowerCase()} yang tercatat.`,
    };
  }

  // Rentang sumbu: dari lahir sampai sedikit setelah pengukuran terakhir,
  // supaya lintasan anak tidak menempel di tepi kanan.
  const lastDay = childPoints.at(-1)!.ageDays;
  const padding = Math.max(14, Math.round(lastDay * 0.08));
  const curve = referenceCurve(type, child.sex, 0, lastDay + padding, stepFor(lastDay));

  const byAge = new Map<number, ChartPoint>();
  for (const c of curve) {
    byAge.set(c.ageDays, { ageDays: c.ageDays, child: null, ...pickSd(c) });
  }

  // Titik anak disisipkan pada usia persisnya; kurva reference di usia itu
  // diambil ulang agar garis SD tetap menyambung mulus.
  for (const p of childPoints) {
    const exact = referenceCurve(type, child.sex, p.ageDays, p.ageDays, 1)[0];
    if (!exact) continue;
    byAge.set(p.ageDays, { ageDays: p.ageDays, child: p.value, ...pickSd(exact) });
  }

  const points = [...byAge.values()].sort((a, b) => a.ageDays - b.ageDays);

  return {
    measurementType: type,
    label: meta.label,
    unit: meta.unit,
    points,
    childPoints,
    ageBasis: basis,
    reference,
  };
}

function pickSd(c: {
  sd3neg: number;
  sd2neg: number;
  sd0: number;
  sd2: number;
  sd3: number;
}) {
  return { sd3neg: c.sd3neg, sd2neg: c.sd2neg, sd0: c.sd0, sd2: c.sd2, sd3: c.sd3 };
}

/** Konteks anak dari baris database. */
export function toChildContext(child: {
  sex: "MALE" | "FEMALE";
  dateOfBirth: string;
  birthType: "TERM" | "PRETERM";
  gestationalAgeWeeks: number | null;
  gestationalAgeDays: number | null;
}): ChildContext {
  return child;
}

export { diffInDays, referenceAge };
