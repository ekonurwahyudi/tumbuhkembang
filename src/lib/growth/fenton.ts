import "server-only";
import hcfaFemale from "./data/fenton-head-circumference-for-age-female.json";
import hcfaMale from "./data/fenton-head-circumference-for-age-male.json";
import lhfaFemale from "./data/fenton-length-for-age-female.json";
import lhfaMale from "./data/fenton-length-for-age-male.json";
import wfaFemale from "./data/fenton-weight-for-age-female.json";
import wfaMale from "./data/fenton-weight-for-age-male.json";
import type { LMS } from "./lms";
import type { MeasurementType, ReferenceDataset, Sex } from "./types";

/**
 * Lookup Fenton 2013 preterm growth chart.
 *
 * Bentuknya sengaja sama persis dengan who.ts — `ReferenceDataset` yang sama,
 * indeks harian yang sama — hanya sumbunya yang berbeda: **usia pascamenstruasi
 * (PMA), bukan usia kronologis maupun usia terkoreksi.** Lihat
 * `postMenstrualAgeDays()` di ./corrected-age.ts.
 *
 * Datanya didigitasi dari grafik Fenton di Buku KIA (scripts/fenton/), bukan
 * disalin dari tabel resmi: tabel LMS Fenton tidak diterbitkan dengan lisensi
 * terbuka. Konsekuensinya dicatat di docs/medical-references/preterm-growth.md.
 *
 * Cakupannya lebih sempit daripada 22-50 minggu yang tercetak di grafik: di atas
 * ~46 minggu kurva berat menembus wilayah gambar milik skala sentimeter,
 * sehingga digitasi tidak bisa memisahkannya dengan andal, dan menerbitkan
 * tebakan lebih buruk daripada menyatakan tidak tersedia. Rentang sebenarnya
 * dibaca dari `minDay`/`maxDay` tiap dataset, bukan dari angka di komentar ini.
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

/** Parameter LMS pada PMA tertentu (hari). Di luar rentang -> null. */
export function lookupLMS(type: MeasurementType, sex: Sex, pmaDays: number): LMS | null {
  const ds = getDataset(type, sex);
  if (!Number.isInteger(pmaDays) || pmaDays < ds.minDay || pmaDays > ds.maxDay) return null;

  const point = ds.points[pmaDays - ds.minDay];
  if (!point || point.day !== pmaDays) return null;

  return { l: point.l, m: point.m, s: point.s };
}
