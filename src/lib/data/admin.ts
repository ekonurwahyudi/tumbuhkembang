import "server-only";
import { count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { children, users } from "@/db/schema";
import type { NewChild } from "./children";

/**
 * Jalur data SUPERADMIN: satu-satunya modul di `src/lib/data/` yang query-nya TIDAK
 * ber-scope ke pemilik.
 *
 * Sengaja dipisah, bukan dengan melebarkan fungsi di children.ts jadi "owner atau
 * admin": kalau digabung, setiap pemanggil lama ikut memikul risikonya, dan tidak ada
 * lagi cara cepat mengaudit bypass-nya. Di sini `grep admin` menemukan semuanya.
 *
 * Setiap pemanggil WAJIB sudah lewat `requireSuperadmin()` — fungsi di modul ini tidak
 * punya parameter userId, jadi tidak ada otorisasi yang bisa dilakukannya sendiri.
 */

// ponytail: 100 baris + kotak cari. Tambah cursor bila datanya melewati itu.
const LIST_LIMIT = 100;

/** Dua COUNT untuk dashboard admin. */
export async function adminStats(): Promise<{ parents: number; children: number }> {
  const [[parents], [kids]] = await Promise.all([
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(children),
  ]);
  return { parents: parents.n, children: kids.n };
}

/** Pencarian nama/email; kosong berarti semua. */
const nameOrEmailLike = (q?: string) =>
  q?.trim() ? or(ilike(users.name, `%${q.trim()}%`), ilike(users.email, `%${q.trim()}%`)) : undefined;

export async function adminListParents(q?: string) {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      createdAt: users.createdAt,
      // Jumlah anak per orang tua lewat subquery, bukan groupBy: leftJoin + groupBy
      // memaksa setiap kolom users masuk GROUP BY dan membuat query ini sulit dibaca.
      //
      // Nama tabel ditulis mentah dan berkualifikasi: di dalam template sql`` interpolasi
      // kolom drizzle kehilangan prefiks tabel, jadi `c.user_id = users.id` sempat jadi
      // `user_id = id` — dua kolom children yang tak pernah sama, dan hitungannya 0.
      childCount:
        sql<number>`(select count(*)::int from children c where c.user_id = users.id)`,
    })
    .from(users)
    .where(nameOrEmailLike(q))
    .orderBy(desc(users.createdAt))
    .limit(LIST_LIMIT);
}

export type AdminParentRow = Awaited<ReturnType<typeof adminListParents>>[number];

export async function adminGetParent(userId: string) {
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row;
}

export async function adminUpdateParent(
  userId: string,
  values: { name: string; email: string; phone: string | null },
) {
  const [row] = await db
    .update(users)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ id: users.id });
  return row;
}

/** Cascade FK ikut membawa anak, pengukuran, catatan asupan, imunisasi, dan undangan. */
export async function adminDeleteParent(userId: string) {
  const [row] = await db
    .delete(users)
    .where(eq(users.id, userId))
    .returning({ id: users.id, photoKey: users.photoKey });
  return row;
}

export async function adminListChildren(q?: string) {
  const term = q?.trim();
  return db
    .select({
      child: children,
      ownerId: users.id,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(children)
    .innerJoin(users, eq(users.id, children.userId))
    .where(
      term
        ? or(
            ilike(children.name, `%${term}%`),
            ilike(users.name, `%${term}%`),
            ilike(users.email, `%${term}%`),
          )
        : undefined,
    )
    .orderBy(desc(children.createdAt))
    .limit(LIST_LIMIT);
}

export type AdminChildRow = Awaited<ReturnType<typeof adminListChildren>>[number];

export async function adminGetChild(childId: string) {
  const [row] = await db
    .select({ child: children, ownerName: users.name, ownerEmail: users.email })
    .from(children)
    .innerJoin(users, eq(users.id, children.userId))
    .where(eq(children.id, childId))
    .limit(1);
  return row;
}

export async function adminUpdateChild(childId: string, values: NewChild) {
  const [row] = await db
    .update(children)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(children.id, childId))
    .returning({ id: children.id });
  return row;
}

export async function adminDeleteChild(childId: string) {
  const [row] = await db
    .delete(children)
    .where(eq(children.id, childId))
    .returning({ id: children.id, photoKey: children.photoKey });
  return row;
}
