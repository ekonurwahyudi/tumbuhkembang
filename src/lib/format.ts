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

/** Persentil untuk tampilan; ekor ekstrem ditulis sebagai batas, bukan angka palsu. */
export function formatPercentile(p: number): string {
  if (p < 0.1) return "< 0,1";
  if (p > 99.9) return "> 99,9";
  return p.toLocaleString("id-ID", { maximumFractionDigits: 1 });
}

/** Label usia panjang untuk tooltip dan ringkasan: "8 bulan", "2 tahun 6 bulan". */
export function formatAgeDaysLong(days: number): string {
  if (days < 61) return `${days} hari`;
  const months = Math.round(days / 30.4375);
  if (months < 24) return `${months} bulan`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest === 0 ? `${years} tahun` : `${years} tahun ${rest} bulan`;
}
