/**
 * Uji kalkulator asupan terhadap angka yang dinyatakan AAP, bukan sekadar
 * memastikan fungsi berjalan.
 *
 * Aturan AAP: ~75 mL formula per hari untuk setiap 453 g berat badan,
 * maksimum rata-rata ~960 mL per 24 jam.
 */
import { describe, expect, it } from "vitest";
import {
  AAP_DAILY_MAX_ML,
  AAP_ML_PER_POUND_PER_DAY,
  POUND_IN_GRAMS,
  estimateDailyFormula,
} from "./calculator";

const TERM = {
  dateOfBirth: "2026-06-23",
  birthType: "TERM" as const,
  gestationalAgeWeeks: null,
  gestationalAgeDays: null,
  asOf: "2026-09-23", // usia 92 hari, sekitar 3 bulan
};

describe("estimateDailyFormula — aturan AAP", () => {
  it("tepat 1 pon menghasilkan 75 ml", () => {
    const r = estimateDailyFormula({ ...TERM, weightKg: POUND_IN_GRAMS / 1000 });
    expect(r.available).toBe(true);
    if (!r.available) return;
    expect(r.fromWeightMl).toBe(AAP_ML_PER_POUND_PER_DAY);
  });

  it("bayi 5 kg menghasilkan sekitar 828 ml", () => {
    // 5 kg = 5000/453 = 11,04 pon -> 11,04 x 75 = 828 ml
    const r = estimateDailyFormula({ ...TERM, weightKg: 5 });
    expect(r.available).toBe(true);
    if (!r.available) return;
    expect(r.fromWeightMl).toBe(828);
    expect(r.cappedByDailyMax).toBe(false);
  });

  it("menerapkan batas maksimum harian AAP", () => {
    // 8 kg = 17,66 pon -> 1325 ml, melebihi batas 960 ml.
    const r = estimateDailyFormula({ ...TERM, weightKg: 8 });
    expect(r.available).toBe(true);
    if (!r.available) return;
    expect(r.fromWeightMl).toBeGreaterThan(AAP_DAILY_MAX_ML);
    expect(r.estimatedMl).toBe(AAP_DAILY_MAX_ML);
    expect(r.cappedByDailyMax).toBe(true);
  });

  it("naik seiring berat badan", () => {
    const a = estimateDailyFormula({ ...TERM, weightKg: 3 });
    const b = estimateDailyFormula({ ...TERM, weightKg: 4 });
    if (!a.available || !b.available) throw new Error("harusnya tersedia");
    expect(b.estimatedMl).toBeGreaterThan(a.estimatedMl);
  });

  it("membawa metadata reference yang dapat diaudit", () => {
    const r = estimateDailyFormula({ ...TERM, weightKg: 5 });
    if (!r.available) throw new Error("harusnya tersedia");
    expect(r.reference.name).toContain("American Academy of Pediatrics");
    expect(r.reference.source).toContain("healthychildren.org");
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

  it("tidak mengestimasi bayi prematur", () => {
    const r = estimateDailyFormula({
      weightKg: 3,
      dateOfBirth: "2026-06-23",
      birthType: "PRETERM",
      gestationalAgeWeeks: 32,
      gestationalAgeDays: 4,
      asOf: "2026-09-23",
    });
    expect(r.available).toBe(false);
    if (r.available) return;
    expect(r.reason).toBe("PRETERM");
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
