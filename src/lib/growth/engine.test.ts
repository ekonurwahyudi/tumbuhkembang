/**
 * Uji lookup dataset WHO dan growth engine.
 * Nilai expected berasal dari tabel resmi WHO di data/who-source/.
 */
import { describe, expect, it } from "vitest";
import {
  evaluateMeasurement,
  referenceAge,
  referenceCurve,
  referenceMeta,
  type ChildContext,
} from "./engine";
import { isGrowthResult } from "./types";
import { getDataset, lookupLMS } from "./who";
import { zScore } from "./lms";

const TERM_BOY: ChildContext = {
  sex: "MALE",
  dateOfBirth: "2025-09-22",
  birthType: "TERM",
  gestationalAgeWeeks: null,
  gestationalAgeDays: null,
};

describe("dataset WHO", () => {
  it("memuat keenam kombinasi indikator dan sex", () => {
    for (const type of ["weight-for-age", "length-for-age", "head-circumference-for-age"] as const) {
      for (const sex of ["MALE", "FEMALE"] as const) {
        const ds = getDataset(type, sex);
        expect(ds.points).toHaveLength(1857);
        expect(ds.minDay).toBe(0);
        expect(ds.maxDay).toBe(1856);
        expect(ds.reference.name).toBe("WHO Child Growth Standards");
      }
    }
  });

  it("baris per hari berurutan tanpa celah", () => {
    const ds = getDataset("weight-for-age", "MALE");
    for (let i = 0; i < ds.points.length; i++) expect(ds.points[i].day).toBe(i);
  });

  it("lookup mengembalikan nilai LMS persis seperti tabel WHO", () => {
    // weight-for-age laki-laki hari 0
    expect(lookupLMS("weight-for-age", "MALE", 0)).toEqual({
      l: 0.3487,
      m: 3.3464,
      s: 0.14602,
    });
    // weight-for-age laki-laki hari 365
    expect(lookupLMS("weight-for-age", "MALE", 365)).toEqual({
      l: 0.0645,
      m: 9.646,
      s: 0.10925,
    });
    // length-for-age laki-laki hari 0, L = 1
    expect(lookupLMS("length-for-age", "MALE", 0)?.m).toBeCloseTo(49.8842, 4);
    expect(lookupLMS("length-for-age", "MALE", 0)?.l).toBe(1);
  });

  it("laki-laki dan perempuan memakai tabel berbeda", () => {
    expect(lookupLMS("weight-for-age", "MALE", 0)).not.toEqual(
      lookupLMS("weight-for-age", "FEMALE", 0),
    );
    expect(lookupLMS("weight-for-age", "FEMALE", 0)?.m).toBeCloseTo(3.2322, 4);
  });

  it("mengembalikan null di luar rentang, bukan mengekstrapolasi", () => {
    expect(lookupLMS("weight-for-age", "MALE", -1)).toBeNull();
    expect(lookupLMS("weight-for-age", "MALE", 1857)).toBeNull();
    expect(lookupLMS("weight-for-age", "MALE", 1.5)).toBeNull();
  });
});

describe("referenceAge", () => {
  it("anak cukup bulan memakai usia kronologis", () => {
    const { ageDays, basis } = referenceAge(TERM_BOY, "2026-09-22");
    expect(ageDays).toBe(365);
    expect(basis).toBe("chronological");
  });

  it("bayi prematur memakai corrected age", () => {
    const preterm: ChildContext = {
      sex: "MALE",
      dateOfBirth: "2026-01-01",
      birthType: "PRETERM",
      gestationalAgeWeeks: 32,
      gestationalAgeDays: 0,
    };
    // Prematuritas 56 hari; pada 2026-07-01 usia kronologis 181 hari.
    const { ageDays, basis } = referenceAge(preterm, "2026-07-01");
    expect(ageDays).toBe(181 - 56);
    expect(basis).toBe("corrected");
  });

  it("kembali ke usia kronologis setelah batas koreksi 3 tahun (AAP)", () => {
    const preterm: ChildContext = {
      sex: "MALE",
      dateOfBirth: "2022-01-01",
      birthType: "PRETERM",
      gestationalAgeWeeks: 30,
      gestationalAgeDays: 0,
    };
    expect(referenceAge(preterm, "2026-09-22").basis).toBe("chronological");
  });
});

