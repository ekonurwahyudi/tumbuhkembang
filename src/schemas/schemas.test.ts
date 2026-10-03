import { describe, expect, it } from "vitest";
import { childSchema } from "./child";
import { measurementSchema } from "./measurement";
import { registerSchema } from "./auth";
import { vaccinationSchema } from "./vaccination";
import { reminderSchema } from "./reminder";
import {
  registryClaimSchema,
  registryItemSchema,
  registryTrackingSchema,
  shippingSchema,
  tidyText,
} from "./registry";
import { discountPercent, shopProductSchema } from "./shop";
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
    const base = {
      name: "Budi",
      sex: "MALE" as const,
      dateOfBirth: yesterday(),
      birthType: "TERM" as const,
    };
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
    const r = registerSchema.safeParse({
      ...base,
      password: "rahasia",
      confirmPassword: "rahasia",
    });
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
    expect(measurementSchema.safeParse({ measuredAt: today(), weightKg: 7 }).success).toBe(true);
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
    expect(measurementSchema.safeParse({ measuredAt: tomorrow(), weightKg: 7 }).success).toBe(
      false,
    );
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
    expect(measurementSchema.safeParse({ measuredAt: "2026-02-31", weightKg: 7 }).success).toBe(
      false,
    );
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
    expect(
      registryItemSchema.safeParse({ ...base, priceMin: "500000", priceMax: "900000" }).success,
    ).toBe(true);
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
    expect(
      registryClaimSchema.parse({ ...base, trackingNumber: " JNE 012-345.6 " }).trackingNumber,
    ).toBe("JNE 012-345.6");
    expect(registryClaimSchema.safeParse({ ...base, trackingNumber: "<script>" }).success).toBe(
      false,
    );
    expect(registryClaimSchema.safeParse({ ...base, trackingNumber: "x".repeat(51) }).success).toBe(
      false,
    );
    // Opsional: kosong berarti belum dikirim, bukan tidak valid.
    expect(registryClaimSchema.parse({ ...base, trackingNumber: "" }).trackingNumber).toBeNull();
  });

  it("membatasi nama pengklaim — ini kiriman dari orang tanpa sesi", () => {
    expect(registryClaimSchema.safeParse({ ...base, claimerName: "A" }).success).toBe(false);
    expect(registryClaimSchema.safeParse({ ...base, claimerName: "x".repeat(81) }).success).toBe(
      false,
    );
    expect(registryClaimSchema.safeParse(base).success).toBe(true);
  });

  it("registryTrackingSchema tidak mewajibkan resi — foto barang adalah bukti lain", () => {
    // Kosong berarti "hapus resinya", bukan error: yang menjaga agar klaim tidak
    // berakhir tanpa bukti apa pun adalah UI-nya, bukan schema ini.
    expect(registryTrackingSchema.parse({ trackingNumber: "" }).trackingNumber).toBeNull();
    expect(registryTrackingSchema.parse({ trackingNumber: " JNE 123 " }).trackingNumber).toBe(
      "JNE 123",
    );
    expect(registryTrackingSchema.safeParse({ trackingNumber: "<script>" }).success).toBe(false);
  });
});

describe("shippingSchema", () => {
  const base = {
    shipName: "Ibu Rafa",
    shipPhone: "081234567890",
    shipProvince: "JAWA TENGAH",
    shipCity: "KABUPATEN DEMAK",
    shipDistrict: "WEDUNG",
    shipAddress: "Jl. Melati No. 12, RT 03 / RW 05",
  };

  const errorPaths = (input: unknown) => {
    const res = shippingSchema.safeParse(input);
    if (res.success) return [];
    return res.error.issues.map((i) => i.path.join("."));
  };

  it("alamat wajib lengkap — tiap bagian yang hilang menghasilkan errornya sendiri", () => {
    expect(shippingSchema.safeParse(base).success).toBe(true);

    for (const key of Object.keys(base) as (keyof typeof base)[]) {
      expect(errorPaths({ ...base, [key]: "" })).toContain(key);
    }
  });

  it("nomor HP harus nomor HP Indonesia, bukan sembarang angka", () => {
    expect(shippingSchema.safeParse({ ...base, shipPhone: "0212345678" }).success).toBe(false);
    expect(shippingSchema.safeParse({ ...base, shipPhone: "bukan angka" }).success).toBe(false);
    expect(shippingSchema.safeParse({ ...base, shipPhone: "+6281234567890" }).success).toBe(true);
  });

  it("alamat terlalu pendek ditolak dan yang lolos dirapikan", () => {
    expect(shippingSchema.safeParse({ ...base, shipAddress: "Jl. A" }).success).toBe(false);
    expect(
      shippingSchema.parse({ ...base, shipAddress: "Jl.   Melati  12\n\n\n\nRT 03" }).shipAddress,
    ).toBe("Jl. Melati 12\n\nRT 03");
  });

  it("rekening opsional, kecuali dinyalakan — lalu ketiganya wajib", () => {
    // Mati: rekening kosong tidak jadi masalah, dan tidak ada yang ditampilkan.
    const off = shippingSchema.parse(base);
    expect(off.bankPublic).toBe(false);
    expect(off.bankName).toBeNull();

    // Nyala tapi kosong: tiga error, satu per field, bukan satu error umum.
    expect(errorPaths({ ...base, bankPublic: true })).toEqual(
      expect.arrayContaining(["bankName", "bankHolder", "bankAccount"]),
    );

    const on = shippingSchema.parse({
      ...base,
      bankPublic: true,
      bankName: "BCA",
      bankHolder: "Ibu Rafa",
      bankAccount: "123 456-7890",
    });
    expect(on.bankName).toBe("BCA");
    expect(on.bankAccount).toBe("123 456-7890");

    // Kode bank di luar daftar ditolak: yang dipakai BankChip adalah kunci BANKS.
    expect(
      errorPaths({
        ...base,
        bankPublic: true,
        bankName: "BANK PALSU",
        bankHolder: "A",
        bankAccount: "1",
      }),
    ).toContain("bankName");
    // Rekening bukan tempat menaruh teks bebas.
    expect(
      errorPaths({
        ...base,
        bankPublic: true,
        bankName: "BCA",
        bankHolder: "A",
        bankAccount: "<script>",
      }),
    ).toContain("bankAccount");
  });
});

