/** Formatter tampilan berbahasa Indonesia. Tidak ada logika medis di sini. */

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });

/** Tanggal DATE dari DB (YYYY-MM-DD) — di-parse sebagai waktu lokal, bukan UTC. */
export function formatDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return dateFormatter.format(new Date(y, m - 1, d));
}

export function formatDateTime(value: Date): string {
  return `${dateFormatter.format(value)}, ${timeFormatter.format(value)}`;
}

/** numeric dari Postgres datang sebagai string; tampilkan apa adanya dengan koma desimal. */
export function formatDecimal(value: string | null, unit: string, digits = 2): string {
  if (value === null) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${unit}`;
}

export const formatWeight = (v: string | null) => formatDecimal(v, "kg", 2);
export const formatLength = (v: string | null) => formatDecimal(v, "cm", 1);
export const formatHead = (v: string | null) => formatDecimal(v, "cm", 1);

export const SEX_LABEL = { MALE: "Laki-laki", FEMALE: "Perempuan" } as const;
export const BIRTH_TYPE_LABEL = { TERM: "Cukup bulan", PRETERM: "Prematur" } as const;