describe("evaluateMeasurement", () => {
  it("menghitung z-score dan persentil terhadap WHO", () => {
    const out = evaluateMeasurement(TERM_BOY, {
      measuredAt: "2026-09-22", // tepat 365 hari
      weightKg: "9.646", // persis median WHO
      lengthHeightCm: null,
      headCircumferenceCm: null,
    });

    const weight = out.find((o) => o.measurementType === "weight-for-age")!;
    expect(isGrowthResult(weight)).toBe(true);
    if (!isGrowthResult(weight)) return;

    expect(weight.ageDays).toBe(365);
    expect(weight.zScore).toBeCloseTo(0, 3);
    expect(weight.percentile).toBeCloseTo(50, 1);
    expect(weight.reference).toBe("WHO Child Growth Standards");
    expect(weight.referenceVersion).toBe("2006");
    expect(weight.ageBasis).toBe("chronological");
  });

  it("nilai -2 SD menghasilkan z-score -2", () => {
    const out = evaluateMeasurement(TERM_BOY, {
      measuredAt: "2026-09-22",
      weightKg: "7.741", // nilai -2 SD dari tabel WHO
      lengthHeightCm: null,
      headCircumferenceCm: null,
    });
    const weight = out.find((o) => o.measurementType === "weight-for-age")!;
    if (!isGrowthResult(weight)) throw new Error("harusnya menghasilkan angka");
    expect(weight.zScore).toBeCloseTo(-2, 2);
    expect(weight.percentile).toBeCloseTo(2.275, 1);
  });

  it("menandai indikator yang tidak dicatat, bukan menebak nilainya", () => {
    const out = evaluateMeasurement(TERM_BOY, {
      measuredAt: "2026-09-22",
      weightKg: "9.6",
      lengthHeightCm: null,
      headCircumferenceCm: null,
    });
    const length = out.find((o) => o.measurementType === "length-for-age")!;
    expect(isGrowthResult(length)).toBe(false);
    if (isGrowthResult(length)) return;
    expect(length.reason).toBe("NO_VALUE");
  });

  it("menyatakan di luar cakupan setelah 5 tahun, bukan mengekstrapolasi", () => {
    const out = evaluateMeasurement(TERM_BOY, {
      measuredAt: "2031-09-22", // lewat 1856 hari
      weightKg: "20",
      lengthHeightCm: null,
      headCircumferenceCm: null,
    });
    const weight = out.find((o) => o.measurementType === "weight-for-age")!;
    expect(isGrowthResult(weight)).toBe(false);
    if (isGrowthResult(weight)) return;
    expect(weight.reason).toBe("AGE_OUT_OF_RANGE");
  });

  it("menyatakan reference belum tersedia untuk bayi yang belum mencapai term", () => {
    const preterm: ChildContext = {
      sex: "MALE",
      dateOfBirth: "2026-09-01",
      birthType: "PRETERM",
      gestationalAgeWeeks: 30,
      gestationalAgeDays: 0,
    };
    const out = evaluateMeasurement(preterm, {
      measuredAt: "2026-09-22", // corrected age masih negatif
      weightKg: "1.5",
      lengthHeightCm: null,
      headCircumferenceCm: null,
    });
    const weight = out.find((o) => o.measurementType === "weight-for-age")!;
    expect(isGrowthResult(weight)).toBe(false);
    if (isGrowthResult(weight)) return;
    expect(weight.reason).toBe("PRETERM_REFERENCE_UNAVAILABLE");
  });

  it("bayi prematur dinilai pada corrected age, bukan usia kronologis", () => {
    const preterm: ChildContext = {
      sex: "MALE",
      dateOfBirth: "2026-01-01",
      birthType: "PRETERM",
      gestationalAgeWeeks: 32,
      gestationalAgeDays: 0,
    };
    const out = evaluateMeasurement(preterm, {
      measuredAt: "2026-07-01",
      weightKg: "7.5",
      lengthHeightCm: null,
      headCircumferenceCm: null,
    });
    const weight = out.find((o) => o.measurementType === "weight-for-age")!;
    if (!isGrowthResult(weight)) throw new Error("harusnya menghasilkan angka");

    expect(weight.ageBasis).toBe("corrected");
    expect(weight.ageDays).toBe(125); // 181 kronologis - 56 prematuritas

    // Hasilnya harus cocok dengan lookup pada usia terkoreksi, bukan kronologis.
    const lmsCorrected = lookupLMS("weight-for-age", "MALE", 125)!;
    expect(weight.zScore).toBeCloseTo(zScore(7.5, lmsCorrected), 10);

    const lmsChrono = lookupLMS("weight-for-age", "MALE", 181)!;
    expect(weight.zScore).not.toBeCloseTo(zScore(7.5, lmsChrono), 2);
  });
});

describe("referenceCurve", () => {
  it("menghasilkan garis SD yang berurutan naik", () => {
    const curve = referenceCurve("weight-for-age", "MALE", 0, 365, 30);
    expect(curve.length).toBeGreaterThan(10);
    for (const p of curve) {
      expect(p.sd3neg).toBeLessThan(p.sd2neg);
      expect(p.sd2neg).toBeLessThan(p.sd0);
      expect(p.sd0).toBeLessThan(p.sd2);
      expect(p.sd2).toBeLessThan(p.sd3);
    }
  });

  it("median kurva cocok dengan M pada tabel WHO", () => {
    const curve = referenceCurve("weight-for-age", "MALE", 365, 365, 7);
    expect(curve[0].sd0).toBeCloseTo(9.646, 4);
    expect(curve[0].sd2neg).toBeCloseTo(7.741, 3);
    expect(curve[0].sd2).toBeCloseTo(11.983, 3);
  });

  it("dibatasi pada rentang dataset", () => {
    const curve = referenceCurve("weight-for-age", "MALE", -100, 5000, 30);
    expect(curve[0].ageDays).toBe(0);
    expect(curve.at(-1)!.ageDays).toBe(1856);
  });

  it("menyertakan titik akhir meski bukan kelipatan langkah", () => {
    const curve = referenceCurve("weight-for-age", "MALE", 0, 100, 30);
    expect(curve.at(-1)!.ageDays).toBe(100);
  });
});

describe("referenceMeta", () => {
  it("membawa metadata yang dapat diaudit", () => {
    const meta = referenceMeta("weight-for-age", "MALE");
    expect(meta.name).toBe("WHO Child Growth Standards");
    expect(meta.version).toBe("2006");
    expect(meta.source).toContain("who.int");
  });
});
