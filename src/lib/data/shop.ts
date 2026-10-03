import "server-only";
import { and, asc, desc, eq, ilike, inArray } from "drizzle-orm";
import { db } from "@/db";
import { MAX_SHOP_PHOTOS } from "@/schemas/shop";
import { shopProducts, type ShopCategory, type ShopProduct } from "@/db/schema";

/**
 * Akses data katalog Shop. Dua sisi dengan otorisasi berbeda:
 *
 * - Sisi admin (`adminListShopProducts`, `insertShopProduct`, ...) TIDAK membawa
 *   userId, persis seperti data/admin.ts: pemanggilnya WAJIB sudah lewat
 *   `requireSuperadmin()`. Tidak ada self-authorization di lapisan ini.
 * - Sisi baca (`listShopProducts`, `getShopProduct`) juga tidak membawa userId — tapi
 *   alasannya berbeda: katalognya memang milik bersama, tidak ada pemiliknya. Yang
 *   disaring di dalam query adalah `is_published`, bukan kepemilikan.
 *
 * Bedanya tajam dari data/registry.ts dan data/children.ts, di mana TIDAK adanya
 * userId di WHERE adalah bug keamanan. Di sini justru benar — dan karena itu modulnya
 * terpisah: `grep userId src/lib/data` tidak boleh menuduh berkas ini.
 *
 * Sisi baca mengembalikan `undefined` untuk semua kegagalan — id asing maupun produk
 * yang masih draf. Pemanggil tidak boleh bisa membedakannya.
 */

// ------------------------------------------------------------------- sisi baca

export async function listShopProducts(opts?: {
  categories?: ShopCategory[];
  /** Pencarian nama, pola sama dengan adminListShopProducts. */
  q?: string;
  limit?: number;
}): Promise<ShopProduct[]> {
  const term = opts?.q?.trim();
  const where = and(
    eq(shopProducts.isPublished, true),
    opts?.categories && opts.categories.length > 0
      ? inArray(shopProducts.category, opts.categories)
      : undefined,
    term ? ilike(shopProducts.name, `%${term}%`) : undefined,
  );

  const rows = db
    .select()
    .from(shopProducts)
    .where(where)
    .orderBy(asc(shopProducts.sortOrder), desc(shopProducts.createdAt));

  return opts?.limit ? rows.limit(opts.limit) : rows;
}

/** Satu baris saran pencarian: cukup untuk thumbnail, nama, dan harganya. */
export type ShopSuggestion = {
  id: string;
  name: string;
  priceIdr: number | null;
  priceOriginalIdr: number | null;
  hasPhoto: boolean;
};

/**
 * Daftar saran untuk kotak cari. Lima kolom, bukan barisnya utuh: `description` dan
 * seluruh `photo_keys` tidak perlu ikut melintas hanya untuk menggambar satu baris
 * saran — yang dibutuhkan hanya apakah fotonya ADA, karena route fotonya beralamat
 * `?i=0`.
 *
 * Sengaja TIDAK menerima `q` — penyaringannya dilakukan browser dari daftar ini. Daftar
 * yang ikut tersaring `q` akan menyusut setiap kali orang menyempitkan pencariannya,
 * lalu tidak pernah tumbuh lagi saat kata kuncinya dihapus.
 */
export async function listShopSuggestions(opts?: {
  categories?: ShopCategory[];
  limit?: number;
}): Promise<ShopSuggestion[]> {
  const rows = await db
    .select({
      id: shopProducts.id,
      name: shopProducts.name,
      priceIdr: shopProducts.priceIdr,
      priceOriginalIdr: shopProducts.priceOriginalIdr,
      photoKeys: shopProducts.photoKeys,
    })
    .from(shopProducts)
    .where(
      and(
        eq(shopProducts.isPublished, true),
        opts?.categories && opts.categories.length > 0
          ? inArray(shopProducts.category, opts.categories)
          : undefined,
      ),
    )
    .orderBy(asc(shopProducts.name))
    .limit(opts?.limit ?? 200);

  return rows.map(({ photoKeys, ...r }) => ({ ...r, hasPhoto: photoKeys.length > 0 }));
}

export async function getShopProduct(productId: string): Promise<ShopProduct | undefined> {
  const [row] = await db
    .select()
    .from(shopProducts)
    .where(and(eq(shopProducts.id, productId), eq(shopProducts.isPublished, true)))
    .limit(1)
    .catch(() => []);
  return row;
}

