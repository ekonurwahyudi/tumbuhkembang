/**
 * Katalog vaksin wajib program pemerintah (Imunisasi Rutin Lengkap / Imunisasi
 * Dasar dan Lanjutan Baduta, usia 0–24 bulan).
 *
 * Sumber dan batasan: docs/medical-references/immunization.md
 */

/**
 * Dua bentuk syarat berat yang muncul di sumber (lihat
 * docs/medical-references/immunization.md untuk rincian per vaksin):
 *
 * - `delayToAge`: HB0 — berat lahir < `triggerBelowGrams` menunda dosis ke
 *   usia kalender tetap `minAgeMonths`.
 * - `requireCurrentWeight`: BCG (bayi BBLR) dan Polio/DPT-HB-Hib (bayi
 *   prematur) — tidak ada usia pengganti yang tetap; dosis ditunda sampai
 *   berat badan TERKINI (bukan berat lahir) mencapai `requiredGrams`.
 *   `triggerBelowGrams` membatasi syarat ini hanya berlaku bila berat lahir
 *   di bawah angka itu (BCG); `pretermOnly` membatasinya hanya untuk bayi
 *   `birthType === "PRETERM"` (Polio/DPT-HB-Hib), independen dari angka
 *   berat lahir spesifik.
 */
type LowBirthWeightRule =
  | { kind: "delayToAge"; triggerBelowGrams: number; minAgeMonths: number }
  | {
      kind: "requireCurrentWeight";
      requiredGrams: number;
      triggerBelowGrams?: number;
      pretermOnly?: boolean;
    };

export type CatalogVaccine = {
  key: string;
  name: string;
  /**
   * Usia minimum diberikan, dalam bulan kalender penuh — satuan yang sama
   * dengan chronologicalAge(...).totalMonths, agar tidak meleset akibat
   * pendekatan "1 bulan = 30 hari" di bulan yang lebih pendek/panjang.
   */
  minAgeMonths: number;
  /** Label usia untuk ditampilkan ke user. */
  ageLabel: string;
  /** Syarat berat yang menunda dosis ini — lihat `LowBirthWeightRule`. */
  lowBirthWeight?: LowBirthWeightRule;
};

export const IMMUNIZATION_CATALOG: CatalogVaccine[] = [
  {
    key: "HB0",
    name: "Hepatitis B (HB0)",
    minAgeMonths: 0,
    ageLabel: "0–24 jam",
    lowBirthWeight: { kind: "delayToAge", triggerBelowGrams: 2000, minAgeMonths: 1 },
  },
  {
    key: "BCG",
    name: "BCG",
    minAgeMonths: 1,
    ageLabel: "1 bulan",
    lowBirthWeight: { kind: "requireCurrentWeight", requiredGrams: 2500, triggerBelowGrams: 2500 },
  },
  {
    key: "OPV1",
    name: "Polio tetes 1 (OPV1)",
    minAgeMonths: 1,
    ageLabel: "1 bulan",
    lowBirthWeight: { kind: "requireCurrentWeight", requiredGrams: 2000, pretermOnly: true },
  },
  {
    key: "DPT_HB_HIB_1",
    name: "DPT-HB-Hib 1",
    minAgeMonths: 2,
    ageLabel: "2 bulan",
    lowBirthWeight: { kind: "requireCurrentWeight", requiredGrams: 2000, pretermOnly: true },
  },
  {
    key: "OPV2",
    name: "Polio tetes 2 (OPV2)",
    minAgeMonths: 2,
    ageLabel: "2 bulan",
    lowBirthWeight: { kind: "requireCurrentWeight", requiredGrams: 2000, pretermOnly: true },
  },
  { key: "PCV1", name: "PCV 1", minAgeMonths: 2, ageLabel: "2 bulan" },
  { key: "RV1", name: "Rotavirus 1", minAgeMonths: 2, ageLabel: "2 bulan" },
  {
    key: "DPT_HB_HIB_2",
    name: "DPT-HB-Hib 2",
    minAgeMonths: 3,
    ageLabel: "3 bulan",
    lowBirthWeight: { kind: "requireCurrentWeight", requiredGrams: 2000, pretermOnly: true },
  },
  {
    key: "OPV3",
    name: "Polio tetes 3 (OPV3)",
    minAgeMonths: 3,
    ageLabel: "3 bulan",
    lowBirthWeight: { kind: "requireCurrentWeight", requiredGrams: 2000, pretermOnly: true },
  },
  { key: "PCV2", name: "PCV 2", minAgeMonths: 3, ageLabel: "3 bulan" },
  { key: "RV2", name: "Rotavirus 2", minAgeMonths: 3, ageLabel: "3 bulan" },
  {
    key: "DPT_HB_HIB_3",
    name: "DPT-HB-Hib 3",
    minAgeMonths: 4,
    ageLabel: "4 bulan",
    lowBirthWeight: { kind: "requireCurrentWeight", requiredGrams: 2000, pretermOnly: true },
  },
  {
    key: "OPV4",
    name: "Polio tetes 4 (OPV4)",
    minAgeMonths: 4,
    ageLabel: "4 bulan",
    lowBirthWeight: { kind: "requireCurrentWeight", requiredGrams: 2000, pretermOnly: true },
  },
  { key: "IPV1", name: "Polio suntik 1 (IPV1)", minAgeMonths: 4, ageLabel: "4 bulan" },
  { key: "RV3", name: "Rotavirus 3", minAgeMonths: 4, ageLabel: "4 bulan" },
  { key: "MR1", name: "Campak-Rubela (MR)", minAgeMonths: 9, ageLabel: "9 bulan" },
  { key: "IPV2", name: "Polio suntik 2 (IPV2)", minAgeMonths: 9, ageLabel: "9 bulan" },
  { key: "PCV3", name: "PCV booster", minAgeMonths: 12, ageLabel: "12 bulan" },
  {
    key: "DPT_HB_HIB_4",
    name: "DPT-HB-Hib lanjutan",
    minAgeMonths: 18,
    ageLabel: "18 bulan",
    lowBirthWeight: { kind: "requireCurrentWeight", requiredGrams: 2000, pretermOnly: true },
  },
  { key: "MR2", name: "Campak-Rubela lanjutan", minAgeMonths: 18, ageLabel: "18 bulan" },
];

