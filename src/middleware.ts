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
  matcher: [
    "/((?!api/auth|_next/static|_next/image|manifest.webmanifest|sw.js|offline.html|icons|apple-icon.png|favicon.ico).*)",
  ],
};
