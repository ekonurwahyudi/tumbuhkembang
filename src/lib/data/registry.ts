import "server-only";
import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
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
 * Alamat kirim + rekening sisi pemilik. Terpisah dari `getRegistrySettings`
 * supaya halaman yang cuma butuh token tidak menarik alamat rumah orang.
 */
export async function getShippingSettings(userId: string) {
  const [row] = await db
    .select({
      shipName: users.shipName,
      shipPhone: users.shipPhone,
      shipProvince: users.shipProvince,
      shipCity: users.shipCity,
      shipDistrict: users.shipDistrict,
      shipAddress: users.shipAddress,
      bankName: users.bankName,
      bankHolder: users.bankHolder,
      bankAccount: users.bankAccount,
      bankPublic: users.bankPublic,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row;
}

export type ShippingValues = {
  shipName: string;
  shipPhone: string;
  shipProvince: string;
  shipCity: string;
  shipDistrict: string;
  shipAddress: string;
  bankName: string | null;
  bankHolder: string | null;
  bankAccount: string | null;
  bankPublic: boolean;
};

export async function setShippingSettings(userId: string, values: ShippingValues) {
  const [row] = await db
    .update(users)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ id: users.id });
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

/**
 * Alamat kirim + rekening untuk halaman publik. Otorisasinya di dalam query, sama
 * seperti `findPublicRegistry`: token cocok DAN registry masih dibagikan.
 *
 * Rekening hanya ikut bila `bankPublic` — itu saklar orang tuanya, dan diuji di
 * sini supaya tidak ada halaman yang bisa lupa memeriksanya. Alamat ikut hanya bila
 * lengkap; alamat setengah jadi tidak berguna untuk kurir dan tetap membocorkan
 * tempat tinggal.
 */
export type PublicShipping = {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  address: string;
  bank: { name: string; holder: string; account: string } | null;
};

export async function findPublicShipping(token: string): Promise<PublicShipping | undefined> {
  const [row] = await db
    .select({
      shipName: users.shipName,
      shipPhone: users.shipPhone,
      shipProvince: users.shipProvince,
      shipCity: users.shipCity,
      shipDistrict: users.shipDistrict,
      shipAddress: users.shipAddress,
      bankName: users.bankName,
      bankHolder: users.bankHolder,
      bankAccount: users.bankAccount,
      bankPublic: users.bankPublic,
    })
    .from(users)
    .where(and(eq(users.registryToken, token), eq(users.registryPublic, true)))
    .limit(1);

  if (
    !row ||
    !row.shipName ||
    !row.shipPhone ||
    !row.shipProvince ||
    !row.shipCity ||
    !row.shipDistrict ||
    !row.shipAddress
  )
    return undefined;

  return {
    name: row.shipName,
    phone: row.shipPhone,
    province: row.shipProvince,
    city: row.shipCity,
    district: row.shipDistrict,
    address: row.shipAddress,
    bank:
      row.bankPublic && row.bankName && row.bankHolder && row.bankAccount
        ? { name: row.bankName, holder: row.bankHolder, account: row.bankAccount }
        : null,
  };
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
 * query: registry terbuka, anak milik pemilik registry, dan ada barang publik yang
 * menjadikan anak itu tujuannya.
 *
 * Syarat ketiga itu terpenuhi dua cara: barang yang menyebut anak itu, ATAU barang
 * tanpa anak — barang tanpa anak adalah kado untuk semua anak yang terdaftar
 * (kembar tidak perlu didaftar satu-satu). Yang tetap menjaga batasnya: registry
 * yang belum dibagikan, atau yang seluruh barangnya privat, tidak memunculkan satu
 * anak pun.
 */
const publicChildItemJoin = and(
  eq(registryItems.userId, children.userId),
  eq(registryItems.isPublic, true),
  or(eq(registryItems.childId, children.id), isNull(registryItems.childId)),
);

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
    .innerJoin(registryItems, publicChildItemJoin)
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
    .innerJoin(registryItems, publicChildItemJoin)
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
): Promise<
  { claim: RegistryClaim; ownerId: string; itemName: string } | { over: number } | undefined
> {
  return db.transaction(async (tx) => {
    const [item] = await tx
      .select({
        id: registryItems.id,
        desiredQty: registryItems.desiredQty,
        allowGroup: registryItems.allowGroup,
        // Untuk memberi tahu orang tuanya; diambil di sini supaya tidak ada query kedua.
        ownerId: registryItems.userId,
        name: registryItems.name,
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
    return { claim, ownerId: item.ownerId, itemName: item.name };
  });
}

/** Klaim + konteksnya untuk halaman isi-resi. claimToken adalah otorisasinya. */
export async function findClaimByToken(claimToken: string) {
  const [row] = await db
    .select({
      claim: registryClaims,
      itemName: registryItems.name,
      registryToken: users.registryToken,
      // Pemilik wishlist — yang diberi tahu saat kadonya diklaim atau buktinya masuk.
      ownerId: registryItems.userId,
    })
    .from(registryClaims)
    .innerJoin(registryItems, eq(registryItems.id, registryClaims.itemId))
    .innerJoin(users, eq(users.id, registryItems.userId))
    .where(eq(registryClaims.claimToken, claimToken))
    .limit(1);
  return row;
}

/** `null` mengosongkan resi — pengklaim yang beralih ke foto bukti boleh menghapusnya. */
export async function updateClaimTracking(claimToken: string, trackingNumber: string | null) {
  const [row] = await db
    .update(registryClaims)
    .set({ trackingNumber, updatedAt: new Date() })
    .where(eq(registryClaims.claimToken, claimToken))
    .returning();
  return row;
}

/** Foto bukti pengiriman. Otorisasinya `claimToken`, sama dengan resi. */
export async function setClaimPhotoKey(claimToken: string, photoKey: string | null) {
  const [row] = await db
    .update(registryClaims)
    .set({ photoKey, updatedAt: new Date() })
    .where(eq(registryClaims.claimToken, claimToken))
    .returning();
  return row;
}

/**
 * Key foto bukti untuk route sisi orang tua. Kepemilikan diuji DI DALAM query:
 * klaim atas barang orang lain sama saja dengan tidak ada.
 */
export async function findClaimPhotoKey(
  userId: string,
  claimId: string,
): Promise<string | undefined> {
  const [row] = await db
    .select({ photoKey: registryClaims.photoKey })
    .from(registryClaims)
    .innerJoin(registryItems, eq(registryItems.id, registryClaims.itemId))
    .where(and(eq(registryClaims.id, claimId), eq(registryItems.userId, userId)))
    .limit(1);
  return row?.photoKey ?? undefined;
}

/**
 * Orang tua membatalkan klaim — yang iseng, atau yang berubah pikiran. Tidak ada
 * kolom status di `registry_claims`, jadi menghapus barisnya benar-benar
 * membebaskan kuotanya dan barangnya bisa diklaim lagi.
 *
 * Kepemilikan diuji DI DALAM query lewat subquery `itemId IN (barang milik user)`:
 * klaim atas barang orang lain sama saja dengan tidak ada. DELETE tidak bisa
 * di-join di Postgres, jadi subquery — bukan cek terpisah di action, yang bisa
 * dilupakan.
 *
 * `photoKey` dikembalikan supaya objeknya di R2 ikut dibersihkan pemanggilnya.
 */
export async function deleteRegistryClaim(userId: string, claimId: string) {
  const [row] = await db
    .delete(registryClaims)
    .where(
      and(
        eq(registryClaims.id, claimId),
        inArray(
          registryClaims.itemId,
          db
            .select({ id: registryItems.id })
            .from(registryItems)
            .where(eq(registryItems.userId, userId)),
        ),
      ),
    )
    .returning({
      id: registryClaims.id,
      itemId: registryClaims.itemId,
      photoKey: registryClaims.photoKey,
      claimerName: registryClaims.claimerName,
    });
  return row;
}
