import { z } from "zod";

/**
 * Validasi MyRegistry. `registryClaimSchema` adalah batas kepercayaan sungguhan:
 * satu-satunya schema di aplikasi ini yang memvalidasi kiriman orang tanpa sesi,
 * jadi setiap field di sana punya batas panjang.
 */

export const REGISTRY_PRIORITIES = ["HIGH", "NORMAL", "EXTRA"] as const;
export const REGISTRY_CATEGORIES = [
  "NUTRITION",
  "CLOTHING",
  "BEDROOM",
  "TOYS",
  "TRANSPORT",
  "OTHER",
] as const;

export const PRIORITY_LABEL: Record<(typeof REGISTRY_PRIORITIES)[number], string> = {
  HIGH: "Sangat Dibutuhkan",
  NORMAL: "Dibutuhkan",
  EXTRA: "Kado Tambahan",
};

export const CATEGORY_LABEL: Record<(typeof REGISTRY_CATEGORIES)[number], string> = {
  NUTRITION: "Nutrisi & Makan",
  CLOTHING: "Pakaian & Sanitasi",
  BEDROOM: "Kamar & Tidur",
  TOYS: "Mainan Sensorik & Edukasi",
  TRANSPORT: "Transportasi & Stroller",
  OTHER: "Lainnya",
};

/**
 * Bank yang bisa dipilih. Satu tabel dipakai dua hal sekaligus — validasi (kode
 * bank wajib salah satu kunci di sini) dan tampilan chip berwarna merek — supaya
 * tidak ada dua daftar bank yang bisa berbeda isinya.
 *
 * `logo` menunjuk berkas di `public/banks/`, diunduh sekali dari Wikimedia Commons
 * dan disimpan sendiri — bukan di-hotlink: halaman publik ini dibuka orang yang
 * tidak punya akun, dan memuat gambar dari domain lain berarti membocorkan siapa
 * yang membuka wishlist ini ke pihak ketiga (dan ikut mati saat Commons membatasi
 * laju permintaan). `mark` tetap ada sebagai cadangan bila logonya belum ada.
 *
 * Label penuhnya SELALU tertulis di sebelah logonya, jadi warna maupun gambar
 * tidak pernah jadi satu-satunya penanda.
 */
export const BANKS = {
  BCA: { label: "BCA", mark: "BCA", tone: "bg-[#0060AF] text-white", logo: "/banks/bca.svg" },
  MANDIRI: {
    label: "Mandiri",
    mark: "MDR",
    tone: "bg-[#003D79] text-white",
    logo: "/banks/mandiri.svg",
  },
  BNI: { label: "BNI", mark: "BNI", tone: "bg-[#EE7623] text-white", logo: "/banks/bni.svg" },
  BRI: { label: "BRI", mark: "BRI", tone: "bg-[#00529C] text-white", logo: "/banks/bri.svg" },
  BSI: {
    label: "Bank Syariah Indonesia",
    mark: "BSI",
    tone: "bg-[#00A39D] text-white",
    logo: "/banks/bsi.svg",
  },
  BTN: { label: "BTN", mark: "BTN", tone: "bg-[#004A93] text-white", logo: "/banks/btn.svg" },
  CIMB: {
    label: "CIMB Niaga",
    mark: "CIMB",
    tone: "bg-[#7E1C22] text-white",
    logo: "/banks/cimb.svg",
  },
  PERMATA: {
    label: "Permata",
    mark: "PMT",
    tone: "bg-[#003C71] text-white",
    logo: "/banks/permata.svg",
  },
  DANAMON: {
    label: "Danamon",
    mark: "DNM",
    tone: "bg-[#0072BC] text-white",
    logo: "/banks/danamon.svg",
  },
  OCBC: { label: "OCBC", mark: "OCBC", tone: "bg-[#E01F26] text-white", logo: "/banks/ocbc.svg" },
  MUAMALAT: {
    label: "Muamalat",
    mark: "MUA",
    tone: "bg-[#6B2C90] text-white",
    logo: "/banks/muamalat.png",
  },
  JAGO: {
    label: "Bank Jago",
    mark: "JAGO",
    tone: "bg-[#FDB913] text-[#1A1A1A]",
    logo: "/banks/jago.svg",
  },
  SEABANK: {
    label: "SeaBank",
    mark: "SEA",
    tone: "bg-[#FE5000] text-white",
    logo: "/banks/seabank.svg",
  },
  BLU: {
    label: "blu by BCA Digital",
    mark: "BLU",
    tone: "bg-[#00A0E3] text-white",
    logo: "/banks/blu.svg",
  },
  // Jenius tidak punya berkas berlisensi bebas di Commons — monogram saja.
  JENIUS: { label: "Jenius (BTPN)", mark: "JNS", tone: "bg-[#0096D6] text-white", logo: null },
  OTHER: { label: "Bank lainnya", mark: "BNK", tone: "bg-muted text-foreground", logo: null },
} as const;

