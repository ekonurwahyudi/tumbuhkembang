import "server-only";
import { and, asc, desc, eq, ilike, inArray } from "drizzle-orm";
import { db } from "@/db";
import { shopFavorites, shopProducts, type ShopCategory, type ShopProduct } from "@/db/schema";

/**
 * Favorit produk katalog. Berbeda dari data/shop.ts di satu hal yang menentukan:
 * di sini `userId` ADALAH kolom pemiliknya, jadi setiap query membawanya di WHERE.
 *
 * Tidak ada join otorisasi seperti data/vaccination-skips.ts — tabel ini tidak
 * menggantung pada `children`, pemiliknya tertulis langsung di barisnya.
 */

/** Dipakai kartu untuk menandai hatinya; Set supaya satu query melayani banyak kartu. */
export async function listFavoriteIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ productId: shopFavorites.productId })
    .from(shopFavorites)
    .where(eq(shopFavorites.userId, userId));
  return new Set(rows.map((r) => r.productId));
}

/**
 * Isi tab Favorit. `is_published` ikut disaring: produk yang ditarik admin dari
 * peredaran hilang dari daftar ini juga, bukan menyisakan kartu yang 404 saat dibuka.
 *
 * Cari dan kategori disaring di sini juga, dengan term yang sama persis seperti
 * `listShopProducts`: di `/shop` kedua kendali itu tetap terlihat di tab Favorit, dan
 * kendali yang terlihat tapi diabaikan lebih buruk daripada kendali yang disembunyikan.
 */
export async function listFavoriteProducts(
  userId: string,
  opts?: { categories?: ShopCategory[]; q?: string },
): Promise<ShopProduct[]> {
  const term = opts?.q?.trim();
  const rows = await db
    .select({ product: shopProducts })
    .from(shopFavorites)
    .innerJoin(shopProducts, eq(shopProducts.id, shopFavorites.productId))
    .where(
      and(
        eq(shopFavorites.userId, userId),
        eq(shopProducts.isPublished, true),
        opts?.categories && opts.categories.length > 0
          ? inArray(shopProducts.category, opts.categories)
          : undefined,
        term ? ilike(shopProducts.name, `%${term}%`) : undefined,
      ),
    )
    .orderBy(asc(shopProducts.sortOrder), desc(shopFavorites.createdAt));
  return rows.map((r) => r.product);
}

/** Dobel ditangkap pemanggilnya sebagai idempoten (unique index + isDuplicateKey). */
export async function addFavorite(userId: string, productId: string) {
  const [row] = await db.insert(shopFavorites).values({ userId, productId }).returning();
  return row;
}

export async function removeFavorite(userId: string, productId: string): Promise<boolean> {
  const deleted = await db
    .delete(shopFavorites)
    .where(and(eq(shopFavorites.userId, userId), eq(shopFavorites.productId, productId)))
    .returning({ id: shopFavorites.id });
  return deleted.length > 0;
}
