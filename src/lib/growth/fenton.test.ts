import { describe, expect, it } from "vitest";
import { TERM_GESTATION_DAYS } from "./corrected-age";
import { getDataset, lookupLMS } from "./fenton";
import { valueAtZScore } from "./lms";
import { lookupLMS as whoLookup } from "./who";
import type { MeasurementType, Sex } from "./types";

/**
 * Pemeriksaan tabel LMS Fenton yang diterbitkan, terpisah dari digitizer-nya.
 *
 * scripts/fenton/digitize.py sudah memeriksa hasilnya sendiri, tapi pemeriksaan
 * itu tidak melihat berkas yang benar-benar dipakai aplikasi: berkas JSON masih
 * melewati interpolasi harian, pembulatan, dan penyalinan sesudahnya. Tabel ini
 * memberi z-score untuk bayi paling rapuh, jadi ia diperiksa di tempat yang
 * memang dibaca aplikasi.
 */

const TYPES: MeasurementType[] = [
  "weight-for-age",
  "length-for-age",
  "head-circumference-for-age",
];
const SEXES: Sex[] = ["MALE", "FEMALE"];

/**
 * Angka terbitan Fenton 2013 pada PMA 30 minggu, persentil 50 (bayi laki-laki).
 * Ini satu-satunya patokan dari luar: kesalahan kalibrasi sumbu menggeser kelima
 * persentil bersamaan dan tetap terlihat rapi dari dalam.
 */
const PUBLISHED: Record<MeasurementType, { value: number; tolerance: number }> = {
  "weight-for-age": { value: 1.41, tolerance: 0.08 },
  "length-for-age": { value: 39.2, tolerance: 0.6 },
  "head-circumference-for-age": { value: 27.5, tolerance: 0.6 },
};

describe("dataset Fenton", () => {
  it("cocok dengan angka terbitan Fenton pada PMA 30 minggu", () => {
    for (const [type, { value, tolerance }] of Object.entries(PUBLISHED)) {
      const lms = lookupLMS(type as MeasurementType, "MALE", 30 * 7);
      expect(lms, `${type} tidak punya baris di PMA 30 minggu`).not.toBeNull();
      expect(Math.abs(lms!.m - value), `${type}: m=${lms!.m}, terbitan ${value}`).toBeLessThanOrEqual(
        tolerance,
      );
    }
  });

  it("naik secara monoton sepanjang rentangnya", () => {
    for (const type of TYPES) {
      for (const sex of SEXES) {
        const ds = getDataset(type, sex);
        for (let i = 1; i < ds.points.length; i++) {
          expect(
            ds.points[i].m,
            `${type}/${sex} turun di hari ${ds.points[i].day}`,
          ).toBeGreaterThan(ds.points[i - 1].m);
        }
      }
    }
  });

  it("baris harian berurutan tanpa celah", () => {
    for (const type of TYPES) {
      for (const sex of SEXES) {
        const ds = getDataset(type, sex);
        expect(ds.points[0].day).toBe(ds.minDay);
        expect(ds.points.at(-1)!.day).toBe(ds.maxDay);
        expect(ds.points).toHaveLength(ds.maxDay - ds.minDay + 1);
        ds.points.forEach((p, i) => expect(p.day).toBe(ds.minDay + i));
      }
    }
  });

  it("garis SD berurutan dan bernilai positif", () => {
    for (const type of TYPES) {
      for (const sex of SEXES) {
        const ds = getDataset(type, sex);
        for (const day of [ds.minDay, Math.round((ds.minDay + ds.maxDay) / 2), ds.maxDay]) {
          const lms = lookupLMS(type, sex, day)!;
          const sd = [-3, -2, 0, 2, 3].map((z) => valueAtZScore(z, lms));
          expect(sd[0], `${type}/${sex} hari ${day}`).toBeGreaterThan(0);
          for (let i = 1; i < sd.length; i++) {
            expect(sd[i], `${type}/${sex} hari ${day} tidak berurutan`).toBeGreaterThan(sd[i - 1]);
          }
        }
      }
    }
  });

  it("hanya berlaku di dalam rentangnya", () => {
    const ds = getDataset("weight-for-age", "MALE");
    expect(lookupLMS("weight-for-age", "MALE", ds.minDay - 1)).toBeNull();
    expect(lookupLMS("weight-for-age", "MALE", ds.maxDay + 1)).toBeNull();
    expect(lookupLMS("weight-for-age", "MALE", ds.minDay + 0.5)).toBeNull();
  });

  it("menyatu dengan WHO di ujung atas rentangnya", () => {
    // Grafik sumbernya mencetak "Curves equal the WHO Growth Standard at 50
    // weeks". Itu patokan luar kedua, dan justru mengenai minggu-minggu akhir
    // yang paling sulit dibaca — tempat digitizer melanjutkan tiap indikator
    // satu per satu, di luar jangkauan pengurutan-menurut-Y.
    const TOLERANCE: Record<MeasurementType, number> = {
      "weight-for-age": 0.1, // kg
      "length-for-age": 0.5, // cm
      "head-circumference-for-age": 0.5, // cm
    };
    for (const type of TYPES) {
      for (const sex of SEXES) {
        const ds = getDataset(type, sex);
        const fentonM = lookupLMS(type, sex, ds.maxDay)!.m;
        // PMA -> usia terkoreksi: selisihnya tepat satu gestasi term.
        const whoM = whoLookup(type, sex, ds.maxDay - TERM_GESTATION_DAYS)!.m;
        expect(
          Math.abs(fentonM - whoM),
          `${type}/${sex} di PMA ${ds.maxDay / 7}w: Fenton ${fentonM}, WHO ${whoM}`,
        ).toBeLessThanOrEqual(TOLERANCE[type]);
      }
    }
  });

  it("rentangnya berada di dalam 22-50 minggu PMA yang digambar Fenton", () => {
    for (const type of TYPES) {
      for (const sex of SEXES) {
        const ds = getDataset(type, sex);
        expect(ds.minDay).toBeGreaterThanOrEqual(22 * 7);
        expect(ds.maxDay).toBeLessThanOrEqual(50 * 7);
        expect(ds.maxDay - ds.minDay).toBeGreaterThan(15 * 7);
      }
    }
  });
});
