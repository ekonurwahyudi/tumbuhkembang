import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const loggedIn = !!req.auth?.user;

  if (!loggedIn && !isPublic && pathname !== "/")
    return NextResponse.redirect(new URL("/login", req.nextUrl));

  if (loggedIn && (isPublic || pathname === "/"))
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));

  return NextResponse.next();
});

export const config = {
  // Aset publik PWA dilewatkan: semuanya harus dapat diambil tanpa sesi, termasuk
  // oleh service worker dan oleh browser saat memasang aplikasi.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|manifest.webmanifest|sw.js|offline.html|robots.txt|icons|apple-icon.png|icon.png|favicon.ico).*)",
  ],
};
