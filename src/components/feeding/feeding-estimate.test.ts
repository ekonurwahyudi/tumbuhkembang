import { describe, expect, it } from "vitest";
import { intakePercent } from "./feeding-estimate";

describe("intakePercent", () => {
  it("menghitung persentase tercatat terhadap estimasi", () => {
    expect(intakePercent(240, 480)).toBe(50);
    expect(intakePercent(480, 480)).toBe(100);
  });

  it("dibatasi 0–100 agar cincin tidak melewati putaran penuh", () => {
    expect(intakePercent(900, 480)).toBe(100);
    expect(intakePercent(-10, 480)).toBe(0);
  });

  it("mengembalikan 0 ketika estimasi nol atau tidak valid", () => {
    expect(intakePercent(100, 0)).toBe(0);
    expect(intakePercent(100, Number.NaN)).toBe(0);
  });
});
