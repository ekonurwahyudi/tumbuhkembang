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

export const MAX_NOTE_CHARS = 300;
export const MAX_QTY = 99;
const MAX_PRICE_IDR = 100_000_000;

/** Teks opsional: "" dari input kosong jadi null, bukan string kosong di DB. */
const optionalText = (max: number, label: string) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null))
    .refine((v) => v === null || v.length <= max, `${label} maksimal ${max} karakter`);

const optionalInt = (max: number, label: string) =>
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
const storeUrl = (needle: string, label: string) =>
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
    name: z.string().trim().min(1, "Nama barang wajib diisi").max(120, "Nama maksimal 120 karakter"),
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
    allowGroup: z.coerce.boolean().optional().transform((v) => v === true),
    isPublic: z.coerce.boolean().optional().transform((v) => v === true),
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

export const registryTrackingSchema = z.object({
  trackingNumber: z
    .string()
    .trim()
    .min(3, "Nomor resi wajib diisi")
    .max(50, "Nomor resi maksimal 50 karakter")
    .regex(
      /^[A-Za-z0-9 .\-/]+$/,
      "Nomor resi hanya boleh huruf, angka, spasi, titik, dan tanda hubung",
    ),
});

export type RegistryClaimOutput = z.output<typeof registryClaimSchema>;
