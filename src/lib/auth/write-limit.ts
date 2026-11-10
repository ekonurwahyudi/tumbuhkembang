import "server-only";
import { headers } from "next/headers";
import { checkRateLimit, pruneRateLimit } from "./rate-limit";
import { fail, type ActionResult } from "@/lib/action-result";

/**
 * Laju tulis per akun. Kuota paket menjawab "berapa banyak boleh ada";
 * ini menjawab "berapa cepat boleh dibuat" — dua hal berbeda, dan yang kedua
 * tetap perlu walau paketnya tanpa batas. VIP tanpa batas anak tidak berarti
 * VIP boleh menyuntik sejuta baris dalam semenit.
 *
 * Kuncinya userId, bukan IP: satu rumah di belakang satu NAT tidak saling
 * memblokir, dan ganti IP tidak mengulang jatah dari nol.
 */
const PER_WINDOW = 30;

export async function limitWrite(
  scope: string,
  userId: string,
  max = PER_WINDOW,
): Promise<ActionResult<never> | null> {
  pruneRateLimit();
  const limit = checkRateLimit(`w:${scope}:${userId}`, max);
  if (limit.allowed) return null;
  const menit = Math.ceil(limit.retryAfterSec / 60);
  return fail(
    "RATE_LIMITED",
    `Terlalu banyak data dikirim sekaligus. Coba lagi dalam ${menit} menit.`,
  );
}

/**
 * Laju per IP untuk jalur tanpa sesi — pendaftaran. Di sini userId belum ada,
 * jadi IP adalah satu-satunya pegangan, dengan kelemahannya yang sudah diketahui.
 */
export async function limitByIp(
  scope: string,
  max: number,
): Promise<ActionResult<never> | null> {
  pruneRateLimit();
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = checkRateLimit(`ip:${scope}:${ip}`, max);
  if (limit.allowed) return null;
  const menit = Math.ceil(limit.retryAfterSec / 60);
  return fail("RATE_LIMITED", `Terlalu banyak percobaan. Coba lagi dalam ${menit} menit.`);
}
