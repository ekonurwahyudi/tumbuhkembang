import { describe, expect, it } from "vitest";
import { buildChartSeries } from "./chart-data";
import type { ChildContext } from "./engine";

const AISYAH: ChildContext = {
  sex: "FEMALE",
  dateOfBirth: "2026-01-22",
  birthType: "TERM",
  gestationalAgeWeeks: null,
  gestationalAgeDays: null,
};

const BUDI: ChildContext = {
  sex: "MALE",
  dateOfBirth: "2026-05-10",
  birthType: "PRETERM",
  gestationalAgeWeeks: 32,
  gestationalAgeDays: 4,
};

const MEASUREMENTS = [
  { measuredAt: "2026-08-22", weightKg: "6.800", lengthHeightCm: "65.20", headCircumferenceCm: "42.00" },
  { measuredAt: "2026-08-29", weightKg: "7.000", lengthHeightCm: "65.80", headCircumferenceCm: "42.40" },
  { measuredAt: "2026-09-05", weightKg: "7.100", lengthHeightCm: "66.30", headCircumferenceCm: "42.70" },
];

describe("buildChartSeries", () => {
  it("menghasilkan satu titik anak per pengukuran", () => {
    const s = buildChartSeries(AISYAH, MEASUREMENTS, "weight-for-age");
    expect(s.childPoints).toHaveLength(3);
    expect(s.childPoints.map((p) => p.value)).toEqual([6.8, 7, 7.1]);
  });

  it("setiap titik anak muncul pada data grafik", () => {
    const s = buildChartSeries(AISYAH, MEASUREMENTS, "weight-for-age");
    const plotted = s.points.filter((p) => p.child !== null);
    expect(plotted).toHaveLength(3);
    expect(plotted.map((p) => p.child)).toEqual([6.8, 7, 7.1]);
  });

  it("titik anak berada pada usia yang benar", () => {
    const s = buildChartSeries(AISYAH, MEASUREMENTS, "weight-for-age");
    // 22 Jan -> 22 Agu = 212 hari
    expect(s.childPoints[0].ageDays).toBe(212);
    expect(s.childPoints[2].ageDays).toBe(226);
  });

  it("titik terurut menurut usia dan kurva SD menaik", () => {
    const s = buildChartSeries(AISYAH, MEASUREMENTS, "weight-for-age");
    for (let i = 1; i < s.points.length; i++) {
      expect(s.points[i].ageDays).toBeGreaterThan(s.points[i - 1].ageDays);
    }
    for (const p of s.points) {
      expect(p.sd3neg).toBeLessThan(p.sd2neg);
      expect(p.sd2neg).toBeLessThan(p.sd0);
      expect(p.sd0).toBeLessThan(p.sd2);
      expect(p.sd2).toBeLessThan(p.sd3);
    }
  });

  it("memakai corrected age untuk bayi prematur", () => {
    const s = buildChartSeries(
      BUDI,
      [{ measuredAt: "2026-09-05", weightKg: "3.200", lengthHeightCm: "49.50", headCircumferenceCm: "34.50" }],
      "weight-for-age",
    );
    expect(s.ageBasis).toBe("corrected");
    // Kronologis 118 hari, prematuritas 52 hari -> 66 hari terkoreksi.
    expect(s.childPoints[0].ageDays).toBe(66);
  });

  it("menyatakan alasan bila indikator tidak pernah dicatat", () => {
    const s = buildChartSeries(
      AISYAH,
      [{ measuredAt: "2026-08-22", weightKg: "6.8", lengthHeightCm: null, headCircumferenceCm: null }],
      "length-for-age",
    );
    expect(s.points).toHaveLength(0);
    expect(s.unavailable).toBeTruthy();
  });

  it("membawa metadata reference", () => {
    const s = buildChartSeries(AISYAH, MEASUREMENTS, "weight-for-age");
    expect(s.reference.name).toBe("WHO Child Growth Standards");
    expect(s.reference.version).toBe("2006");
  });
});
