/**
 * Perbandingan tanggal untuk kolom DATE (YYYY-MM-DD).
 *
 * Perbandingan dilakukan sebagai string, bukan lewat objek Date: `new Date("2026-09-23")`
 * diurai sebagai tengah malam UTC lalu dibandingkan dengan waktu lokal, sehingga di zona
 * waktu timur (mis. WIB, UTC+7) tanggal besok lolos sebagai "bukan masa depan".
 * String ISO berurutan secara leksikografis, jadi perbandingan langsung selalu benar.
 */

/** Tanggal hari ini menurut kalender lokal pengguna, dalam format YYYY-MM-DD. */
export function todayLocalISO(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** true bila `ymd` tidak melewati hari ini (kalender lokal). */
export function isNotFuture(ymd: string, now = new Date()): boolean {
  return ymd <= todayLocalISO(now);
}

/** Format tanggal ISO yang valid secara kalender (menolak 2026-02-31). */
export function isValidYMD(ymd: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const [y, m, d] = ymd.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  return (
    probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d
  );
}
