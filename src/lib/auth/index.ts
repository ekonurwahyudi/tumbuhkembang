import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { loginSchema } from "@/schemas/auth";
import { authConfig } from "./config";

/** Hash dummy agar waktu respons login sama untuk email yang ada maupun tidak. */
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.7Z0QqCq9kZWcYEbLpZfLLyq4lJqQ7bK";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(sql`lower(${users.email})`, email))
          .limit(1);

        const ok = await compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!ok || !user) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
});

/** Session user yang dijamin ada — dipakai semua server action/page terproteksi. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHENTICATED");
  return { id: session.user.id, name: session.user.name ?? "", email: session.user.email ?? "" };
}
