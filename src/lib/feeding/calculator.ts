import { chronologicalAge } from "@/lib/growth/age";

/**
 * Estimasi kisaran asupan susu formula per hari.
 *
 * Sumber: American Academy of Pediatrics, "Amount and Schedule of Baby Formula
 * Feedings" (HealthyChildren.org) —
 * https://www.healthychildren.org/English/ages-stages/baby/formula-feeding/Pages/amount-and-schedule-of-formula-feedings.aspx
 *
 * Aturan AAP yang dipakai, apa adanya:
 *   - sekitar 75 mL (2,5 ons) formula per hari untuk setiap 453 g (1 pon) berat badan;
 *   - tidak lebih dari rata-rata sekitar 960 mL (32 ons) dalam 24 jam.
 *
 * Yang SENGAJA tidak dilakukan modul ini:
 *   - Tidak ada estimasi untuk bayi yang menyusu langsung. WHO menganjurkan
 *     menyusui responsif — sesering yang diinginkan bayi — dan tidak menetapkan
 *     target volume dalam ml sama sekali.
 *   - Tidak ada estimasi untuk bayi prematur. Kebutuhan nutrisi enteral bayi
 *     prematur mengikuti guideline neonatal tersendiri yang belum diterapkan.
 *   - Tidak ada estimasi setelah usia 6 bulan, karena makanan pendamping mulai
 *     menyumbang asupan dan aturan per-berat di atas tidak lagi mewakili.
 *
 * Lihat docs/medical-references/feeding.md
 */

export const AAP_ML_PER_POUND_PER_DAY = 75;
export const POUND_IN_GRAMS = 453;
export const AAP_DAILY_MAX_ML = 960;

/** Batas usia penerapan: sebelum makanan pendamping mulai diberikan. */
export const COMPLEMENTARY_FEEDING_START_DAYS = 183; // ~6 bulan

export type FeedingEstimate = {
  available: true;
  /** Estimasi kebutuhan harian dari berat badan, sebelum dibatasi. */
  fromWeightMl: number;
  /** Nilai yang ditampilkan — sudah dibatasi maksimum harian AAP. */
  estimatedMl: number;
  /** true bila hasil dibatasi oleh maksimum 960 ml/hari. */
  cappedByDailyMax: boolean;
  weightKg: number;
  ageDays: number;
  reference: { name: string; source: string };
};

export type FeedingEstimateUnavailable = {
  available: false;
  reason: "NO_WEIGHT" | "PRETERM" | "AGE_OUT_OF_RANGE";
  message: string;
};

export type FeedingEstimateResult = FeedingEstimate | FeedingEstimateUnavailable;

const REFERENCE = {
  name: "American Academy of Pediatrics — Amount and Schedule of Baby Formula Feedings",
  source:
    "https://www.healthychildren.org/English/ages-stages/baby/formula-feeding/Pages/amount-and-schedule-of-formula-feedings.aspx",
};

export type EstimateInput = {
  weightKg: number | null;
  dateOfBirth: string;
  birthType: "TERM" | "PRETERM";
  gestationalAgeWeeks: number | null;
  gestationalAgeDays: number | null;
  asOf?: string | Date;
};

export function estimateDailyFormula(input: EstimateInput): FeedingEstimateResult {
  const { weightKg, dateOfBirth, birthType, asOf = new Date() } = input;

  if (weightKg === null || !Number.isFinite(weightKg) || weightKg <= 0) {
    return {
      available: false,
      reason: "NO_WEIGHT",
      message:
        "Belum ada berat badan yang tercatat. Tambahkan pengukuran berat untuk melihat estimasi.",
    };
  }

  // Bayi prematur tidak diestimasi sama sekali: kebutuhan nutrisi enteralnya
  // mengikuti guideline neonatal tersendiri, bukan aturan per-berat AAP untuk
  // bayi cukup bulan.
  if (birthType === "PRETERM") {
    return {
      available: false,
      reason: "PRETERM",
      message:
        "Estimasi asupan untuk bayi prematur mengikuti guideline neonatal tersendiri yang belum diterapkan di aplikasi ini. Ikuti anjuran tenaga kesehatan yang merawat.",
    };
  }

  const ageDays = chronologicalAge(dateOfBirth, asOf).days;

  if (ageDays < 0 || ageDays >= COMPLEMENTARY_FEEDING_START_DAYS) {
    return {
      available: false,
      reason: "AGE_OUT_OF_RANGE",
      message:
        "Estimasi ini hanya berlaku sampai usia sekitar 6 bulan. Setelah makanan pendamping dimulai, kebutuhan susu berubah dan tidak lagi dapat dihitung dari berat badan saja.",
    };
  }

  const pounds = (weightKg * 1000) / POUND_IN_GRAMS;
  const fromWeightMl = Math.round(pounds * AAP_ML_PER_POUND_PER_DAY);
  const estimatedMl = Math.min(fromWeightMl, AAP_DAILY_MAX_ML);

  return {
    available: true,
    fromWeightMl,
    estimatedMl,
    cappedByDailyMax: fromWeightMl > AAP_DAILY_MAX_ML,
    weightKg,
    ageDays,
    reference: REFERENCE,
  };
}