export const CATALOG_KEYS = IMMUNIZATION_CATALOG.map((v) => v.key);

export function catalogVaccine(key: string): CatalogVaccine | undefined {
  return IMMUNIZATION_CATALOG.find((v) => v.key === key);
}

/** Usia minimum efektif — hanya syarat `delayToAge` (HB0) yang menggesernya. */
export function effectiveMinAgeMonths(
  cv: CatalogVaccine,
  birthWeightGrams: number | null,
): number {
  const rule = cv.lowBirthWeight;
  if (
    rule?.kind === "delayToAge" &&
    birthWeightGrams != null &&
    birthWeightGrams < rule.triggerBelowGrams
  )
    return rule.minAgeMonths;
  return cv.minAgeMonths;
}

/**
 * Syarat berat TERKINI (bukan berat lahir) terpenuhi? true bila tidak ada
 * syarat semacam ini, syaratnya tidak berlaku untuk anak ini (tidak
 * BBLR/tidak prematur, sesuai rule), atau berat belum diketahui — konsisten
 * dengan `effectiveMinAgeMonths`: berat tidak diketahui berarti tidak
 * menunda apa pun.
 */
export function weightGateSatisfied(
  cv: CatalogVaccine,
  child: { birthType: "TERM" | "PRETERM"; birthWeightGrams: number | null },
  currentWeightGrams: number | null,
): boolean {
  const rule = cv.lowBirthWeight;
  if (!rule || rule.kind !== "requireCurrentWeight") return true;
  if (!weightRuleApplies(cv, child)) return true;
  if (currentWeightGrams == null) return true;
  return currentWeightGrams >= rule.requiredGrams;
}

/**
 * Syarat berat pada vaksin ini berlaku untuk anak INI? Untuk bayi cukup bulan
 * dengan berat lahir normal, jawabannya false — syaratnya tidak relevan dan
 * tidak perlu ditampilkan. Dipakai UI untuk memutuskan menampilkan kriteria,
 * dan oleh `weightGateSatisfied` agar aturan "berlaku untuk siapa" hanya
 * ditulis di satu tempat.
 */
export function weightRuleApplies(
  cv: CatalogVaccine,
  child: { birthType: "TERM" | "PRETERM"; birthWeightGrams: number | null },
): boolean {
  const rule = cv.lowBirthWeight;
  if (!rule) return false;
  const belowTrigger = (grams: number) =>
    child.birthWeightGrams != null && child.birthWeightGrams < grams;
  if (rule.kind === "delayToAge") return belowTrigger(rule.triggerBelowGrams);
  if (rule.pretermOnly && child.birthType !== "PRETERM") return false;
  if (rule.triggerBelowGrams != null) return belowTrigger(rule.triggerBelowGrams);
  return true;
}

/** Teks singkat untuk baris UI saat `weightGateSatisfied` bernilai false. */
export function weightGateNote(cv: CatalogVaccine): string | null {
  const rule = cv.lowBirthWeight;
  if (!rule || rule.kind !== "requireCurrentWeight") return null;
  return `Ditunda sampai berat badan saat ini ≥${rule.requiredGrams / 1000} kg`;
}

/**
 * Deskripsi syarat berat, ditampilkan selalu (bukan cuma saat menunda) supaya
 * kriteria berat terlihat untuk semua vaksin yang punya syarat — bukan hanya
 * saat sedang aktif menahan dosis anak tertentu.
 */
export function weightCriteriaLabel(cv: CatalogVaccine): string | null {
  const rule = cv.lowBirthWeight;
  if (!rule) return null;
  if (rule.kind === "delayToAge")
    return `berat lahir <${rule.triggerBelowGrams / 1000} kg → ditunda ke usia ${rule.minAgeMonths} bulan`;
  const who = rule.pretermOnly ? "bayi prematur" : `BBLR <${(rule.triggerBelowGrams ?? rule.requiredGrams) / 1000} kg`;
  return `${who}: syarat berat saat ini ≥${rule.requiredGrams / 1000} kg`;
}