export type BankCode = keyof typeof BANKS;
export const BANK_CODES = Object.keys(BANKS) as [BankCode, ...BankCode[]];

export const MAX_NOTE_CHARS = 300;
export const MAX_QTY = 99;
export const MAX_PRICE_IDR = 100_000_000;

/**
 * Rapikan teks yang ditempel orang: deskripsi yang disalin dari halaman
 * marketplace datang penuh spasi ganda dan baris kosong bertumpuk, dan itu
 * dirender apa adanya di halaman publik. Dirapikan saat disimpan, bukan saat
 * dirender, supaya versi bersihnya yang jadi sumber kebenaran.
 *
 * Satu baris kosong tetap dipertahankan — itu pemisah paragraf yang memang
 * dimaksud; dua atau lebih diciutkan jadi satu.
 */
export function tidyText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Teks opsional: "" dari input kosong jadi null, bukan string kosong di DB.
 *
 * Tiga builder di bawah ini diekspor karena schemas/shop.ts memakainya apa adanya —
 * menyalinnya ke sana berarti dua definisi "teks opsional" yang bisa berbeda.
 */
export const optionalText = (max: number, label: string) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (typeof v === "string" ? tidyText(v) || null : null))
    .refine((v) => v === null || v.length <= max, `${label} maksimal ${max} karakter`);

export const optionalInt = (max: number, label: string) =>
  z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((v) => (typeof v === "string" ? v.trim() : v))
    .transform((v) => (v === "" || v == null ? null : Number(v)))
    .refine((n) => n === null || Number.isInteger(n), `${label} harus berupa angka bulat`)
    .refine((n) => n === null || n >= 0, `${label} tidak boleh negatif`)
    .refine((n) => n === null || n <= max, `${label} melebihi batas wajar`);

/**
 * Tautan toko wajib mengarah ke marketplace yang dimaksud, bukan ke mana saja:
 * wishlist yang bisa memuat URL sembarang jadi papan tautan untuk orang asing
 * yang membuka halaman publiknya.
 */
export const storeUrl = (needle: string, label: string) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null))
    .refine((v) => v === null || v.length <= 500, "Tautan terlalu panjang")
    .refine((v) => {
      if (v === null) return true;
      try {
        const u = new URL(v);
        return (u.protocol === "https:" || u.protocol === "http:") && u.hostname.includes(needle);
      } catch {
        return false;
      }
    }, `Tautan bukan dari ${label}`);

export const registryItemSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nama barang wajib diisi")
      .max(120, "Nama maksimal 120 karakter"),
    description: optionalText(1000, "Deskripsi"),
    priority: z.enum(REGISTRY_PRIORITIES, { message: "Prioritas wajib dipilih" }),
    category: z.enum(REGISTRY_CATEGORIES, { message: "Kategori wajib dipilih" }),
    desiredQty: z
      .union([z.string(), z.number()])
      .transform((v) => (typeof v === "string" ? Number(v.trim()) : v))
      .refine((n) => Number.isInteger(n), "Jumlah harus berupa angka bulat")
      .refine((n) => n >= 1, "Jumlah minimal 1")
      .refine((n) => n <= MAX_QTY, `Jumlah maksimal ${MAX_QTY}`),
    priceMin: optionalInt(MAX_PRICE_IDR, "Harga minimal"),
    priceMax: optionalInt(MAX_PRICE_IDR, "Harga maksimal"),
    note: optionalText(MAX_NOTE_CHARS, "Catatan"),
    urlShopee: storeUrl("shopee.", "Shopee"),
    urlTokopedia: storeUrl("tokopedia.", "Tokopedia"),
    urlTiktok: storeUrl("tiktok.", "TikTok"),
    childId: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null))
      .refine((v) => v === null || z.uuid().safeParse(v).success, "Anak tidak valid"),
    allowGroup: z.coerce
      .boolean()
      .optional()
      .transform((v) => v === true),
    isPublic: z.coerce
      .boolean()
      .optional()
      .transform((v) => v === true),
  })
  .superRefine((d, ctx) => {
    if (d.priceMin !== null && d.priceMax !== null && d.priceMax < d.priceMin) {
      ctx.addIssue({
        code: "custom",
        path: ["priceMax"],
        message: "Harga maksimal tidak boleh lebih kecil dari harga minimal",
      });
    }
  });

