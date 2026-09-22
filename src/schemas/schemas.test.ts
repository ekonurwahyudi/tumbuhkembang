import { describe, expect, it } from "vitest";
import { childSchema } from "./child";
import { measurementSchema } from "./measurement";
import { registerSchema } from "./auth";

const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

describe("childSchema", () => {
  it("menolak TERM yang menyertakan gestational age (dinormalisasi jadi null)", () => {
    const r = childSchema.parse({
      name: "Aisyah",
      sex: "FEMALE",
      dateOfBirth: yesterday(),
      birthType: "TERM",
      gestationalAgeWeeks: 32,
      gestationalAgeDays: 4,
    });
    expect(r.gestationalAgeWeeks).toBeNull();
    expect(r.gestationalAgeDays).toBeNull();
  });

  it("mewajibkan gestational age untuk PRETERM", () => {
    const r = childSchema.safeParse({
      name: "Budi",
      sex: "MALE",
      dateOfBirth: yesterday(),
      birthType: "PRETERM",
    });
    expect(r.success).toBe(false);
  });

  it("menyimpan minggu dan hari terpisah, bukan 32.4", () => {
    const r = childSchema.parse({
      name: "Budi",
      sex: "MALE",
      dateOfBirth: yesterday(),
      birthType: "PRETERM",
      gestationalAgeWeeks: 32,
      gestationalAgeDays: 4,
    });
    expect(r.gestationalAgeWeeks).toBe(32);
    expect(r.gestationalAgeDays).toBe(4);
  });

  it("menolak hari gestasi di luar 0-6", () => {
    for (const days of [-1, 7]) {
      const r = childSchema.safeParse({
        name: "Budi",
        sex: "MALE",
        dateOfBirth: yesterday(),
        birthType: "PRETERM",
        gestationalAgeWeeks: 32,
        gestationalAgeDays: days,
      });
      expect(r.success).toBe(false);
    }
  });

  it("menolak tanggal lahir di masa depan", () => {
    const r = childSchema.safeParse({
      name: "Budi",
      sex: "MALE",
      dateOfBirth: tomorrow(),
      birthType: "TERM",
    });
    expect(r.success).toBe(false);
  });
});

describe("measurementSchema", () => {
  it("menerima pengukuran parsial dan mengubah string kosong jadi null", () => {
    const r = measurementSchema.parse({
      measuredAt: yesterday(),
      weightKg: "7.40",
      lengthHeightCm: "",
      headCircumferenceCm: undefined,
      notes: "",
    });
    expect(r.weightKg).toBe(7.4);
    expect(r.lengthHeightCm).toBeNull();
    expect(r.headCircumferenceCm).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("menolak record tanpa satu pun nilai", () => {
    const r = measurementSchema.safeParse({
      measuredAt: yesterday(),
      weightKg: "",
      lengthHeightCm: "",
      headCircumferenceCm: "",
    });
    expect(r.success).toBe(false);
  });

  it("menolak nilai nol, negatif, dan non-angka", () => {
    for (const w of ["0", "-1", "abc"]) {
      const r = measurementSchema.safeParse({ measuredAt: yesterday(), weightKg: w });
      expect(r.success, `weight=${w}`).toBe(false);
    }
  });

  it("menolak tanggal pengukuran di masa depan", () => {
    const r = measurementSchema.safeParse({ measuredAt: tomorrow(), weightKg: 7 });
    expect(r.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("menolak konfirmasi password yang tidak sama", () => {
    const r = registerSchema.safeParse({
      name: "Eko",
      email: "eko@example.com",
      password: "Rahasia123",
      confirmPassword: "Rahasia124",
    });
    expect(r.success).toBe(false);
  });

  it("menolak password lemah", () => {
    const r = registerSchema.safeParse({
      name: "Eko",
      email: "eko@example.com",
      password: "rahasia",
      confirmPassword: "rahasia",
    });
    expect(r.success).toBe(false);
  });

  it("menormalkan email jadi huruf kecil", () => {
    const r = registerSchema.parse({
      name: "Eko",
      email: "  EKO@Example.COM ",
      password: "Rahasia123",
      confirmPassword: "Rahasia123",
    });
    expect(r.email).toBe("eko@example.com");
  });
});
