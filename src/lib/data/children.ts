import "server-only";
import { randomBytes } from "node:crypto";
import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  childShares,
  children,
  growthMeasurements,
  type Child,
  type ChildShare,
} from "@/db/schema";

/**
 * Semua akses data anak melalui modul ini.
 *
 * Aturan keras: setiap query menyertakan `user_id` pemilik. `childId` yang
 * datang dari client tidak pernah dipercaya sendirian — ia selalu dipasangkan
 * dengan id user dari session. Tidak ada helper "ambil anak tanpa user" di sini,
 * supaya tidak ada jalur yang bisa melewatkan otorisasi.
 *
 * Pengecualian satu-satunya: varian `...ForViewer` juga menerima user yang
 * menerima undangan "Akses Pasangan" (share ACCEPTED, `child_shares`). Akses itu
 * hanya untuk lihat dan mencatat — hapus/ubah profil anak tetap owner-only
 * (`deleteChild`, `updateChild`, `setChildPhotoKey` tidak punya varian viewer).
 */

export async function listChildren(userId: string) {
  return db
    .select()
    .from(children)
    .where(eq(children.userId, userId))
    .orderBy(desc(children.createdAt));
}

/** Peran penonton terhadap seorang anak: pemilik, atau pasangan yang diundang. */
export type ViewerChild = { child: Child; role: "OWNER" | "PARTNER" };

/**
 * Predikat SQL untuk query catatan anak (join ke `children`): baris terlihat
 * bila user pemilik anak ATAU penerima share ACCEPTED yang belum kedaluwarsa.
 * Dipakai data layer catatan (measurement/asupan/imunisasi) — profil anak
 * (hapus/ubah/foto) tetap memakai `eq(children.userId, userId)`.
 */
export function childVisibleTo(userId: string) {
  return sql`(${children.userId} = ${userId} or exists (
    select 1 from ${childShares}
    where ${childShares.childId} = ${children.id}
      and ${childShares.inviteeUserId} = ${userId}
      and ${childShares.status} = 'ACCEPTED'
      and ${childShares.expiresAt} > now()
  ))`;
}

/** Anak milik sendiri ∪ anak yang dibagikan ke user ini (share ACCEPTED). */
export async function listChildrenForViewer(userId: string): Promise<ViewerChild[]> {
  const own = await listChildren(userId);

  const shared = await db
    .select({ child: children })
    .from(childShares)
    .innerJoin(children, eq(children.id, childShares.childId))
    .where(
      and(
        eq(childShares.inviteeUserId, userId),
        eq(childShares.status, "ACCEPTED"),
        gt(childShares.expiresAt, new Date()),
      ),
    );

  // ponytail: merge dua query di JS, bukan UNION SQL — jumlah anak per akun kecil;
  // ganti dengan UNION LATERAL bila daftar anak bisa ratusan.
  const seen = new Set(own.map((c) => c.id));
  return [
    ...own.map((child) => ({ child, role: "OWNER" as const })),
    ...shared
      .filter((s) => !seen.has(s.child.id))
      .map((s) => ({ child: s.child, role: "PARTNER" as const })),
  ];
}

export async function getChild(userId: string, childId: string): Promise<Child | undefined> {
  const [row] = await db
    .select()
    .from(children)
    .where(and(eq(children.id, childId), eq(children.userId, userId)))
    .limit(1);
  return row;
}

/** Cek kepemilikan tanpa menarik seluruh baris. Dipakai sebelum menulis measurement. */
export async function assertChildOwned(userId: string, childId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: children.id })
    .from(children)
    .where(and(eq(children.id, childId), eq(children.userId, userId)))
    .limit(1);
  return !!row;
}

/**
 * Anak bila user adalah pemilik ATAU penerima share ACCEPTED yang belum kadaluarsa.
 * Return undefined bila keduanya tidak — jangan bocorkan perbedaannya ke caller.
 */
