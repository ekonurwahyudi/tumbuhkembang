import "server-only";
import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  children,
  registryClaims,
  registryItems,
  users,
  type RegistryClaim,
  type RegistryItem,
} from "@/db/schema";

/**
 * Akses data MyRegistry. Modul ini punya DUA keluarga fungsi yang sengaja dinamai
 * berbeda supaya tidak mungkin tertukar:
 *
 * - Sisi pemilik (`listRegistryItems`, `getRegistryItem`, ...) selalu membawa
 *   `userId` dari session di WHERE, sama seperti data/children.ts.
 * - Sisi publik (`findPublicRegistry`, `listPublicItems`, `claimItem`, ...) tidak
 *   punya parameter userId sama sekali — otorisasinya `users.registry_token` plus
 *   `users.registry_public`, dua-duanya diuji DI DALAM query. Registry yang
 *   dijadikan privat lagi karena itu langsung mati tanpa cabang `if` di halaman.
 *
 * Fungsi publik mengembalikan `undefined` untuk semua kegagalan — token asing,
 * registry ditutup, item disembunyikan, kuota habis. Pemanggil tidak boleh bisa
 * membedakannya, karena bedanya membocorkan keberadaan sebuah id.
 */

export type ItemWithClaims = { item: RegistryItem; claims: RegistryClaim[]; claimedQty: number };

/** Sisa unit yang belum ada yang beli. */
export const remainingQty = (r: ItemWithClaims) => Math.max(0, r.item.desiredQty - r.claimedQty);

/**
 * Gabungkan klaim ke itemnya. Dua query, bukan satu dengan agregat: klaimnya
 * dibutuhkan utuh (nama pengklaim, resi) bukan cuma jumlahnya, dan satu join
 * berisi baris kembar per item yang harus dikelompokkan di sini juga.
 */
async function withClaims(items: RegistryItem[]): Promise<ItemWithClaims[]> {
  if (items.length === 0) return [];

  const rows = await db
    .select()
    .from(registryClaims)
    .where(
      inArray(
        registryClaims.itemId,
        items.map((i) => i.id),
      ),
    )
    .orderBy(desc(registryClaims.createdAt));

  return items.map((item) => {
    const claims = rows.filter((c) => c.itemId === item.id);
    return { item, claims, claimedQty: claims.reduce((n, c) => n + c.qty, 0) };
  });
}

// ---------------------------------------------------------------- sisi pemilik

export async function listRegistryItems(userId: string): Promise<ItemWithClaims[]> {
  const items = await db
    .select()
    .from(registryItems)
    .where(eq(registryItems.userId, userId))
    .orderBy(desc(registryItems.createdAt));
  return withClaims(items);
}

export async function getRegistryItem(
  userId: string,
  itemId: string,
): Promise<RegistryItem | undefined> {
  const [row] = await db
    .select()
    .from(registryItems)
    .where(and(eq(registryItems.id, itemId), eq(registryItems.userId, userId)))
    .limit(1);
  return row;
}

/** Versi berklaim untuk halaman detail; `getRegistryItem` sengaja tetap telanjang. */
export async function getRegistryItemWithClaims(
  userId: string,
  itemId: string,
): Promise<ItemWithClaims | undefined> {
  const item = await getRegistryItem(userId, itemId);
  if (!item) return undefined;
  const [row] = await withClaims([item]);
  return row;
}

/** `photoKeys` tidak ada di sini: nilainya hanya boleh datang dari hasil unggah. */
export type RegistryItemValues = Omit<
  typeof registryItems.$inferInsert,
  "id" | "userId" | "photoKeys" | "createdAt" | "updatedAt"
>;

export async function insertRegistryItem(userId: string, values: RegistryItemValues) {
  const [row] = await db
    .insert(registryItems)
    .values({ ...values, userId })
    .returning();
  return row;
}

export async function updateRegistryItem(
  userId: string,
  itemId: string,
  values: RegistryItemValues,
) {
  const [row] = await db
    .update(registryItems)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(registryItems.id, itemId), eq(registryItems.userId, userId)))
    .returning();
  return row;
}

/** Batas foto per barang. Cukup untuk beberapa sudut, bukan galeri. */
export const MAX_ITEM_PHOTOS = 5;

