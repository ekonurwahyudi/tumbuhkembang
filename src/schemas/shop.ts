import { z } from "zod";
import { MAX_PRICE_IDR, optionalInt, optionalText, storeUrl } from "./registry";

/**
 * Validasi katalog Shop. Bukan batas kepercayaan terhadap orang luar — yang menulis
 * hanya superadmin — tapi tetap divalidasi penuh: isian yang ditempel dari halaman
 * marketplace datang panjang dan berisi apa saja.
 *
 * Builder optionalText/optionalInt/storeUrl diambil dari schemas/registry.ts, tidak
 * disalin: satu definisi "teks opsional" untuk seluruh aplikasi.
 */

/**
 * Batas foto per produk. Satu lebih dari registry: katalog wajar punya beberapa sudut.
 * Tinggal di sini, bukan di data/shop.ts yang `server-only`, karena form kliennya perlu
 * mematikan tombol sebelum unggahan ditolak. Server tetap yang menegakkan.
 */
export const MAX_SHOP_PHOTOS = 6;

export const SHOP_CATEGORIES = [
  "MOM_PREGNANCY",
  "MOM_NURSING",
  "MOM_CARE",
  "BABY_NUTRITION",
  "BABY_DIAPERING",
  "BABY_BATH",
  "BABY_CLOTHING",
  "BABY_SLEEP",
  "BABY_TRANSPORT",
  "CHILD_TOYS",
  "CHILD_LEARNING",
  "HEALTH_DEVICE",
  "OTHER",
] as const;

export type ShopCategoryValue = (typeof SHOP_CATEGORIES)[number];

export const SHOP_CATEGORY_LABEL: Record<ShopCategoryValue, string> = {
  MOM_PREGNANCY: "Kehamilan & Persiapan Lahir",
  MOM_NURSING: "Menyusui & Pompa ASI",
  MOM_CARE: "Perawatan & Vitamin Ibu",
  BABY_NUTRITION: "Nutrisi & MPASI",
  BABY_DIAPERING: "Diapers & Perlengkapan Ganti",
  BABY_BATH: "Mandi & Perawatan Kulit",
  BABY_CLOTHING: "Pakaian Bayi & Anak",
  BABY_SLEEP: "Kamar & Tidur",
  BABY_TRANSPORT: "Stroller, Carrier & Car Seat",
  CHILD_TOYS: "Mainan Sensorik & Edukasi",
  CHILD_LEARNING: "Buku & Alat Belajar",
  HEALTH_DEVICE: "Alat Kesehatan & Pengukuran",
  OTHER: "Lainnya",
};

export const SHOP_GROUPS = ["Ibu", "Bayi", "Anak", "Lainnya"] as const;
export type ShopGroup = (typeof SHOP_GROUPS)[number];

/**
 * Tiga belas chip sejajar tidak terbaca di lebar HP, jadi filternya memakai empat
 * kelompok besar ini dan menerjemahkannya jadi daftar kategori di query.
 */
export const SHOP_CATEGORY_GROUP: Record<ShopCategoryValue, ShopGroup> = {
  MOM_PREGNANCY: "Ibu",
  MOM_NURSING: "Ibu",
  MOM_CARE: "Ibu",
  BABY_NUTRITION: "Bayi",
  BABY_DIAPERING: "Bayi",
  BABY_BATH: "Bayi",
  BABY_CLOTHING: "Bayi",
  BABY_SLEEP: "Bayi",
  BABY_TRANSPORT: "Bayi",
  CHILD_TOYS: "Anak",
  CHILD_LEARNING: "Anak",
  HEALTH_DEVICE: "Lainnya",
  OTHER: "Lainnya",
};

export const categoriesOfGroup = (group: ShopGroup): ShopCategoryValue[] =>
  SHOP_CATEGORIES.filter((c) => SHOP_CATEGORY_GROUP[c] === group);

export const isShopGroup = (v: unknown): v is ShopGroup =>
  typeof v === "string" && (SHOP_GROUPS as readonly string[]).includes(v);

/**
 * Penjaga untuk `?kategori=` di /shop, yang kini membawa satu kategori (13 nilai),
 * bukan kelompok (4 nilai). Tautan lama `?kategori=Ibu` jadi `false` di sini dan
 * jatuh ke "Semua Kategori" — kemunduran yang benar, bukan 404.
 */
export const isShopCategory = (v: unknown): v is ShopCategoryValue =>
  typeof v === "string" && (SHOP_CATEGORIES as readonly string[]).includes(v);

const idr = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** "Rp 125.000". Di sini, bukan di registry-shared: harga shop tunggal, bukan kisaran. */
export const formatIdr = (n: number) => `Rp ${idr.format(n)}`;

/**
 * Persen diskon, dibulatkan ke bawah — 19% lebih jujur daripada 20% yang dibulatkan
 * ke atas. `null` bila diskonnya tidak ada sungguhan: harga asli yang sama atau lebih
 * kecil bukan diskon, dan badge "0%" di kartu lebih buruk daripada tanpa badge.
 */
export function discountPercent(price: number | null, original: number | null): number | null {
  if (price === null || original === null || original <= price) return null;
  return Math.floor(((original - price) / original) * 100);
}

/**
 * Tanpa field foto sama sekali — itu salah satu lapis penegak aturan "key foto hanya
 * datang dari hasil unggah", persis seperti registryItemSchema.
 */
export const shopProductSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nama produk wajib diisi")
      .max(160, "Nama maksimal 160 karakter"),
    description: optionalText(2000, "Deskripsi"),
    category: z.enum(SHOP_CATEGORIES, { message: "Kategori wajib dipilih" }),
    price: optionalInt(MAX_PRICE_IDR, "Harga jual"),
    priceOriginal: optionalInt(MAX_PRICE_IDR, "Harga asli"),
    urlShopee: storeUrl("shopee.", "Shopee"),
    urlTokopedia: storeUrl("tokopedia.", "Tokopedia"),
    urlTiktok: storeUrl("tiktok.", "TikTok"),
    isPublished: z.coerce
      .boolean()
      .optional()
      .transform((v) => v === true),
    sortOrder: optionalInt(9999, "Urutan").transform((v) => v ?? 0),
  })
  .superRefine((d, ctx) => {
    // `path` wajib sama dengan atribut `name` input-nya, kalau tidak pesannya tidak muncul.
    if (d.price !== null && d.priceOriginal !== null && d.priceOriginal < d.price) {
      ctx.addIssue({
        code: "custom",
        path: ["priceOriginal"],
        message: "Harga asli tidak boleh lebih kecil dari harga jual",
      });
    }
  });

export type ShopProductInput = z.infer<typeof shopProductSchema>;
