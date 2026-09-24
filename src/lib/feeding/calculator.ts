import { chronologicalAge } from "@/lib/growth/age";

/**
 * Estimasi kisaran asupan susu formula per hari, berbasis mL per kg berat
 * badan terkini — bukan lagi rumus AAP per-pon (lihat riwayat git untuk
 * versi lama).
 *
 * Sumber:
 *
 * - **Bayi prematur**: ESPGHAN, "Enteral Nutrition in Preterm Infants" (2022)
 *   — target 150–180 mL/kg/hari untuk bayi prematur yang stabil dan tumbuh.
 *   https://www.espghan.org/dam/jcr:092f7f5a-6557-433c-98d6-7259ab1a9cfa/Enteral%20Nutrition%20in%20Preterm%20Infants%202022%20A.204.pdf
 * - **Bayi cukup bulan**: Children's Health Queensland, "Your guide to the
 *   first 12 months" — 150 mL/kg/hari (5 hari–3 bulan), 120 mL/kg/hari (3–6
 *   bulan). Diakses lewat halaman klinis Nutricia yang mengutip sumber
 *   tersebut; halaman qld.gov.au aslinya mengembalikan 403 saat dicoba
 *   diambil langsung dari lingkungan ini — dicatat apa adanya, bukan
 *   dianggap terverifikasi langsung terhadap sumber primer.
 *   https://nutricia.com.au/paediatrics/resources/how-much-formula-to-give-baby/
 *
 * Yang SENGAJA tidak dilakukan modul ini:
 *   - Tidak ada estimasi untuk bayi yang menyusu langsung. WHO menganjurkan
 *     menyusui responsif — sesering yang diinginkan bayi — dan tidak menetapkan
 *     target volume dalam ml sama sekali.
 *   - Tidak ada estimasi untuk usia 0–5 hari: sumber di atas menyatakan
 *     volumenya naik harian (30–60 mL/kg), bukan satu angka mL/kg yang tetap.
 *   - Tidak ada estimasi setelah usia 6 bulan, karena makanan pendamping mulai
 *     menyumbang asupan dan aturan per-berat di atas tidak lagi mewakili.
 *
 * Lihat docs/medical-references/feeding.md
 */

export const PRETERM_ML_PER_KG_MIN = 150;
export const PRETERM_ML_PER_KG_MAX = 180;
export const TERM_ML_PER_KG_5DAYS_TO_3MONTHS = 150;
export const TERM_ML_PER_KG_3TO6MONTHS = 120;

/** Usia 0–5 hari: volume naik harian, di luar cakupan (lihat komentar modul). */
export const NEWBORN_RAMP_END_DAYS = 5;
/** Batas antar-tier bayi cukup bulan, ~3 bulan. */
export const TERM_TIER_BREAK_DAYS = 91;
/** Batas usia penerapan: sebelum makanan pendamping mulai diberikan. */
export const COMPLEMENTARY_FEEDING_START_DAYS = 183; // ~6 bulan

export type FeedingEstimate = {
  available: true;
  /** Batas bawah (atau satu-satunya nilai, untuk bayi cukup bulan). */
  estimatedMl: number;
  /** Batas atas — hanya terisi untuk bayi prematur (rentang 150–180 mL/kg). */
  estimatedMlMax?: number;
  weightKg: number;
  ageDays: number;
  reference: { name: string; source: string };
};

export type FeedingEstimateUnavailable = {
  available: false;
  reason: "NO_WEIGHT" | "NEWBORN_RAMPING" | "AGE_OUT_OF_RANGE";
  message: string;
};

export type FeedingEstimateResult = FeedingEstimate | FeedingEstimateUnavailable;

const PRETERM_REFERENCE = {
  name: "ESPGHAN — Enteral Nutrition in Preterm Infants (2022)",
  source:
    "https://www.espghan.org/dam/jcr:092f7f5a-6557-433c-98d6-7259ab1a9cfa/Enteral%20Nutrition%20in%20Preterm%20Infants%202022%20A.204.pdf",
};

const TERM_REFERENCE = {
  name: "Children's Health Queensland — Your guide to the first 12 months (via Nutricia)",
  source: "https://nutricia.com.au/paediatrics/resources/how-much-formula-to-give-baby/",
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

  const ageDays = chronologicalAge(dateOfBirth, asOf).days;

  if (ageDays >= 0 && ageDays < NEWBORN_RAMP_END_DAYS) {
    return {
      available: false,
      reason: "NEWBORN_RAMPING",
      message:
        "Pada 5 hari pertama, volume susu naik bertahap tiap hari dan tidak dapat diwakili satu angka per kg berat badan.",
    };
  }

  if (ageDays < 0 || ageDays >= COMPLEMENTARY_FEEDING_START_DAYS) {
    return {
      available: false,
      reason: "AGE_OUT_OF_RANGE",
      message:
        "Estimasi ini hanya berlaku sampai usia sekitar 6 bulan. Setelah makanan pendamping dimulai, kebutuhan susu berubah dan tidak lagi dapat dihitung dari berat badan saja.",
    };
  }

  if (birthType === "PRETERM") {
    return {
      available: true,
      estimatedMl: Math.round(weightKg * PRETERM_ML_PER_KG_MIN),
      estimatedMlMax: Math.round(weightKg * PRETERM_ML_PER_KG_MAX),
      weightKg,
      ageDays,
      reference: PRETERM_REFERENCE,
    };
  }

  const mlPerKg = ageDays < TERM_TIER_BREAK_DAYS ? TERM_ML_PER_KG_5DAYS_TO_3MONTHS : TERM_ML_PER_KG_3TO6MONTHS;

  return {
    available: true,
    estimatedMl: Math.round(weightKg * mlPerKg),
    weightKg,
    ageDays,
    reference: TERM_REFERENCE,
  };
}
