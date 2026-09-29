import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/invite", "/kado"];

/** Paths accessible without auth that should NOT redirect logged-in users to dashboard. */
const PUBLIC_NO_BOUNCE = ["/invite", "/kado"];

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const loggedIn = !!req.auth?.user;

  if (!loggedIn && !isPublic && pathname !== "/") {
    const login = new URL("/login", req.nextUrl);
    // Tujuan asli dibawa agar setelah masuk kembali ke halaman itu
    // (mis. menerima undangan /invite/[token]).
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  if (loggedIn && (isPublic || pathname === "/")) {
    // /invite harus tetap dapat diakses walau sudah login (halaman terima undangan).
    if (PUBLIC_NO_BOUNCE.some((p) => pathname.startsWith(p))) return NextResponse.next();
    // ?next= hanya untuk path internal aplikasi — bukan open redirect.
    const next = req.nextUrl.searchParams.get("next");
    const target = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    return NextResponse.redirect(new URL(target, req.nextUrl));
  }

  // /admin sengaja TIDAK dijaga di sini. req.auth cuma punya klaim JWT yang terbit saat
  // login dan hidup 30 hari, jadi admin yang baru dinaikkan perannya akan ditendang
  // sampai login ulang — penjaga yang salah menolak. Penjaganya requireSuperadmin() di
  // layout (admin) dan di setiap action admin; keduanya membaca peran dari DB.
  return NextResponse.next();
});

export const config = {
  // Aset publik PWA dilewatkan: semuanya harus dapat diambil tanpa sesi, termasuk
  // oleh service worker dan oleh browser saat memasang aplikasi.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|manifest.webmanifest|sw.js|offline.html|robots.txt|icons|fonts|apple-icon.png|icon.png|favicon.ico|brand-logo.png).*)",
  ],
};
