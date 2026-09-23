import "server-only";
import hcfaFemale from "./data/who-head-circumference-for-age-female.json";
import hcfaMale from "./data/who-head-circumference-for-age-male.json";
import lhfaFemale from "./data/who-length-for-age-female.json";
import lhfaMale from "./data/who-length-for-age-male.json";
import wfaFemale from "./data/who-weight-for-age-female.json";
import wfaMale from "./data/who-weight-for-age-male.json";
import type { LMS } from "./lms";
import type { MeasurementType, ReferenceDataset, Sex } from "./types";

/**
 * Lookup dataset WHO Child Growth Standards.
 *
 * Dataset berisi parameter LMS per hari usia (0-1856 hari, yakni 0-5 tahun),
 * disalin apa adanya dari tabel resmi WHO. Lihat:
 * - scripts/build-who-dataset.py (konversi dan verifikasi silang)
 * - docs/medical-references/who-growth.md
 *
 * Modul ini server-only: dataset ~500 KB tidak perlu dikirim ke browser.
 */

const DATASETS: Record<MeasurementType, Record<Sex, ReferenceDataset>> = {
  "weight-for-age": { MALE: wfaMale, FEMALE: wfaFemale } as Record<Sex, ReferenceDataset>,
  "length-for-age": { MALE: lhfaMale, FEMALE: lhfaFemale } as Record<Sex, ReferenceDataset>,
  "head-circumference-for-age": { MALE: hcfaMale, FEMALE: hcfaFemale } as Record<
    Sex,
    ReferenceDataset
  >,
};

export function getDataset(type: MeasurementType, sex: Sex): ReferenceDataset {
  return DATASETS[type][sex];
}

/**
 * Parameter LMS pada usia tertentu.
 *
 * Tabel WHO menyediakan satu baris per hari, sehingga lookup adalah indeks
 * langsung — tanpa interpolasi, tanpa pembulatan usia ke bulan. Di luar rentang
 * dataset dikembalikan null; pemanggil wajib menyatakan hasilnya tidak tersedia
 * daripada mengekstrapolasi.
 */
export function lookupLMS(type: MeasurementType, sex: Sex, ageDays: number): LMS | null {
  const ds = getDataset(type, sex);
  if (!Number.isInteger(ageDays) || ageDays < ds.minDay || ageDays > ds.maxDay) return null;

  const point = ds.points[ageDays - ds.minDay];
  // Dataset dijamin berurutan tanpa celah oleh script konversi; ini jaring pengaman.
  if (!point || point.day !== ageDays) return null;

  return { l: point.l, m: point.m, s: point.s };
}
