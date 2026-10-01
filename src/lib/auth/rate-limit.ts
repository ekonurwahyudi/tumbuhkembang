/**
 * Rate limit in-memory untuk login.
 * ponytail: per-instance saja — pindah ke Redis/Upstash kalau app di-scale multi-instance.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/**
 * `max` bisa dinaikkan per pemanggil: 5 itu angka untuk percobaan sandi, dan terlalu
 * ketat untuk hal yang wajar diulang — mengisi wishlist 6 barang sekali duduk bukan
 * serangan. Default tetap 5 supaya jalur login tidak ikut berubah.
 */
export function checkRateLimit(
  key: string,
  max = MAX_ATTEMPTS,
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }
  entry.count += 1;
  if (entry.count > max) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function resetRateLimit(key: string) {
  attempts.delete(key);
}

/** Buang entry kedaluwarsa supaya Map tidak tumbuh tanpa batas. */
export function pruneRateLimit(now = Date.now()) {
  for (const [k, v] of attempts) if (now > v.resetAt) attempts.delete(k);
}
