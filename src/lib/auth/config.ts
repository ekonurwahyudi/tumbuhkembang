import type { NextAuthConfig } from "next-auth";

/** Config tanpa dependency Node (bcrypt/db) supaya aman dipakai middleware edge. */
/** Dipakai provider di index.ts dan tombol Google di halaman login/daftar. */
export const googleOAuthConfigured = () =>
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

export const authConfig = {
  /**
   * Auth.js hanya mempercayai Host header secara otomatis di Vercel. Di self-host
   * (termasuk localhost) permintaan ditolak dengan UntrustedHost kecuali ini aktif.
   *
   * Konsekuensi keamanan: Host header berasal dari client. Di production, reverse
   * proxy WAJIB men-set Host/X-Forwarded-Host ke domain aplikasi yang sebenarnya,
   * atau setel AUTH_URL agar callback URL tidak dapat dibelokkan ke domain lain.
   */
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.name = user.name ?? token.name;
      }
      return token;
    },
    /**
     * Versi ini yang dipakai middleware (index.ts menimpanya untuk app). Sengaja tanpa
     * `role`: middleware tidak punya akses DB, dan peran dari klaim JWT basi sampai user
     * login ulang. Satu-satunya sumber peran adalah session() di index.ts yang baca DB.
     */
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
