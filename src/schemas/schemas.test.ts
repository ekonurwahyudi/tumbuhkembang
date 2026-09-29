import { describe, expect, it } from "vitest";
import { childSchema } from "./child";
import { measurementSchema } from "./measurement";
import { registerSchema } from "./auth";
import { vaccinationSchema } from "./vaccination";
import { reminderSchema } from "./reminder";
import { registryClaimSchema, registryItemSchema, registryTrackingSchema } from "./registry";
import { isNotFuture, isValidYMD } from "./date";

/**
 * Helper memakai kalender LOKAL, bukan toISOString() (yang memberi tanggal UTC).
 * Di zona waktu timur seperti WIB, tanggal UTC bisa tertinggal satu hari dan
 * membuat test lolos padahal validasinya rusak.
 */
const shiftDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const yesterday = () => shiftDays(-1);
const tomorrow = () => shiftDays(1);
const today = () => shiftDays(0);

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

  it("menerima berat lahir dalam rentang, opsional, dan null", () => {
    const base = { name: "Budi", sex: "MALE" as const, dateOfBirth: yesterday(), birthType: "TERM" as const };
    expect(childSchema.safeParse({ ...base, birthWeightGrams: 1800 }).success).toBe(true);
    expect(childSchema.safeParse({ ...base, birthWeightGrams: null }).success).toBe(true);
    expect(childSchema.safeParse(base).success).toBe(true);
    expect(childSchema.safeParse({ ...base, birthWeightGrams: 100 }).success).toBe(false);
    expect(childSchema.safeParse({ ...base, birthWeightGrams: 9000 }).success).toBe(false);
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
  const base = {
    name: "Eko",
    email: "eko@example.com",
    password: "Rahasia123",
    confirmPassword: "Rahasia123",
    terms: true,
  };

  it("menolak konfirmasi password yang tidak sama", () => {
    const r = registerSchema.safeParse({ ...base, confirmPassword: "Rahasia124" });
    expect(r.success).toBe(false);
  });

  it("menolak ketentuan yang belum disetujui", () => {
    const r = registerSchema.safeParse({ ...base, terms: false });
    expect(r.success).toBe(false);
  });

  it("menolak password lemah", () => {
    const r = registerSchema.safeParse({ ...base, password: "rahasia", confirmPassword: "rahasia" });
    expect(r.success).toBe(false);
  });

  it("menormalkan email jadi huruf kecil", () => {
    const r = registerSchema.parse({ ...base, email: "  EKO@Example.COM " });
    expect(r.email).toBe("eko@example.com");
  });
});

