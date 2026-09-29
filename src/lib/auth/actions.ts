"use server";

import { hash } from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { loginSchema, registerSchema } from "@/schemas/auth";
import { fail, fieldErrors, handleUnexpected, ok, type ActionResult } from "@/lib/action-result";
import { signIn, signOut } from "./index";
import { googleOAuthConfigured } from "./config";
import { checkRateLimit, pruneRateLimit, resetRateLimit } from "./rate-limit";

const BCRYPT_ROUNDS = 12;

async function clientKey(suffix: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return `${ip}:${suffix}`;
}

export async function registerAction(formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    terms: formData.get("terms") === "on",
  });
  if (!parsed.success)
    return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

  const { name, email, password } = parsed.data;

  try {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(sql`lower(${users.email})`, email))
      .limit(1);
    if (existing)
      return fail("EMAIL_TAKEN", "Email sudah terdaftar", { email: "Email sudah terdaftar" });

    await db.insert(users).values({ name, email, passwordHash: await hash(password, BCRYPT_ROUNDS) });
  } catch (err) {
    // Unique index bisa kalah race dengan pengecekan di atas.
    if (err && typeof err === "object" && "code" in err && err.code === "23505")
      return fail("EMAIL_TAKEN", "Email sudah terdaftar", { email: "Email sudah terdaftar" });
    return handleUnexpected("registerAction", err);
  }

  await signIn("credentials", { email, password, redirect: false });
  redirect("/dashboard");
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success)
    return fail("VALIDATION_ERROR", "Email atau password salah", fieldErrors(parsed.error.issues));

  pruneRateLimit();
  const key = await clientKey(parsed.data.email);
  const limit = checkRateLimit(key);
  if (!limit.allowed)
    return fail(
      "RATE_LIMITED",
      `Terlalu banyak percobaan masuk. Coba lagi dalam ${Math.ceil(limit.retryAfterSec / 60)} menit.`,
    );

  try {
    await signIn("credentials", { ...parsed.data, redirect: false });
    resetRateLimit(key);
  } catch (err) {
    if (err instanceof AuthError) return fail("INVALID_CREDENTIALS", "Email atau password salah");
    return handleUnexpected("loginAction", err);
  }

  // ?next= hanya boleh path internal — cegah open redirect lewat URL absolut.
  const next = formData.get("next");
  redirect(
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/dashboard",
  );
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

/**
 * Dipanggil tombol Google di halaman login/daftar. Bila kredensial Google
 * belum diisi, kembalikan error agar tombolnya bisa memunculkan toast —
 * tombol tetap tampil supaya tampilannya sama dengan desain.
 *
 * Saat berhasil, `signIn` melempar NEXT_REDIRECT ke Google — biarkan lewat,
 * jangan ditangkap.
 */
export async function googleSignInAction(): Promise<ActionResult> {
  if (!googleOAuthConfigured())
    return fail("NOT_CONFIGURED", "Login Google belum dikonfigurasi di server.");
  await signIn("google", { redirectTo: "/dashboard" });
  return ok(undefined); // tak tercapai — signIn selalu melempar redirect
}

export { ok };
