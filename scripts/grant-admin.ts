/**
 * Naikkan / turunkan peran SUPERADMIN.
 *
 *   npm run admin:grant -- eko@example.com            # → SUPERADMIN
 *   npm run admin:grant -- eko@example.com --revoke   # → USER
 *
 * Sengaja tanpa UI: kalau tidak ada satu pun server action yang bisa menulis kolom
 * `role`, permukaan serangan eskalasi hak akses nol. Akses DB sudah jadi syaratnya.
 *
 * Perubahan langsung berlaku tanpa login ulang: session() di src/lib/auth/index.ts
 * membaca peran dari DB setiap auth(). Cukup muat ulang halaman.
 */
import { eq, sql } from "drizzle-orm";
import { db } from "../src/db";
import { users } from "../src/db/schema";

async function main() {
  const args = process.argv.slice(2);
  const revoke = args.includes("--revoke");
  const email = args.find((a) => !a.startsWith("--"));

  if (!email) {
    console.error("Pakai: npm run admin:grant -- <email> [--revoke]");
    process.exit(1);
  }

  const role = revoke ? "USER" : "SUPERADMIN";
  const [row] = await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(sql`lower(${users.email})`, email.toLowerCase()))
    .returning({ email: users.email, role: users.role });

  if (!row) {
    console.error(`Tidak ada akun dengan email ${email}.`);
    process.exit(1);
  }

  console.log(`${row.email} sekarang berperan ${row.role}. Muat ulang halaman, tanpa login ulang.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