/**
 * Tambahkan satu foto ke akhir daftar. Baris dikunci selama transaksi: dua
 * unggahan berbarengan pada barang yang sama tidak boleh saling menimpa daftar.
 *
 * `{ full: true }` bila kuotanya sudah penuh — pemanggil menghapus objek yang
 * sudah tertulis, bukan menyisipkannya diam-diam.
 */
export async function addRegistryItemPhoto(
  userId: string,
  itemId: string,
  photoKey: string,
): Promise<{ keys: string[] } | { full: true } | undefined> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ photoKeys: registryItems.photoKeys })
      .from(registryItems)
      .where(and(eq(registryItems.id, itemId), eq(registryItems.userId, userId)))
      .limit(1)
      .for("update");
    if (!existing) return undefined;
    if (existing.photoKeys.length >= MAX_ITEM_PHOTOS) return { full: true as const };

    const keys = [...existing.photoKeys, photoKey];
    await tx
      .update(registryItems)
      .set({ photoKeys: keys, updatedAt: new Date() })
      .where(and(eq(registryItems.id, itemId), eq(registryItems.userId, userId)));
    return { keys };
  });
}

/**
 * Hapus satu foto menurut key-nya, atau semuanya bila `photoKey` null.
 * Key yang dihapus dikembalikan supaya action bisa membuang objeknya di R2.
 */
export async function removeRegistryItemPhoto(
  userId: string,
  itemId: string,
  photoKey: string | null,
): Promise<{ removed: string[] } | undefined> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ photoKeys: registryItems.photoKeys })
      .from(registryItems)
      .where(and(eq(registryItems.id, itemId), eq(registryItems.userId, userId)))
      .limit(1)
      .for("update");
    if (!existing) return undefined;

    const removed = photoKey ? existing.photoKeys.filter((k) => k === photoKey) : existing.photoKeys;
    const keys = photoKey ? existing.photoKeys.filter((k) => k !== photoKey) : [];

    if (removed.length > 0)
      await tx
        .update(registryItems)
        .set({ photoKeys: keys, updatedAt: new Date() })
        .where(and(eq(registryItems.id, itemId), eq(registryItems.userId, userId)));
    return { removed };
  });
}

export async function deleteRegistryItem(userId: string, itemId: string) {
  const [row] = await db
    .delete(registryItems)
    .where(and(eq(registryItems.id, itemId), eq(registryItems.userId, userId)))
    .returning({ id: registryItems.id, photoKeys: registryItems.photoKeys });
  return row;
}

/** "Hadiah Masuk": semua klaim atas item milik user ini, terbaru di atas. */
export async function listRegistryClaims(userId: string) {
  const rows = await db
    .select({ claim: registryClaims, itemName: registryItems.name })
    .from(registryClaims)
    .innerJoin(registryItems, eq(registryItems.id, registryClaims.itemId))
    .where(eq(registryItems.userId, userId))
    .orderBy(desc(registryClaims.createdAt));
  return rows.map((r) => ({ ...r.claim, itemName: r.itemName }));
}

/** Tiga penghitung di kepala halaman. Dihitung dari daftar yang sudah ditarik. */
export function registrySummary(rows: ItemWithClaims[]) {
  const gifted = rows.filter((r) => remainingQty(r) === 0).length;
  return { listed: rows.length, gifted, waiting: rows.length - gifted };
}

/** Badge di ubin dashboard — satu angka, jadi satu query kecil. */
export async function registryClaimCount(userId: string): Promise<number> {
  const rows = await db
    .select({ id: registryClaims.id })
    .from(registryClaims)
    .innerJoin(registryItems, eq(registryItems.id, registryClaims.itemId))
    .where(eq(registryItems.userId, userId));
  return rows.length;
}

export async function getRegistrySettings(userId: string) {
  const [row] = await db
    .select({ token: users.registryToken, isPublic: users.registryPublic })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row;
}

/** Idempoten: token yang sudah ada dipakai ulang supaya tautan lama tetap hidup. */
export async function ensureRegistryToken(userId: string): Promise<string | undefined> {
  const existing = await getRegistrySettings(userId);
  if (!existing) return undefined;
  if (existing.token) return existing.token;

  const token = randomBytes(24).toString("base64url");
  await db
    .update(users)
    .set({ registryToken: token, updatedAt: new Date() })
    .where(eq(users.id, userId));
  return token;
}

