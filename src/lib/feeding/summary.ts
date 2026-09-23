import { todayLocalISO } from "@/schemas/date";
import type { FeedingLog } from "@/db/schema";

/**
 * Ringkasan asupan harian.
 *
 * Aturan yang tidak boleh dilanggar: sesi menyusui langsung tanpa volume
 * TIDAK pernah dijumlahkan ke total ml. Volume ASI langsung memang tidak
 * selalu dapat diketahui, dan menebaknya akan membuat total tampak pasti
 * padahal bukan. Sesi seperti itu hanya dihitung sebagai jumlah sesi.
 */

export type FeedingSummary = {
  /** Tanggal lokal, YYYY-MM-DD. */
  date: string;
  /** Sesi ASI langsung, termasuk yang volumenya diketahui. */
  breastDirectSessions: number;
  /** Volume ASI langsung yang kebetulan tercatat; terpisah dari jumlah sesi. */
  breastDirectMl: number | null;
  expressedMl: number | null;
  formulaMl: number | null;
  /** Jumlah seluruh volume yang benar-benar terukur. */
  totalMeasuredMl: number | null;
  /** true bila ada sesi tanpa volume — total terukur belum mencakup semuanya. */
  hasUnmeasuredSessions: boolean;
  totalSessions: number;
};

/** Tanggal lokal dari timestamp, dipakai mengelompokkan log per hari. */
export function localDateOf(fedAt: Date): string {
  return todayLocalISO(fedAt);
}

const toMl = (v: string | null): number | null => {
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Jumlahkan, dengan null berarti "tidak ada nilai terukur" dan bukan nol. */
function addMl(acc: number | null, value: number | null): number | null {
  if (value === null) return acc;
  return (acc ?? 0) + value;
}

export function summarizeDay(logs: FeedingLog[], date: string): FeedingSummary {
  const summary: FeedingSummary = {
    date,
    breastDirectSessions: 0,
    breastDirectMl: null,
    expressedMl: null,
    formulaMl: null,
    totalMeasuredMl: null,
    hasUnmeasuredSessions: false,
    totalSessions: 0,
  };

  for (const log of logs) {
    const ml = toMl(log.amountMl);
    summary.totalSessions += 1;

    if (log.feedingType === "BREAST_DIRECT") {
      summary.breastDirectSessions += 1;
      summary.breastDirectMl = addMl(summary.breastDirectMl, ml);
    } else if (log.feedingType === "EXPRESSED_BREAST_MILK") {
      summary.expressedMl = addMl(summary.expressedMl, ml);
    } else {
      summary.formulaMl = addMl(summary.formulaMl, ml);
    }

    if (ml === null) summary.hasUnmeasuredSessions = true;
    summary.totalMeasuredMl = addMl(summary.totalMeasuredMl, ml);
  }

  return summary;
}

/** Kelompokkan log menjadi hari-hari lokal, terbaru lebih dulu. */
export function groupByDay(logs: FeedingLog[]): { date: string; logs: FeedingLog[] }[] {
  const byDate = new Map<string, FeedingLog[]>();

  for (const log of logs) {
    const date = localDateOf(log.fedAt);
    const bucket = byDate.get(date);
    if (bucket) bucket.push(log);
    else byDate.set(date, [log]);
  }

  return [...byDate.entries()]
    .map(([date, dayLogs]) => ({
      date,
      logs: [...dayLogs].sort((a, b) => b.fedAt.getTime() - a.fedAt.getTime()),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
