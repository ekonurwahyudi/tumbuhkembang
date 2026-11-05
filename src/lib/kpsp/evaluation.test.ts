import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { KPSP_FORMS } from "./catalog";
import { kpspAge, kpspResult } from "./evaluation";

const child = { dateOfBirth: "2024-01-01", birthType: "TERM" as const, gestationalAgeWeeks: null, gestationalAgeDays: null };

describe("KPSP 2022", () => {
  it("keeps 16 forms with ten sourced questions each", () => {
    expect(KPSP_FORMS.map((form) => form.ageMonths)).toEqual([3, 6, 9, 12, 15, 18, 21, 24, 30, 36, 42, 48, 54, 60, 66, 72]);
    for (const form of KPSP_FORMS) {
      expect(form.questions).toHaveLength(10);
      expect(form.questions.map((q) => q.key)).toEqual(Array.from({ length: 10 }, (_, i) => String(i + 1)));
      expect(form.questions.every((q) => q.sourcePage > 0 && q.text.length >= 60)).toBe(true);
    }
    expect(KPSP_FORMS.find((f) => f.ageMonths === 72)?.questions[1].text).toContain("Menggambar orang");
  });

  it("rounds only when days exceed 16, always selects the younger form", () => {
    expect(kpspAge(child, "2024-04-17")?.roundedMonths).toBe(3);
    expect(kpspAge(child, "2024-04-17")?.form?.ageMonths).toBe(3);
    expect(kpspAge(child, "2024-04-19")?.roundedMonths).toBe(4);
    expect(kpspAge(child, "2024-04-19")?.form?.ageMonths).toBe(3);
    expect(kpspAge(child, "2030-02-01")?.form).toBeNull();
    expect(kpspAge(child, "2024-02-01")?.form).toBeNull();
  });

  it("corrects prematurity only below chronological 24 months", () => {
    const preterm = { ...child, birthType: "PRETERM" as const, gestationalAgeWeeks: 34, gestationalAgeDays: 0 };
    expect(kpspAge(preterm, "2024-04-01")?.corrected).toBe(true);
    expect(kpspAge(preterm, "2024-04-01")?.form).toBeNull();
    expect(kpspAge(preterm, "2026-01-01")?.corrected).toBe(false);
  });

  it("does not treat unanswered as No or score partial forms", () => {
    expect(kpspResult(Array(9).fill(true))).toBeNull();
    expect(kpspResult([...Array(9).fill(true), null])).toBeNull();
    expect(kpspResult([...Array(9).fill(true), false])?.status).toBe("Sesuai");
    expect(kpspResult([...Array(7).fill(true), ...Array(3).fill(false)])?.status).toBe("Meragukan");
    expect(kpspResult([...Array(6).fill(true), ...Array(4).fill(false)])?.status).toBe("Kemungkinan ada penyimpangan");
  });

  it("ships cropped figures for the ages that have them, pointing at real assets", () => {
    const withFigure = KPSP_FORMS.flatMap((f) => f.questions.filter((q) => q.figure).map((q) => `${f.ageMonths}-${q.key}`));
    expect(withFigure).toEqual(["3-6", "3-7", "3-8", "3-9", "3-10", "6-1", "6-2", "6-3", "6-5", "9-1", "9-9"]);
    for (const form of KPSP_FORMS)
      for (const q of form.questions) {
        if (!q.figure) continue;
        expect(q.illustration).toBe(true);
        expect(q.figure.src).toBe(`/kpsp/item-${form.ageMonths}-${q.key}.webp`);
        expect(existsSync(`public${q.figure.src}`)).toBe(true);
        expect(q.figure.width).toBeGreaterThan(0);
        expect(q.figure.height).toBeGreaterThan(0);
      }
  });
});