export type RegistryItemInput = z.input<typeof registryItemSchema>;
export type RegistryItemOutput = z.output<typeof registryItemSchema>;

/** Resi ditampilkan ke orang tua, jadi karakternya dibatasi — bukan teks bebas. */
const trackingNumber = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null))
  .refine((v) => v === null || v.length <= 50, "Nomor resi maksimal 50 karakter")
  .refine(
    (v) => v === null || /^[A-Za-z0-9 .\-/]+$/.test(v),
    "Nomor resi hanya boleh huruf, angka, spasi, titik, dan tanda hubung",
  );

export const registryClaimSchema = z.object({
  claimerName: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(80, "Nama maksimal 80 karakter"),
  qty: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "string" ? Number(v.trim()) : v))
    .refine((n) => Number.isInteger(n), "Jumlah harus berupa angka bulat")
    .refine((n) => n >= 1, "Jumlah minimal 1")
    .refine((n) => n <= MAX_QTY, `Jumlah maksimal ${MAX_QTY}`),
  message: optionalText(MAX_NOTE_CHARS, "Pesan"),
  trackingNumber,
});

/**
 * Resi TIDAK wajib: pengklaim yang membeli offline boleh mengunggah foto barangnya
 * saja. Kosong berarti "hapus resinya", bukan error — yang menjaga agar klaim tidak
 * berakhir tanpa bukti apa pun adalah UI-nya, bukan schema ini.
 */
export const registryTrackingSchema = z.object({ trackingNumber });

export type RegistryClaimOutput = z.output<typeof registryClaimSchema>;

/** Nomor HP wajib di sini, tidak seperti di profil: kurir butuh nomor yang bisa dihubungi. */
const requiredPhone = z
  .string()
  .trim()
  .min(1, "No. HP wajib diisi")
  .refine(
    (v) => /^(\+62|62|0)8[1-9]\d{6,11}$/.test(v),
    "No. HP tidak valid (contoh: 0812-3456-7890)",
  );

/**
 * Alamat pengiriman kado — WAJIB lengkap. Tanpa alamat, orang yang mengklaim kado
 * tidak punya tujuan kirim, jadi setiap field di sini `min(1)`, bukan opsional.
 *
 * Provinsi/kota/kecamatan datang dari satu baris `lokasi.json` yang sudah dipecah
 * di klien, tapi tetap divalidasi di sini: yang dikirim ke server adalah formData,
 * yang bisa disusun tangan — pilihan di dropdown bukan penjaga.
 *
 * Rekening opsional, kecuali `bankPublic` dinyalakan: menampilkan rekening kosong
 * ke publik tidak berarti apa-apa, jadi menyalakannya mewajibkan ketiganya.
 */
export const shippingSchema = z
  .object({
    shipName: z
      .string()
      .trim()
      .min(2, "Nama penerima minimal 2 karakter")
      .max(100, "Nama maksimal 100 karakter"),
    shipPhone: requiredPhone,
    shipProvince: z.string().trim().min(1, "Provinsi wajib dipilih").max(100),
    shipCity: z.string().trim().min(1, "Kota/kabupaten wajib dipilih").max(100),
    shipDistrict: z.string().trim().min(1, "Kecamatan wajib dipilih").max(100),
    shipAddress: z
      .string()
      .trim()
      .min(10, "Alamat lengkap minimal 10 karakter — sertakan jalan, nomor, RT/RW")
      .max(300, "Alamat maksimal 300 karakter")
      .transform(tidyText),
    bankPublic: z.coerce
      .boolean()
      .optional()
      .transform((v) => v === true),
    bankName: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null))
      .refine((v) => v === null || v in BANKS, "Bank tidak dikenal"),
    bankHolder: optionalText(100, "Nama pemilik rekening"),
    bankAccount: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null))
      .refine((v) => v === null || v.length <= 34, "Nomor rekening maksimal 34 karakter")
      .refine(
        (v) => v === null || /^[0-9][0-9 -]*$/.test(v),
        "Nomor rekening hanya boleh angka, spasi, dan tanda hubung",
      ),
  })
  .superRefine((d, ctx) => {
    if (!d.bankPublic) return;
    const missing = [
      ["bankName", d.bankName, "Bank wajib dipilih"],
      ["bankHolder", d.bankHolder, "Nama pemilik rekening wajib diisi"],
      ["bankAccount", d.bankAccount, "Nomor rekening wajib diisi"],
    ] as const;
    for (const [path, value, message] of missing) {
      if (!value) ctx.addIssue({ code: "custom", path: [path], message });
    }
  });

export type ShippingOutput = z.output<typeof shippingSchema>;
