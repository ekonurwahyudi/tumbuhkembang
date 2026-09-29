import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { loginSchema } from "@/schemas/auth";
import { authConfig, googleOAuthConfigured } from "./config";
import { userIdByEmail, withDbUserId } from "./db-user";

/** Hash dummy agar waktu respons login sama untuk email yang ada maupun tidak. */
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.7Z0QqCq9kZWcYEbLpZfLLyq4lJqQ7bK";

const googleConfigured = googleOAuthConfigured();

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

        // Akun Google (passwordHash null) tetap dibandingkan dengan hash dummy
        // supaya gagal dengan waktu yang sama seperti email yang tidak ada.
        const ok = await compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!ok || !user) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
    ...(googleConfigured
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            /**
             * Menghubungkan akun Google dengan akun email/password yang sudah
             * ada bila emailnya sama. Risiko: siapa pun bisa mendaftar akun
             * password dengan email orang lain sebelum pemiliknya masuk lewat
             * Google — registrasi email belum diverifikasi. Ditoleransi untuk
             * skala aplikasi ini; kencangkan dengan verifikasi email bila
             * dipakai luas.
             */
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Menimpa jwt() edge-safe di config: hanya di sini DB bisa diakses, dan hanya
     * lewat DB `users.id` yang sebenarnya bisa diketahui. Dijalankan sekali saat
     * login; pemanggilan berikutnya (tanpa `user`) meneruskan token apa adanya.
     */
    async jwt({ token, user }) {
      return user ? withDbUserId(token, user) : token;
    },
    // Name/email/role di session selalu fresh dari DB — edit profil dan perubahan peran
    // langsung berlaku tanpa login ulang. JWT hanya menyimpan id; biaya: satu query per
    // auth(). Peran di sinilah yang jadi batas keamanan, bukan klaim di token.
    async session({ session, token }) {
      if (token.id) {
        const [row] = await db
          .select({
            name: users.name,
            email: users.email,
            role: users.role,
            photoKey: users.photoKey,
          })
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1);
        // Query ini sekaligus penjaga: id yang tidak ada barisnya tidak pernah masuk
        // session. Melindungi token lama yang terbit sebelum jwt() memetakan id
        // OAuth ke users.id — tanpa ini, id palsunya bertahan 30 hari dan setiap
        // FK yang memakainya gagal. requireUser() akan menolak, user login ulang.
        if (!row) return session;
        session.user.id = token.id as string;
        session.user.name = row.name;
        session.user.email = row.email;
        session.user.role = row.role;
        // Dibawa di session supaya avatar di header ikut berubah begitu foto
        // profil diganti, tanpa query tambahan di tiap layout.
        session.user.photoKey = row.photoKey;
      }
      return session;
    },
    // Login Google pertama kali: buat baris user bila emailnya belum ada.
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) return true;

      if (await userIdByEmail(user.email)) return true;

      try {
        await db.insert(users).values({
          name: user.name ?? user.email.split("@")[0],
          email: user.email,
          passwordHash: null,
        });
      } catch (err) {
        // Kalah race dengan login pertama lain — barisnya sudah ada, lanjut.
        if (!(err && typeof err === "object" && "code" in err && err.code === "23505")) throw err;
      }
      return true;
    },
  },
});

/** Session user yang dijamin ada — dipakai semua server action/page terproteksi. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHENTICATED");
  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: session.user.role,
    photoKey: session.user.photoKey ?? null,
  };
}

/**
 * Batas keamanan sebenarnya untuk /admin dan semua action admin.
 *
 * Perannya dari session() di atas, yang membaca DB tiap kali — bukan dari klaim JWT
 * yang bisa berumur 30 hari. Penjaga di middleware hanya redirect untuk kenyamanan.
 */
export async function requireSuperadmin() {
  const user = await requireUser();
  if (user.role !== "SUPERADMIN") throw new Error("FORBIDDEN");
  return user;
}