export async function setRegistryPublic(userId: string, on: boolean) {
  const [row] = await db
    .update(users)
    .set({ registryPublic: on, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ token: users.registryToken, isPublic: users.registryPublic });
  return row;
}

/**
 * Anak milik user untuk dropdown "Untuk:" dan rel penyaring. Foto dan tanggal
 * lahir ikut karena rel butuh avatar + umurnya; tetap bukan seluruh profil —
 * pengukuran, tipe kelahiran, dan sisanya tidak dibawa.
 */
export async function listRegistryChildren(userId: string) {
  return db
    .select({
      id: children.id,
      name: children.name,
      photoKey: children.photoKey,
      dateOfBirth: children.dateOfBirth,
    })
    .from(children)
    .where(eq(children.userId, userId))
    .orderBy(desc(children.createdAt));
}

// ----------------------------------------------------------------- sisi publik

export type PublicRegistry = { userId: string; ownerName: string };

/** Token DAN registryPublic diuji di query — bukan di halaman pemanggil. */
export async function findPublicRegistry(token: string): Promise<PublicRegistry | undefined> {
  const [row] = await db
    .select({ userId: users.id, ownerName: users.name })
    .from(users)
    .where(and(eq(users.registryToken, token), eq(users.registryPublic, true)))
    .limit(1);
  return row;
}

export async function listPublicItems(userId: string): Promise<ItemWithClaims[]> {
  const items = await db
    .select()
    .from(registryItems)
    .where(and(eq(registryItems.userId, userId), eq(registryItems.isPublic, true)))
    .orderBy(desc(registryItems.createdAt));
  return withClaims(items);
}

/**
 * Key foto untuk route publik. Tiga syarat dalam satu query: token cocok,
 * registry terbuka, item tidak disembunyikan. Semua gagal → undefined → 404.
 *
 * `index` memilih foto ke berapa; di luar rentang juga undefined, jadi jumlah
 * foto sebuah barang tidak bisa diraba lewat beda kode status.
 */
export async function findPublicItemPhotoKey(
  token: string,
  itemId: string,
  index = 0,
): Promise<string | undefined> {
  const [row] = await db
    .select({ photoKeys: registryItems.photoKeys })
    .from(registryItems)
    .innerJoin(users, eq(users.id, registryItems.userId))
    .where(
      and(
        eq(registryItems.id, itemId),
        eq(registryItems.isPublic, true),
        eq(users.registryToken, token),
        eq(users.registryPublic, true),
      ),
    )
    .limit(1);
  return row?.photoKeys[index];
}

/**
 * Satu barang untuk halaman detail publik. Empat syarat di satu WHERE: token
 * cocok, registry terbuka, id cocok, barang tidak disembunyikan. Registry yang
 * ditutup atau barang yang dijadikan privat karena itu langsung mati.
 */
export async function findPublicItem(
  token: string,
  itemId: string,
): Promise<{ registry: PublicRegistry; row: ItemWithClaims } | undefined> {
  const [found] = await db
    .select({ item: registryItems, userId: users.id, ownerName: users.name })
    .from(registryItems)
    .innerJoin(users, eq(users.id, registryItems.userId))
    .where(
      and(
        eq(registryItems.id, itemId),
        eq(registryItems.isPublic, true),
        eq(users.registryToken, token),
        eq(users.registryPublic, true),
      ),
    )
    .limit(1);
  if (!found) return undefined;

  const [row] = await withClaims([found.item]);
  return { registry: { userId: found.userId, ownerName: found.ownerName }, row };
}

/**
 * Anak yang boleh ditampilkan ke pemegang tautan. Tiga syarat, semuanya di dalam
 * query: registry terbuka, anak milik pemilik registry, dan anak itu dirujuk
 * setidaknya satu barang publik.
 *
 * Syarat terakhir yang menjaga batasnya: tautan wishlist tidak boleh berubah jadi
 * daftar seluruh anak di akun itu, hanya anak yang memang jadi tujuan kadonya.
 */