export async function getChildForViewer(
  userId: string,
  childId: string,
): Promise<ViewerChild | undefined> {
  const owned = await getChild(userId, childId);
  if (owned) return { child: owned, role: "OWNER" };

  const [row] = await db
    .select({ child: children })
    .from(childShares)
    .innerJoin(children, eq(children.id, childShares.childId))
    .where(
      and(
        eq(childShares.childId, childId),
        eq(childShares.inviteeUserId, userId),
        eq(childShares.status, "ACCEPTED"),
        gt(childShares.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return row ? { child: row.child, role: "PARTNER" } : undefined;
}

/** Guard jalur catat (measurement/asupan/imunisasi): owner atau pasangan. */
export async function assertChildAccessible(userId: string, childId: string): Promise<boolean> {
  return !!(await getChildForViewer(userId, childId));
}

/**
 * `photoKey` sengaja di luar tipe ini: nilainya hanya boleh datang dari hasil
 * unggah ke penyimpanan (lihat `setChildPhotoKey`), tidak pernah dari field
 * form yang dikirim client.
 */
export type NewChild = Omit<
  typeof children.$inferInsert,
  "id" | "userId" | "createdAt" | "updatedAt" | "photoKey"
>;

export async function insertChild(userId: string, values: NewChild) {
  const [row] = await db
    .insert(children)
    .values({ ...values, userId })
    .returning();
  return row;
}

export async function updateChild(userId: string, childId: string, values: NewChild) {
  const [row] = await db
    .update(children)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(children.id, childId), eq(children.userId, userId)))
    .returning();
  return row;
}

/**
 * Pasang/lepas key foto, kembalikan key lama supaya pemanggil bisa menghapus
 * objek yang tergantikan. Kepemilikan tetap dicek lewat `userId`.
 */
export async function setChildPhotoKey(
  userId: string,
  childId: string,
  photoKey: string | null,
): Promise<{ previousKey: string | null } | undefined> {
  const existing = await getChild(userId, childId);
  if (!existing) return undefined;

  const [row] = await db
    .update(children)
    .set({ photoKey, updatedAt: new Date() })
    .where(and(eq(children.id, childId), eq(children.userId, userId)))
    .returning({ id: children.id });
  if (!row) return undefined;

  return { previousKey: existing.photoKey };
}

export async function deleteChild(userId: string, childId: string) {
  const [row] = await db
    .delete(children)
    .where(and(eq(children.id, childId), eq(children.userId, userId)))
    .returning({ id: children.id });
  return row;
}

/** Anak + pengukuran terakhirnya, untuk kartu dashboard. Satu query, bukan N+1. */
export async function listChildrenWithLatestMeasurement(userId: string) {
  const latest = db
    .select({
      childId: growthMeasurements.childId,
      measuredAt: growthMeasurements.measuredAt,
      weightKg: growthMeasurements.weightKg,
      lengthHeightCm: growthMeasurements.lengthHeightCm,
      headCircumferenceCm: growthMeasurements.headCircumferenceCm,
      rn: sql<number>`row_number() over (
        partition by ${growthMeasurements.childId}
        order by ${growthMeasurements.measuredAt} desc, ${growthMeasurements.createdAt} desc
      )`.as("rn"),
    })
    .from(growthMeasurements)
    .as("latest");

  return db
    .select({
      child: children,
      latestMeasuredAt: latest.measuredAt,
      latestWeightKg: latest.weightKg,
      latestLengthHeightCm: latest.lengthHeightCm,
      latestHeadCircumferenceCm: latest.headCircumferenceCm,
    })
    .from(children)
    .leftJoin(latest, and(eq(latest.childId, children.id), eq(latest.rn, 1)))
    .where(eq(children.userId, userId))
    .orderBy(desc(children.createdAt));
}

export type ChildWithLatest = Awaited<ReturnType<typeof listChildrenWithLatestMeasurement>>[number];

/** Versi viewer dari list di atas: milik sendiri + yang dibagikan, plus peran. */
export async function listChildrenWithLatestForViewer(
  userId: string,
): Promise<(ChildWithLatest & { role: "OWNER" | "PARTNER" })[]> {
  const [own, sharedRows] = await Promise.all([
    listChildrenWithLatestMeasurement(userId),
    listChildrenForViewer(userId),
  ]);
  const roles = new Map(sharedRows.map((v) => [v.child.id, v.role]));
  // ponytail: pengukuran terakhir anak shared di-query terpisah per anak —
  // jumlah anak yang dibagikan ke satu akun kecil; gabungkan ke window function
  // bila daftar ini membesar.
  const missing = [...roles.keys()].filter((id) => !own.some((r) => r.child.id === id));
  const shared = missing.length
    ? await listChildrenWithLatestMeasurementByChildIds(missing)
    : [];
  return [
    ...own.map((r) => ({ ...r, role: "OWNER" as const })),
    ...shared.map((r) => ({
      ...r,
      role: roles.get(r.child.id) ?? ("PARTNER" as const),
    })),
  ];
}

async function listChildrenWithLatestMeasurementByChildIds(childIds: string[]) {
  const latest = db
    .select({
      childId: growthMeasurements.childId,
      measuredAt: growthMeasurements.measuredAt,
      weightKg: growthMeasurements.weightKg,
      lengthHeightCm: growthMeasurements.lengthHeightCm,
      headCircumferenceCm: growthMeasurements.headCircumferenceCm,
      rn: sql<number>`row_number() over (
        partition by ${growthMeasurements.childId}
        order by ${growthMeasurements.measuredAt} desc, ${growthMeasurements.createdAt} desc
      )`.as("rn"),
    })
    .from(growthMeasurements)
    .as("latest");

  return db
    .select({
      child: children,
      latestMeasuredAt: latest.measuredAt,
      latestWeightKg: latest.weightKg,
      latestLengthHeightCm: latest.lengthHeightCm,
      latestHeadCircumferenceCm: latest.headCircumferenceCm,
    })
    .from(children)
    .leftJoin(latest, and(eq(latest.childId, children.id), eq(latest.rn, 1)))
    .where(inArray(children.id, childIds))
    .orderBy(desc(children.createdAt));
}

// ---------------------------------------------------------------------------
// Akses Pasangan (child_shares)
// ---------------------------------------------------------------------------

/** Umur undangan sebelum kedaluwarsa. */
const SHARE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Buat/perbarui undangan. PENDING untuk (childId, email) yang sama dipakai ulang:
 * token diganti agar link lama mati. Accept yang sudah terjadi tidak disentuh.
 */
export async function upsertShare(params: {
  childId: string;
  ownerId: string;
  inviteeEmail: string;
}): Promise<ChildShare> {
  const { childId, ownerId, inviteeEmail } = params;
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + SHARE_TTL_MS);

  //ponytail: cek-dulu-baru-upsert tanpa ON CONFLICT — race duplikat antar-klik
  // tombol tidak berbahaya (baris kembar dibersihkan pakai token termutakhir).
  const [existing] = await db
    .select()
    .from(childShares)
    .where(
      and(
        eq(childShares.childId, childId),
        eq(childShares.status, "PENDING"),
        sql`lower(${childShares.inviteeEmail}) = lower(${inviteeEmail})`,
      ),
    )
    .limit(1);

  if (existing) {
    const [row] = await db
      .update(childShares)
      .set({ token, expiresAt, updatedAt: new Date() })
      .where(eq(childShares.id, existing.id))
      .returning();
    return row;
  }

  const [row] = await db
    .insert(childShares)
    .values({ childId, ownerId, inviteeEmail, token, expiresAt })
    .returning();
  return row;
}

