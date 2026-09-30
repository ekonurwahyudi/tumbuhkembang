/** Formatter tampilan berbahasa Indonesia. Tidak ada logika medis di sini. */
import { formatWeeksDays } from "./growth/corrected-age";

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

const relativeFormatter = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" });

/**
 * "2 jam lalu", "kemarin". Dihitung di server dan dikirim sebagai string supaya
 * tidak ada selisih antara render server dan klien.
 */
export function formatRelative(value: Date, now: Date = new Date()): string {
  const seconds = Math.round((value.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return "baru saja";
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["minute", 60],
    ["hour", 3600],
    ["day", 86400],
    ["week", 604800],
    ["month", 2629800],
    ["year", 31557600],
  ];
  // Unit terbesar yang masih menghasilkan angka >= 1; mundur ke tahun bila semuanya lewat.
  let chosen = units[0];
  for (const u of units) if (abs >= u[1]) chosen = u;
  return relativeFormatter.format(Math.round(seconds / chosen[1]), chosen[0]);
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

/** Angka dan satuan terpisah, untuk ubin metrik yang menampilkannya beda ukuran. */
export function splitMeasure(
  value: string | null,
  unit: string,
  digits: number,
): { value: string; unit: string | null } {
  if (value === null) return { value: "—", unit: null };
  const n = Number(value);
  if (!Number.isFinite(n)) return { value: "—", unit: null };
  return {
    value: n.toLocaleString("id-ID", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }),
    unit,
  };
}

export const splitWeight = (v: string | null) => splitMeasure(v, "kg", 2);
export const splitLength = (v: string | null) => splitMeasure(v, "cm", 1);
export const splitHead = (v: string | null) => splitMeasure(v, "cm", 1);

const longDateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** "Senin, 24 Oktober 2026" — sapaan beranda. */
export const formatLongDate = (value: Date = new Date()) => longDateFormatter.format(value);

export const SEX_LABEL = { MALE: "Laki-laki", FEMALE: "Perempuan" } as const;
export const BIRTH_TYPE_LABEL = { TERM: "Cukup bulan", PRETERM: "Prematur" } as const;

/** Persentil untuk tampilan; ekor ekstrem ditulis sebagai batas, bukan angka palsu. */
export function formatPercentile(p: number): string {
  if (p < 0.1) return "< 0,1";
  if (p > 99.9) return "> 99,9";
  return p.toLocaleString("id-ID", { maximumFractionDigits: 1 });
}

/**
 * Label usia sesuai sumbunya.
 *
 * Sumbu PMA wajib ditulis dalam minggu: 230 hari PMA adalah "33 minggu", bukan
 * "8 bulan" — bayinya baru berumur beberapa minggu, dan angka bulan di sini
 * terbaca sebagai usia sejak lahir oleh siapa pun yang melihatnya.
 */
export function formatBasisAge(
  basis: "chronological" | "corrected" | "postmenstrual",
  days: number,
): string {
  if (basis === "postmenstrual") return formatWeeksDays(days);
  return `${basis === "corrected" ? "usia terkoreksi" : "usia"} ${formatAgeDaysLong(days)}`;
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
