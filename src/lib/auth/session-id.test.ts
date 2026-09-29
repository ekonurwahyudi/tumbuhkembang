/**
 * Tanpa DB adapter, Auth.js mengarang `user.id` untuk login OAuth — id yang tidak
 * pernah ada di tabel `users`. Menaruhnya di token membuat tiap FK yang memakai id
 * sesi gagal (dulu: `child_shares_invitee_user_id_users_id_fk` saat menerima undangan).
 * Berjalan di database sungguhan, seperti authorization.test.ts.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { userIdByEmail, withDbUserId } from "@/lib/auth/db-user";

const email = `oauth-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
let dbId: string;

beforeAll(async () => {
  const [row] = await db
    .insert(users)
    .values({ name: "Oauth User", email, passwordHash: null })
    .returning();
  dbId = row.id;
});

afterAll(async () => {
  await db.delete(users).where(eq(users.id, dbId));
});

describe("withDbUserId", () => {
  it("memakai users.id, bukan id karangan provider", async () => {
    const token = await withDbUserId({} as { id?: unknown; name?: unknown }, {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Oauth User",
      email,
    });
    expect(token.id).toBe(dbId);
  });

  it("cocok tanpa peduli besar-kecil huruf email", async () => {
    const token = await withDbUserId({} as { id?: unknown; name?: unknown }, {
      email: email.toUpperCase(),
    });
    expect(token.id).toBe(dbId);
  });

  it("tidak menyimpan id bila barisnya tidak ada — requireUser() menolak", async () => {
    const token = await withDbUserId({ id: "stale" } as { id?: unknown; name?: unknown }, {
      id: "22222222-2222-2222-2222-222222222222",
      email: `nobody-${email}`,
    });
    expect(token.id).toBeUndefined();
  });
});

describe("userIdByEmail", () => {
  it("null untuk email yang tidak terdaftar", async () => {
    expect(await userIdByEmail(`missing-${email}`)).toBeNull();
  });
});