describe("vaccinationSchema", () => {
  it("menerima entri katalog tanpa customName", () => {
    const r = vaccinationSchema.safeParse({
      catalogKey: "BCG",
      givenAt: yesterday(),
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe("BCG");
  });

  it("menolak catalogKey yang tidak dikenal", () => {
    const r = vaccinationSchema.safeParse({ catalogKey: "TIDAK_ADA", givenAt: yesterday() });
    expect(r.success).toBe(false);
  });

  it("mewajibkan customName saat catalogKey kosong", () => {
    const r = vaccinationSchema.safeParse({ catalogKey: null, givenAt: yesterday() });
    expect(r.success).toBe(false);
  });

  it("menerima entri custom dengan customName", () => {
    const r = vaccinationSchema.safeParse({
      catalogKey: null,
      customName: "Vaksin Influenza",
      givenAt: yesterday(),
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe("Vaksin Influenza");
  });

  it("memetakan nama yang cocok katalog ke catalogKey-nya", () => {
    const r = vaccinationSchema.safeParse({
      catalogKey: null,
      customName: "bcg",
      givenAt: yesterday(),
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.catalogKey).toBe("BCG");
      expect(r.data.name).toBe("BCG");
    }
  });

  it("menolak tanggal pemberian di masa depan", () => {
    const r = vaccinationSchema.safeParse({ catalogKey: "BCG", givenAt: tomorrow() });
    expect(r.success).toBe(false);
  });
});

describe("validasi tanggal dan zona waktu", () => {
  it("menerima tanggal hari ini", () => {
    expect(
      childSchema.safeParse({
        name: "Anak",
        sex: "MALE",
        dateOfBirth: today(),
        birthType: "TERM",
      }).success,
    ).toBe(true);
    expect(
      measurementSchema.safeParse({ measuredAt: today(), weightKg: 7 }).success,
    ).toBe(true);
  });

  it("menolak hari esok pada kedua schema", () => {
    expect(
      childSchema.safeParse({
        name: "Anak",
        sex: "MALE",
        dateOfBirth: tomorrow(),
        birthType: "TERM",
      }).success,
    ).toBe(false);
    expect(
      measurementSchema.safeParse({ measuredAt: tomorrow(), weightKg: 7 }).success,
    ).toBe(false);
  });

  it("tidak terpengaruh zona waktu", () => {
    // Regresi: new Date("YYYY-MM-DD") diurai sebagai UTC lalu dibandingkan dengan
    // waktu lokal, sehingga di WIB (UTC+7) tanggal besok sempat lolos validasi.
    const jamSubuh = new Date(2026, 8, 23, 3, 59); // 23 Sep 2026 03:59 waktu lokal
    expect(isNotFuture("2026-09-23", jamSubuh)).toBe(true);
    expect(isNotFuture("2026-09-24", jamSubuh)).toBe(false);

    const jamMalam = new Date(2026, 8, 23, 23, 30);
    expect(isNotFuture("2026-09-23", jamMalam)).toBe(true);
    expect(isNotFuture("2026-09-24", jamMalam)).toBe(false);
  });

  it("menolak tanggal yang tidak ada di kalender", () => {
    expect(isValidYMD("2026-02-31")).toBe(false);
    expect(isValidYMD("2026-13-01")).toBe(false);
    expect(isValidYMD("2024-02-29")).toBe(true); // kabisat
    expect(isValidYMD("2026-02-29")).toBe(false);
    expect(
      measurementSchema.safeParse({ measuredAt: "2026-02-31", weightKg: 7 }).success,
    ).toBe(false);
  });
});

describe("reminderSchema", () => {
  const base = { catalogKey: "BCG", remindOn: tomorrow(), remindTime: "09:00" };

  it("menerima hari ini dan masa depan, menolak masa lalu", () => {
    // Kebalikan dari givenAt: mengingatkan sesuatu yang sudah lewat tidak berguna.
    expect(reminderSchema.safeParse({ ...base, remindOn: today() }).success).toBe(true);
    expect(reminderSchema.safeParse(base).success).toBe(true);
    expect(reminderSchema.safeParse({ ...base, remindOn: yesterday() }).success).toBe(false);
  });

  it("menolak jam dan tanggal yang tidak ada", () => {
    expect(reminderSchema.safeParse({ ...base, remindTime: "25:00" }).success).toBe(false);
    expect(reminderSchema.safeParse({ ...base, remindTime: "09:60" }).success).toBe(false);
    expect(reminderSchema.safeParse({ ...base, remindTime: "9:00" }).success).toBe(false);
    expect(reminderSchema.safeParse({ ...base, remindOn: "2027-02-31" }).success).toBe(false);
  });

  it("menolak catalogKey di luar katalog", () => {
    expect(reminderSchema.safeParse({ ...base, catalogKey: "TIDAK_ADA" }).success).toBe(false);
  });

  it("menormalkan catatan kosong jadi null", () => {
    expect(reminderSchema.parse({ ...base, notes: "   " }).notes).toBeNull();
    expect(reminderSchema.parse({ ...base, notes: " Posyandu " }).notes).toBe("Posyandu");
  });
});

describe("registryItemSchema", () => {
  const base = {
    name: "Stroller kabin",
    priority: "NORMAL",
    category: "TRANSPORT",
    desiredQty: "1",
  };

  it("menerima tautan dari toko yang sesuai, menolak host lain", () => {
    const ok = registryItemSchema.parse({
      ...base,
      urlShopee: " https://shopee.co.id/product/1 ",
      urlTokopedia: "https://www.tokopedia.com/toko/barang",
      urlTiktok: "https://www.tiktok.com/@toko/video/1",
    });
    expect(ok.urlShopee).toBe("https://shopee.co.id/product/1");

    // Inti aturannya: wishlist publik tidak boleh jadi papan tautan ke mana saja.
    expect(
      registryItemSchema.safeParse({ ...base, urlTokopedia: "https://google.com/cari" }).success,
    ).toBe(false);
    expect(registryItemSchema.safeParse({ ...base, urlShopee: "bukan-url" }).success).toBe(false);
    expect(
      registryItemSchema.safeParse({ ...base, urlTiktok: "javascript:alert(1)" }).success,
    ).toBe(false);
  });

  it("menormalkan teks dan tautan kosong jadi null", () => {
    const r = registryItemSchema.parse({ ...base, description: "  ", note: "", urlShopee: "" });
    expect(r.description).toBeNull();
    expect(r.note).toBeNull();
    expect(r.urlShopee).toBeNull();
  });

  it("menolak harga maksimal yang lebih kecil dari minimal, pada field yang benar", () => {
    const r = registryItemSchema.safeParse({ ...base, priceMin: "900000", priceMax: "500000" });
    expect(r.success).toBe(false);
    // Path harus sama dengan atribut name input, kalau tidak pesannya tidak muncul.
    expect(r.success === false && r.error.issues[0].path[0]).toBe("priceMax");
    expect(registryItemSchema.safeParse({ ...base, priceMin: "500000", priceMax: "900000" }).success).toBe(true);
    // Satu sisi saja tetap boleh.
    expect(registryItemSchema.safeParse({ ...base, priceMax: "900000" }).success).toBe(true);
  });

  it("membatasi jumlah diinginkan 1..99", () => {
    expect(registryItemSchema.safeParse({ ...base, desiredQty: "0" }).success).toBe(false);
    expect(registryItemSchema.safeParse({ ...base, desiredQty: "100" }).success).toBe(false);
    expect(registryItemSchema.safeParse({ ...base, desiredQty: "1.5" }).success).toBe(false);
    expect(registryItemSchema.parse({ ...base, desiredQty: "3" }).desiredQty).toBe(3);
  });

  it("checkbox yang tidak dikirim berarti false, bukan undefined", () => {
    const r = registryItemSchema.parse(base);
    expect(r.isPublic).toBe(false);
    expect(r.allowGroup).toBe(false);
    expect(registryItemSchema.parse({ ...base, isPublic: "on" }).isPublic).toBe(true);
  });

  it("menolak childId yang bukan uuid", () => {
    expect(registryItemSchema.safeParse({ ...base, childId: "bukan-uuid" }).success).toBe(false);
    expect(registryItemSchema.parse({ ...base, childId: "" }).childId).toBeNull();
  });

  it("membatasi panjang nama dan catatan", () => {
    expect(registryItemSchema.safeParse({ ...base, name: "" }).success).toBe(false);
    expect(registryItemSchema.safeParse({ ...base, name: "x".repeat(121) }).success).toBe(false);
    expect(registryItemSchema.safeParse({ ...base, note: "x".repeat(301) }).success).toBe(false);
  });
});

describe("registryClaimSchema", () => {
  const base = { claimerName: "Tante Rina", qty: "1" };

  it("menolak nomor resi dengan karakter aneh", () => {
    expect(registryClaimSchema.parse({ ...base, trackingNumber: " JNE 012-345.6 " }).trackingNumber).toBe(
      "JNE 012-345.6",
    );
    expect(registryClaimSchema.safeParse({ ...base, trackingNumber: "<script>" }).success).toBe(false);
    expect(registryClaimSchema.safeParse({ ...base, trackingNumber: "x".repeat(51) }).success).toBe(false);
    // Opsional: kosong berarti belum dikirim, bukan tidak valid.
    expect(registryClaimSchema.parse({ ...base, trackingNumber: "" }).trackingNumber).toBeNull();
  });

  it("membatasi nama pengklaim — ini kiriman dari orang tanpa sesi", () => {
    expect(registryClaimSchema.safeParse({ ...base, claimerName: "A" }).success).toBe(false);
    expect(registryClaimSchema.safeParse({ ...base, claimerName: "x".repeat(81) }).success).toBe(false);
    expect(registryClaimSchema.safeParse(base).success).toBe(true);
  });

  it("registryTrackingSchema mewajibkan resi, berbeda dari saat klaim", () => {
    expect(registryTrackingSchema.safeParse({ trackingNumber: "" }).success).toBe(false);
    expect(registryTrackingSchema.safeParse({ trackingNumber: "ab" }).success).toBe(false);
    expect(registryTrackingSchema.parse({ trackingNumber: " JNE 123 " }).trackingNumber).toBe("JNE 123");
  });
});