describe("tidyText", () => {
  it("meratakan spasi ganda dan tumpukan baris kosong, satu baris kosong tetap", () => {
    expect(tidyText("Bahan   katun    premium")).toBe("Bahan katun premium");
    expect(tidyText("  Judul  \n\n\n\n  Isi  \n  ")).toBe("Judul\n\nIsi");
    // Satu baris kosong adalah pemisah paragraf yang dimaksud: dipertahankan.
    expect(tidyText("Paragraf 1\n\nParagraf 2")).toBe("Paragraf 1\n\nParagraf 2");
    // Baris tunggal berurutan tidak digabung — daftar butir tetap terbaca.
    expect(tidyText("- satu\n- dua")).toBe("- satu\n- dua");
    // CRLF dari tempelan Windows tidak menyisakan \r.
    expect(tidyText("a\r\n\r\nb")).toBe("a\n\nb");
    expect(tidyText("   \n  \n ")).toBe("");
  });

  it("deskripsi barang dirapikan saat disimpan, bukan saat dirender", () => {
    const parsed = registryItemSchema.parse({
      name: "Sterilizer",
      description: "Kapasitas   6  botol\n\n\n\nGaransi 1 tahun",
      priority: "NORMAL",
      category: "OTHER",
      desiredQty: "1",
    });
    expect(parsed.description).toBe("Kapasitas 6 botol\n\nGaransi 1 tahun");
    // Teks yang isinya hanya spasi jadi null, bukan string kosong di DB.
    expect(
      registryItemSchema.parse({
        name: "Sterilizer",
        description: "   \n  ",
        priority: "NORMAL",
        category: "OTHER",
        desiredQty: "1",
      }).description,
    ).toBeNull();
  });
});

describe("shopProductSchema", () => {
  const base = { name: "Pompa ASI", category: "MOM_NURSING" };

  it("menghitung persen diskon, dibulatkan ke bawah", () => {
    expect(discountPercent(100_000, 125_000)).toBe(20);
    // 33,33% dibulatkan ke bawah: 33, bukan 34.
    expect(discountPercent(100_000, 150_000)).toBe(33);
  });

  it("tidak memberi persen diskon bila diskonnya tidak ada", () => {
    expect(discountPercent(100_000, 100_000)).toBeNull();
    expect(discountPercent(100_000, 90_000)).toBeNull();
    expect(discountPercent(null, 125_000)).toBeNull();
    expect(discountPercent(100_000, null)).toBeNull();
  });

  it("menolak harga asli di bawah harga jual, pada field yang benar", () => {
    const r = shopProductSchema.safeParse({ ...base, price: "900000", priceOriginal: "500000" });
    expect(r.success).toBe(false);
    // Path harus sama dengan atribut name input, kalau tidak pesannya tidak muncul.
    expect(r.success === false && r.error.issues[0].path[0]).toBe("priceOriginal");
    expect(
      shopProductSchema.safeParse({ ...base, price: "100000", priceOriginal: "125000" }).success,
    ).toBe(true);
    // Satu sisi saja tetap boleh: produk tanpa diskon.
    expect(shopProductSchema.safeParse({ ...base, price: "100000" }).success).toBe(true);
    expect(shopProductSchema.safeParse({ ...base, priceOriginal: "125000" }).success).toBe(true);
  });
});