/**
 * Key satu foto untuk route-nya. Filter `is_published` ada di dalam query, jadi foto
 * produk draf tidak bisa diraba lewat id.
 *
 * `.catch` menangkap id yang bukan uuid — Postgres menolaknya sebagai kesalahan tipe,
 * dan route-nya harus menjawab 404, bukan 500.
 */
export async function getShopProductPhotoKey(
  productId: string,
  index: number,
): Promise<string | undefined> {
  const [row] = await db
    .select({ photoKeys: shopProducts.photoKeys })
    .from(shopProducts)
    .where(and(eq(shopProducts.id, productId), eq(shopProducts.isPublished, true)))
    .limit(1)
    .catch(() => []);
  return row?.photoKeys[index];
}

// ------------------------------------------------------------------ sisi admin

/** Tanpa filter is_published: admin memang harus melihat drafnya sendiri. */
export async function adminListShopProducts(q?: string): Promise<ShopProduct[]> {
  const term = q?.trim();
  return db
    .select()
    .from(shopProducts)
    .where(term ? ilike(shopProducts.name, `%${term}%`) : undefined)
    .orderBy(asc(shopProducts.sortOrder), desc(shopProducts.createdAt))
    .limit(100);
}

export async function adminGetShopProduct(productId: string): Promise<ShopProduct | undefined> {
  const [row] = await db
    .select()
    .from(shopProducts)
    .where(eq(shopProducts.id, productId))
    .limit(1)
    .catch(() => []);
  return row;
}

/** `photoKeys` tidak ada di sini: nilainya hanya boleh datang dari hasil unggah. */
export type ShopProductValues = Omit<
  typeof shopProducts.$inferInsert,
  "id" | "photoKeys" | "createdAt" | "updatedAt"
>;

export async function insertShopProduct(values: ShopProductValues) {
  const [row] = await db.insert(shopProducts).values(values).returning();
  return row;
}

export async function updateShopProduct(productId: string, values: ShopProductValues) {
  const [row] = await db
    .update(shopProducts)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(shopProducts.id, productId))
    .returning();
  return row;
}

export async function setShopProductPublished(productId: string, isPublished: boolean) {
  const [row] = await db
    .update(shopProducts)
    .set({ isPublished, updatedAt: new Date() })
    .where(eq(shopProducts.id, productId))
    .returning({ id: shopProducts.id, isPublished: shopProducts.isPublished });
  return row;
}

/**
 * Tambahkan satu foto ke akhir daftar. Barisnya dikunci selama transaksi: dua tab
 * admin yang mengunggah berbarengan tetap bisa saling menimpa array-nya.
 *
 * `{ full: true }` bila kuotanya penuh — pemanggil menghapus objek yang sudah
 * tertulis, bukan menyisipkannya diam-diam.
 */
export async function addShopProductPhoto(
  productId: string,
  photoKey: string,
): Promise<{ keys: string[] } | { full: true } | undefined> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ photoKeys: shopProducts.photoKeys })
      .from(shopProducts)
      .where(eq(shopProducts.id, productId))
      .limit(1)
      .for("update");
    if (!existing) return undefined;
    if (existing.photoKeys.length >= MAX_SHOP_PHOTOS) return { full: true as const };

    const keys = [...existing.photoKeys, photoKey];
    await tx
      .update(shopProducts)
      .set({ photoKeys: keys, updatedAt: new Date() })
      .where(eq(shopProducts.id, productId));
    return { keys };
  });
}

/**
 * Hapus satu foto menurut key-nya, atau semuanya bila `photoKey` null.
 * Key yang dihapus dikembalikan supaya action bisa membuang objeknya di R2.
 */
export async function removeShopProductPhoto(
  productId: string,
  photoKey: string | null,
): Promise<{ removed: string[] } | undefined> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ photoKeys: shopProducts.photoKeys })
      .from(shopProducts)
      .where(eq(shopProducts.id, productId))
      .limit(1)
      .for("update");
    if (!existing) return undefined;

    const removed = photoKey
      ? existing.photoKeys.filter((k) => k === photoKey)
      : existing.photoKeys;
    const keys = photoKey ? existing.photoKeys.filter((k) => k !== photoKey) : [];

    if (removed.length > 0)
      await tx
        .update(shopProducts)
        .set({ photoKeys: keys, updatedAt: new Date() })
        .where(eq(shopProducts.id, productId));
    return { removed };
  });
}

export async function deleteShopProduct(productId: string) {
  const [row] = await db
    .delete(shopProducts)
    .where(eq(shopProducts.id, productId))
    .returning({ id: shopProducts.id, photoKeys: shopProducts.photoKeys });
  return row;
}
