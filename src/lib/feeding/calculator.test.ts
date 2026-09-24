/**
 * Uji kalkulator asupan terhadap angka bersumber (ESPGHAN untuk prematur,
 * Children's Health Queensland untuk cukup bulan), bukan sekadar memastikan
 * fungsi berjalan. Lihat docs/medical-references/feeding.md.
 */
import { describe, expect, it } from "vitest";
import {
  PRETERM_ML_PER_KG_MAX,
  PRETERM_ML_PER_KG_MIN,
  TERM_ML_PER_KG_3TO6MONTHS,
  TERM_ML_PER_KG_5DAYS_TO_3MONTHS,
  estimateDailyFormula,
} from "./calculator";

const TERM = {
  dateOfBirth: "2026-08-01",
  birthType: "TERM" as const,
  gestationalAgeWeeks: null,
  gestationalAgeDays: null,
  asOf: "2026-09-01", // usia 31 hari — dalam tier 5 hari–3 bulan
};

describe("estimateDailyFormula — bayi prematur (ESPGHAN 150–180 mL/kg)", () => {
  it("menghitung rentang batas bawah dan atas dari berat badan", () => {
    const r = estimateDailyFormula({
      weightKg: 3,
      dateOfBirth: "2026-08-01",
      birthType: "PRETERM",
      gestationalAgeWeeks: 32,
      gestationalAgeDays: 0,
      asOf: "2026-09-01",
    });
    expect(r.available).toBe(true);
    if (!r.available) return;
    expect(r.estimatedMl).toBe(3 * PRETERM_ML_PER_KG_MIN);
    expect(r.estimatedMlMax).toBe(3 * PRETERM_ML_PER_KG_MAX);
    expect(r.reference.name).toContain("ESPGHAN");
  });
});

describe("estimateDailyFormula — bayi cukup bulan (Children's Health Queensland)", () => {
  it("150 mL/kg untuk usia 5 hari–3 bulan", () => {
    const r = estimateDailyFormula({ ...TERM, weightKg: 4 });
    expect(r.available).toBe(true);
    if (!r.available) return;
    expect(r.estimatedMl).toBe(4 * TERM_ML_PER_KG_5DAYS_TO_3MONTHS);
    expect(r.estimatedMlMax).toBeUndefined();
    expect(r.reference.name).toContain("Queensland");
  });

  it("120 mL/kg untuk usia 3–6 bulan", () => {
    const r = estimateDailyFormula({
      ...TERM,
      weightKg: 6,
      dateOfBirth: "2026-05-01",
      asOf: "2026-09-01", // usia 123 hari, sekitar 4 bulan
    });
    expect(r.available).toBe(true);
    if (!r.available) return;
    expect(r.estimatedMl).toBe(6 * TERM_ML_PER_KG_3TO6MONTHS);
  });

  it("naik seiring berat badan", () => {
    const a = estimateDailyFormula({ ...TERM, weightKg: 3 });
    const b = estimateDailyFormula({ ...TERM, weightKg: 4 });
    if (!a.available || !b.available) throw new Error("harusnya tersedia");
    expect(b.estimatedMl).toBeGreaterThan(a.estimatedMl);
  });
});

describe("estimateDailyFormula — kapan menolak memberi angka", () => {
  it("tanpa berat badan tidak menebak", () => {
    const r = estimateDailyFormula({ ...TERM, weightKg: null });
    expect(r.available).toBe(false);
    if (r.available) return;
    expect(r.reason).toBe("NO_WEIGHT");
  });

  it("menolak berat nol atau negatif", () => {
    for (const w of [0, -1]) {
      const r = estimateDailyFormula({ ...TERM, weightKg: w });
      expect(r.available, `berat ${w}`).toBe(false);
    }
  });

  it("tidak mengestimasi usia di bawah 5 hari, prematur maupun cukup bulan", () => {
    const term = estimateDailyFormula({
      ...TERM,
      weightKg: 3,
      dateOfBirth: "2026-08-30",
      asOf: "2026-09-01", // usia 2 hari
    });
    expect(term.available).toBe(false);
    if (term.available) return;
    expect(term.reason).toBe("NEWBORN_RAMPING");

    const preterm = estimateDailyFormula({
      weightKg: 2,
      dateOfBirth: "2026-08-30",
      birthType: "PRETERM",
      gestationalAgeWeeks: 30,
      gestationalAgeDays: 0,
      asOf: "2026-09-01",
    });
    expect(preterm.available).toBe(false);
    if (preterm.available) return;
    expect(preterm.reason).toBe("NEWBORN_RAMPING");
  });

  it("berhenti pada usia sekitar 6 bulan", () => {
    // 182 hari masih masuk, 183 hari sudah di luar.
    const masuk = estimateDailyFormula({
      ...TERM,
      weightKg: 7,
      dateOfBirth: "2026-03-25",
      asOf: "2026-09-23",
    });
    expect(masuk.available).toBe(true);

    const luar = estimateDailyFormula({
      ...TERM,
      weightKg: 7,
      dateOfBirth: "2026-03-24",
      asOf: "2026-09-23",
    });
    expect(luar.available).toBe(false);
    if (luar.available) return;
    expect(luar.reason).toBe("AGE_OUT_OF_RANGE");
  });

  it("menolak tanggal lahir di masa depan", () => {
    const r = estimateDailyFormula({
      ...TERM,
      weightKg: 3,
      dateOfBirth: "2026-10-01",
      asOf: "2026-09-23",
    });
    expect(r.available).toBe(false);
  });
});
