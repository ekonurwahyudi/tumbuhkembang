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

  it("memakai Fenton pada sumbu PMA sebelum bayi prematur mencapai term", () => {
    // Budi lahir 32w4d: 52 hari prematuritas. Diukur 30 hari setelah lahir,
    // usia terkoreksinya masih -22 hari — WHO tidak berlaku, Fenton berlaku.
    const s = buildChartSeries(
      BUDI,
      [{ measuredAt: "2026-06-09", weightKg: "1.900", lengthHeightCm: null, headCircumferenceCm: null }],
      "weight-for-age",
    );
    expect(s.ageBasis).toBe("postmenstrual");
    expect(s.reference.name).toBe("Fenton Preterm Growth Chart");
    // PMA = 228 hari gestasi + 30 hari kronologis = 258 hari (36w6d).
    expect(s.childPoints[0].ageDays).toBe(258);
    expect(s.points.some((p) => p.child !== null)).toBe(true);
  });

  it("menyatakan reference tidak tersedia bila Fenton dimatikan pengguna", () => {
    const s = buildChartSeries(
      { ...BUDI, useFenton: false },
      [{ measuredAt: "2026-06-09", weightKg: "1.900", lengthHeightCm: null, headCircumferenceCm: null }],
      "weight-for-age",
    );
    expect(s.childPoints).toHaveLength(0);
    expect(s.points).toHaveLength(0);
    expect(s.unavailable).toMatch(/pascamenstruasi/);
  });

  it("satu grafik memakai satu sumbu usia saja", () => {
    // Riwayat yang melintasi batas: satu pengukuran di dalam cakupan Fenton,
    // satu sesudahnya. Yang digambar adalah sumbu pengukuran terbaru.
    const s = buildChartSeries(
      BUDI,
      [
        { measuredAt: "2026-06-09", weightKg: "1.900", lengthHeightCm: null, headCircumferenceCm: null },
        { measuredAt: "2026-09-05", weightKg: "3.200", lengthHeightCm: null, headCircumferenceCm: null },
      ],
      "weight-for-age",
    );
    expect(s.ageBasis).toBe("corrected");
    expect(s.childPoints).toHaveLength(1);
    expect(s.childPoints[0].ageDays).toBe(66);
  });

  it("prematur di atas batas koreksi AAP kembali ke usia kronologis", () => {
    // Batas koreksi 3 tahun kronologis. Dua sisi batas, supaya bukan cuma
    // "selalu corrected" yang lolos: footer halaman membaca ageBasis ini.
    const early = buildChartSeries(
      BUDI,
      [{ measuredAt: "2027-05-10", weightKg: "9.500", lengthHeightCm: null, headCircumferenceCm: null }],
      "weight-for-age",
    );
    expect(early.ageBasis).toBe("corrected");

    const late = buildChartSeries(
      BUDI,
      [{ measuredAt: "2029-09-05", weightKg: "14.000", lengthHeightCm: null, headCircumferenceCm: null }],
      "weight-for-age",
    );
    expect(late.ageBasis).toBe("chronological");
    expect(late.childPoints).toHaveLength(1);
  });
});