export async function listPublicChildren(token: string) {
  return db
    .selectDistinct({
      id: children.id,
      name: children.name,
      photoKey: children.photoKey,
      dateOfBirth: children.dateOfBirth,
    })
    .from(children)
    .innerJoin(users, eq(users.id, children.userId))
    .innerJoin(
      registryItems,
      and(eq(registryItems.childId, children.id), eq(registryItems.isPublic, true)),
    )
    .where(and(eq(users.registryToken, token), eq(users.registryPublic, true)));
}

/** Key foto anak untuk route publik — tiga syarat yang sama dengan di atas. */
export async function findPublicChildPhotoKey(
  token: string,
  childId: string,
): Promise<string | undefined> {
  const [row] = await db
    .selectDistinct({ photoKey: children.photoKey })
    .from(children)
    .innerJoin(users, eq(users.id, children.userId))
    .innerJoin(
      registryItems,
      and(eq(registryItems.childId, children.id), eq(registryItems.isPublic, true)),
    )
    .where(
      and(
        eq(children.id, childId),
        eq(users.registryToken, token),
        eq(users.registryPublic, true),
      ),
    )
    .limit(1);
  return row?.photoKey ?? undefined;
}

export type ClaimValues = {
  claimerName: string;
  qty: number;
  message: string | null;
  trackingNumber: string | null;
};

/**
 * Buat klaim. Baris item dikunci `FOR UPDATE` selama transaksi: dua orang yang
 * menekan "Klaim" bersamaan tidak boleh menghasilkan 4 dari 3 pack terpenuhi.
 * Ini satu-satunya tempat di aplikasi ini yang butuh lock baris.
 *
 * `undefined` untuk semua penolakan; `{ over: sisa }` bila jumlahnya melebihi kuota,
 * karena angka sisanya perlu ditampilkan ke pengklaim.
 */
export async function claimItem(
  token: string,
  itemId: string,
  values: ClaimValues,
): Promise<{ claim: RegistryClaim } | { over: number } | undefined> {
  return db.transaction(async (tx) => {
    const [item] = await tx
      .select({
        id: registryItems.id,
        desiredQty: registryItems.desiredQty,
        allowGroup: registryItems.allowGroup,
      })
      .from(registryItems)
      .innerJoin(users, eq(users.id, registryItems.userId))
      .where(
        and(
          eq(registryItems.id, itemId),
          eq(registryItems.isPublic, true),
          eq(users.registryToken, token),
          eq(users.registryPublic, true),
        ),
      )
      .limit(1)
      .for("update", { of: registryItems });
    if (!item) return undefined;

    const existing = await tx
      .select({ qty: registryClaims.qty })
      .from(registryClaims)
      .where(eq(registryClaims.itemId, itemId));
    const claimed = existing.reduce((n, c) => n + c.qty, 0);
    const remaining = item.desiredQty - claimed;

    // Tanpa patungan: satu pengklaim mengambil seluruhnya, tidak ada klaim kedua.
    const qty = item.allowGroup ? values.qty : item.desiredQty;
    if (!item.allowGroup && claimed > 0) return { over: 0 };
    if (qty > remaining) return { over: remaining };

    const [claim] = await tx
      .insert(registryClaims)
      .values({
        itemId,
        claimerName: values.claimerName,
        qty,
        message: values.message,
        trackingNumber: values.trackingNumber,
        claimToken: randomBytes(24).toString("base64url"),
      })
      .returning();
    return { claim };
  });
}

/** Klaim + konteksnya untuk halaman isi-resi. claimToken adalah otorisasinya. */
export async function findClaimByToken(claimToken: string) {
  const [row] = await db
    .select({
      claim: registryClaims,
      itemName: registryItems.name,
      registryToken: users.registryToken,
    })
    .from(registryClaims)
    .innerJoin(registryItems, eq(registryItems.id, registryClaims.itemId))
    .innerJoin(users, eq(users.id, registryItems.userId))
    .where(eq(registryClaims.claimToken, claimToken))
    .limit(1);
  return row;
}

export async function updateClaimTracking(claimToken: string, trackingNumber: string) {
  const [row] = await db
    .update(registryClaims)
    .set({ trackingNumber, updatedAt: new Date() })
    .where(eq(registryClaims.claimToken, claimToken))
    .returning();
  return row;
}