/** Share ber-token yang belum kedaluwarsa; kedaluwarsa dianggap tidak ada. */
export async function findShareByToken(token: string): Promise<ChildShare | undefined> {
  const [row] = await db
    .select()
    .from(childShares)
    .where(and(eq(childShares.token, token), gt(childShares.expiresAt, new Date())))
    .limit(1);
  return row;
}

/** Terima undangan: kunci inviteeUserId ke akun ini. Idempoten untuk pemakai ulang link. */
export async function acceptShare(shareId: string, inviteeUserId: string, inviteeEmail: string) {
  const [row] = await db
    .update(childShares)
    .set({ status: "ACCEPTED", inviteeUserId, updatedAt: new Date() })
    .where(
      and(
        eq(childShares.id, shareId),
        eq(childShares.status, "PENDING"),
        gt(childShares.expiresAt, new Date()),
        sql`lower(${childShares.inviteeEmail}) = lower(${inviteeEmail})`,
      ),
    )
    .returning();
  return row;
}

/**
 * Terima SEMUA undangan PENDING untuk email ini dari owner yang sama.
 * Dipanggil saat user membuka link undangan — karena share sekarang 1 per anak,
 * buka satu link langsung terima akses semua anak.
 */
export async function acceptAllPendingSharesFromOwner(
  ownerId: string,
  inviteeUserId: string,
  inviteeEmail: string,
) {
  return db
    .update(childShares)
    .set({ status: "ACCEPTED", inviteeUserId, updatedAt: new Date() })
    .where(
      and(
        eq(childShares.ownerId, ownerId),
        eq(childShares.status, "PENDING"),
        gt(childShares.expiresAt, new Date()),
        sql`lower(${childShares.inviteeEmail}) = lower(${inviteeEmail})`,
      ),
    )
    .returning();
}

/** Daftar undangan milik user (join nama anak), terbaru dulu. */
export async function listSharesByOwner(userId: string) {
  return db
    .select({
      share: childShares,
      childName: children.name,
    })
    .from(childShares)
    .innerJoin(children, eq(children.id, childShares.childId))
    .where(eq(childShares.ownerId, userId))
    .orderBy(desc(childShares.createdAt));
}

/** Cabut undangan/akses. Hanya pemilik yang bisa. */
export async function revokeShare(shareId: string, ownerId: string) {
  const [row] = await db
    .delete(childShares)
    .where(and(eq(childShares.id, shareId), eq(childShares.ownerId, ownerId)))
    .returning({ id: childShares.id });
  return row;
}
