import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

/**
 * `users.id` untuk sebuah email, atau null bila belum ada barisnya.
 *
 * Terpisah dari index.ts supaya bisa diuji: mengimpor index.ts berarti mengimpor
 * NextAuth, yang butuh runtime Next.
 */
export async function userIdByEmail(email: string) {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(sql`lower(${users.email})`, email.toLowerCase()))
    .limit(1);
  return row?.id ?? null;
}

/**
 * Isi `token.id` dari DB, bukan dari `user.id`.
 *
 * Tanpa DB adapter, Auth.js mengarang `user.id` sendiri untuk login OAuth — id itu
 * tidak pernah ada di tabel `users`, jadi menaruhnya di token membuat setiap FK
 * yang memakai id sesi gagal (`child_shares_invitee_user_id_users_id_fk` saat
 * menerima undangan). Provider Credentials sudah mengembalikan id DB; hanya jalur
 * OAuth yang perlu dipetakan — tapi memetakan keduanya lebih murah daripada
 * mencabangkan per provider.
 *
 * Baris user dijamin ada oleh callback signIn(). Bila entah bagaimana tidak, token
 * dibiarkan tanpa id — requireUser() menolak, bukan menyimpan id palsu.
 *
 * `role` sengaja TIDAK disimpan di token: jwt() hanya jalan saat login dan token hidup
 * 30 hari, jadi klaim peran akan basi persis saat dibutuhkan (admin yang baru dinaikkan
 * perannya ditolak sampai login ulang). Peran selalu dibaca dari DB di session().
 */
export async function withDbUserId<T extends { id?: unknown; name?: unknown }>(
  token: T,
  user: { id?: string; name?: string | null; email?: string | null },
) {
  token.name = user.name ?? token.name;
  const id = user.email ? await userIdByEmail(user.email) : null;
  if (id) token.id = id;
  else delete token.id;
  return token;
}
