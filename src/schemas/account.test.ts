import { describe, expect, it } from "vitest";
import { adminEditParentSchema, passwordChangeSchema, profileSchema } from "./account";

describe("profileSchema", () => {
  it("menerima profil lengkap dan tanpa telepon", () => {
    expect(
      profileSchema.parse({ name: "Budi", email: "Budi@Ex.COM", phone: "+628123456789" }),
    ).toMatchObject({ email: "budi@ex.com" });
    expect(profileSchema.parse({ name: "Budi", email: "budi@ex.com", phone: "" }).phone).toBe("");
  });

  it("menolak telepon tidak valid dan nama pendek", () => {
    expect(
      profileSchema.safeParse({ name: "Budi", email: "budi@ex.com", phone: "081234" }).success,
    ).toBe(false);
    expect(profileSchema.safeParse({ name: "B", email: "budi@ex.com" }).success).toBe(false);
  });
});

describe("adminEditParentSchema", () => {
  const base = { name: "Budi", email: "budi@ex.com", phone: "" };

  it("menerima ketiga tingkat keanggotaan", () => {
    for (const membershipTier of ["FREEMIUM", "VIP", "VVIP"] as const) {
      expect(adminEditParentSchema.parse({ ...base, membershipTier }).membershipTier).toBe(
        membershipTier,
      );
    }
  });

  it("menolak tier karangan dan tier yang tidak dikirim", () => {
    expect(adminEditParentSchema.safeParse({ ...base, membershipTier: "SUPERADMIN" }).success).toBe(
      false,
    );
    expect(adminEditParentSchema.safeParse({ ...base, membershipTier: "vip" }).success).toBe(false);
    // Nilai lama sebelum rename — ditolak, bukan diam-diam diterima.
    expect(adminEditParentSchema.safeParse({ ...base, membershipTier: "FREE" }).success).toBe(
      false,
    );
    expect(adminEditParentSchema.safeParse(base).success).toBe(false);
  });

  it("tidak membocorkan tier lewat profileSchema milik halaman Profil", () => {
    // Penjaga eskalasi: kalau suatu saat tier ikut masuk profileSchema, user bisa
    // menaikkan dirinya sendiri lewat form Profil. Tes ini gagal lebih dulu.
    const parsed = profileSchema.parse({ ...base, membershipTier: "VVIP" });
    expect(parsed).not.toHaveProperty("membershipTier");
  });
});

describe("passwordChangeSchema", () => {
  it("menolak konfirmasi tidak cocok dan sandi kurang dari 8 karakter", () => {
    expect(
      passwordChangeSchema.safeParse({
        currentPassword: "Rahasia123",
        newPassword: "SandiBaru1",
        confirmPassword: "beda",
      }).success,
    ).toBe(false);
    expect(
      passwordChangeSchema.safeParse({
        newPassword: "Pendek1",
        confirmPassword: "Pendek1",
      }).success,
    ).toBe(false);
  });

  it("memakai aturan yang sama dengan register (huruf besar/kecil/angka)", () => {
    // Tanpa huruf besar, tanpa angka — keduanya ditolak seperti saat mendaftar.
    for (const pw of ["sandibaru1", "SandiBaruSaja"]) {
      expect(passwordChangeSchema.safeParse({ newPassword: pw, confirmPassword: pw }).success).toBe(
        false,
      );
    }
  });

  it("menolak sandi baru yang sama dengan sandi lama", () => {
    expect(
      passwordChangeSchema.safeParse({
        currentPassword: "SandiLama1",
        newPassword: "SandiLama1",
        confirmPassword: "SandiLama1",
      }).success,
    ).toBe(false);
  });

  it("menerima sandi baru tanpa sandi saat ini (akun Google)", () => {
    expect(
      passwordChangeSchema.parse({
        newPassword: "SandiBaru1",
        confirmPassword: "SandiBaru1",
      }),
    ).toBeDefined();
  });
});
