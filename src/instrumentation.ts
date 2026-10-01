/**
 * Dijalankan sekali saat instance server Next hidup.
 *
 * Satu-satunya isinya penyapu pengingat vaksin: `remind_on`/`remind_time` yang
 * disetel orang tua butuh pemicu waktu, dan tanpa ini tidak ada apa pun yang
 * membacanya (lihat `lib/notifications/reminder-sweep.ts`).
 *
 * Dua pagar:
 * - Runtime Node saja. `register` dipanggil di semua runtime, dan Edge tidak punya
 *   `setInterval` yang hidup lama maupun koneksi Postgres.
 * - Bukan saat build. `next build` memuat berkas ini, dan di dalam Docker build
 *   database-nya hanya placeholder — timer di sana cuma melahirkan galat koneksi.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { startReminderSweep } = await import("./lib/notifications/reminder-sweep");
  startReminderSweep();
}
