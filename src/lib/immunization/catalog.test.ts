import { describe, expect, it } from "vitest";
import { catalogVaccine, effectiveMinAgeMonths, weightGateSatisfied } from "./catalog";

describe("effectiveMinAgeMonths", () => {
  const hb0 = catalogVaccine("HB0")!;

  it("HB0 normal saat berat tidak diketahui atau cukup", () => {
    expect(effectiveMinAgeMonths(hb0, null)).toBe(0);
    expect(effectiveMinAgeMonths(hb0, 2000)).toBe(0);
    expect(effectiveMinAgeMonths(hb0, 3000)).toBe(0);
  });

  it("HB0 ditunda ke 1 bulan saat berat lahir < 2000 g", () => {
    expect(effectiveMinAgeMonths(hb0, 1999)).toBe(1);
  });

  it("BCG punya syarat requireCurrentWeight, bukan delayToAge — tidak menggeser minAgeMonths", () => {
    const bcg = catalogVaccine("BCG")!;
    expect(effectiveMinAgeMonths(bcg, 500)).toBe(bcg.minAgeMonths);
  });

  it("vaksin tanpa syarat berat sama sekali tidak terpengaruh", () => {
    const pcv1 = catalogVaccine("PCV1")!;
    expect(effectiveMinAgeMonths(pcv1, 500)).toBe(pcv1.minAgeMonths);
  });
});

describe("weightGateSatisfied", () => {
  const bcg = catalogVaccine("BCG")!;
  const opv1 = catalogVaccine("OPV1")!;
  const pcv1 = catalogVaccine("PCV1")!;
  const term = (birthWeightGrams: number | null) => ({ birthType: "TERM" as const, birthWeightGrams });
  const preterm = (birthWeightGrams: number | null) => ({ birthType: "PRETERM" as const, birthWeightGrams });

  it("BCG: lolos langsung bila berat lahir tidak BBLR (>=2500 g)", () => {
    expect(weightGateSatisfied(bcg, term(2500), 2000)).toBe(true);
  });

  it("BCG: BBLR (<2500 g) tertahan sampai berat saat ini >=2500 g", () => {
    expect(weightGateSatisfied(bcg, term(2000), 2400)).toBe(false);
    expect(weightGateSatisfied(bcg, term(2000), 2500)).toBe(true);
  });

  it("BCG: berat saat ini tidak diketahui -> tidak menahan (konsisten dgn effectiveMinAgeMonths)", () => {
    expect(weightGateSatisfied(bcg, term(2000), null)).toBe(true);
  });

  it("OPV1: hanya berlaku untuk bayi PRETERM, bukan TERM meski berat rendah", () => {
    expect(weightGateSatisfied(opv1, term(1800), 1800)).toBe(true);
  });

  it("OPV1: bayi PRETERM tertahan sampai berat saat ini >2000 g", () => {
    expect(weightGateSatisfied(opv1, preterm(1800), 1900)).toBe(false);
    expect(weightGateSatisfied(opv1, preterm(1800), 2100)).toBe(true);
  });

  it("vaksin tanpa syarat berat (mis. PCV1) selalu lolos", () => {
    expect(weightGateSatisfied(pcv1, preterm(500), 500)).toBe(true);
  });
});
