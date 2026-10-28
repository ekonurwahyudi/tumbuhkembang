import Link from "next/link";
import { formatDate, formatPercentile, splitHead, splitLength, splitWeight } from "@/lib/format";
import { isGrowthResult, type GrowthOutcome, type MeasurementType } from "@/lib/growth/types";
import { Icon, type IconName } from "@/components/ui/icon";
import { IntakeStrip } from "@/components/feeding/intake-strip";
import { MeasurementDialog } from "@/components/measurements/measurement-dialog";
import type { EstimateInput } from "@/lib/feeding/calculator";
import type { GrowthMeasurement } from "@/db/schema";

/**
 * Ubin metrik pengukuran terakhir + selisih dari pengukuran sebelumnya.
 *
 * Angka z-score dan persentil ditampilkan apa adanya — tanpa label penilaian
 * ("normal", "gizi baik", "kurang gizi"). Aturan ini berlaku di seluruh tampilan
 * pertumbuhan: penilaian klinis adalah tugas tenaga kesehatan, bukan aplikasi ini.
 */

/**
 * Nuansa per metrik, sebahasa dengan ubin di AgeCard: tint lembut + teks gelap
 * sewarna. Tiga ubin abu seragam terbaca sebagai satu blok yang harus dibaca kata
 * per kata; warna memberi tiap metrik bentuk ingatan sendiri.
 *
 * Warna di sini HANYA pembeda tempat, bukan penilaian: labelnya selalu tertulis,
 * dan z-score/persentil tetap angka — aturan yang sama dengan QuickAccess.
 */
const TONE = {
  emerald: "bg-emerald-50 text-emerald-950 dark:bg-emerald-500/15 dark:text-emerald-50",
  sky: "bg-sky-50 text-sky-950 dark:bg-sky-500/15 dark:text-sky-50",
  violet: "bg-violet-50 text-violet-950 dark:bg-violet-500/15 dark:text-violet-50",
} as const;

const METRICS = [
  {
    key: "weightKg",
    label: "Berat",
    icon: "scale",
    type: "weight-for-age",
    tone: TONE.emerald,
    format: splitWeight,
    /** Selisih berat lebih terbaca dalam gram. */
    delta: (d: number) => `${d > 0 ? "+" : "−"}${Math.round(Math.abs(d) * 1000)} g`,
  },
  {
    key: "lengthHeightCm",
    label: "Tinggi",
    icon: "height",
    type: "length-for-age",
    tone: TONE.sky,
    format: splitLength,
    delta: (d: number) => `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(1).replace(".", ",")} cm`,
  },
  {
    key: "headCircumferenceCm",
    label: "L. Kepala",
    icon: "psychology",
    type: "head-circumference-for-age",
    tone: TONE.violet,
    format: splitHead,
    delta: (d: number) => `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(1).replace(".", ",")} cm`,
  },
] as const satisfies readonly {
  key: keyof GrowthMeasurement;
  label: string;
  icon: IconName;
  type: MeasurementType;
  tone: string;
  format: (v: string | null) => { value: string; unit: string | null };
  delta: (d: number) => string;
}[];

export function GrowthHighlight({
  childId,
  minDate,
  latest,
  previous,
  outcomes,
  intake,
}: {
  childId: string;
  minDate: string;
  latest: GrowthMeasurement;
  previous: GrowthMeasurement | undefined;
  outcomes: GrowthOutcome[];
  /** Estimasi asupan; stripnya menyembunyikan diri saat tidak berlaku. */
  intake: EstimateInput;
}) {
  const byType = new Map(outcomes.filter(isGrowthResult).map((o) => [o.measurementType, o]));

  return (
    <section className="bg-card space-y-3.5 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
          <Icon name="monitor_heart" filled className="text-[16px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-headline-sm truncate">Tumbuh Kembang Si Kecil</h2>
          <p className="text-muted-foreground text-body-sm mt-0.5">
            Pengukuran terakhir • {formatDate(latest.measuredAt)}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2.5">
        {METRICS.map(({ key, label, icon, type, tone, format, delta }) => {
          const m = format(latest[key] as string | null);
          const prev = previous?.[key] as string | null | undefined;
          const now = latest[key] as string | null;
          const diff = now != null && prev != null ? Number(now) - Number(prev) : null;
          const result = byType.get(type);

          return (
            <div key={key} className={`relative overflow-hidden rounded-xl p-2.5 ${tone}`}>
              {/* Lingkaran dekoratif, bahasa yang sama dengan ubin usia. */}
              <span
                aria-hidden
                className="pointer-events-none absolute -top-5 -right-5 size-14 rounded-full bg-white/40 dark:bg-white/5"
              />
              <dt className="text-label-sm relative flex items-center justify-between gap-1 font-bold opacity-80">
                <span className="truncate">{label}</span>
                <Icon name={icon} filled className="shrink-0 text-[15px]" />
              </dt>
              <dd className="relative mt-1 flex items-baseline gap-0.5">
                <span className="text-metric tabular-nums">{m.value}</span>
                {m.unit && <span className="text-label-sm opacity-80">{m.unit}</span>}
              </dd>
              <dd className="text-label-sm relative mt-0.5 flex items-center gap-0.5">
                {diff !== null && diff !== 0 ? (
                  <>
                    <Icon
                      name="trending_up"
                      className={`text-[13px] ${diff > 0 ? "" : "rotate-180"}`}
                    />
                    <span className="tabular-nums font-semibold">{delta(diff)}</span>
                  </>
                ) : (
                  <span className="opacity-70">
                    {diff === 0 ? "tidak berubah" : "data pertama"}
                  </span>
                )}
              </dd>
              <dd className="text-label-sm relative mt-1.5 tabular-nums opacity-70">
                {result
                  ? `Z ${result.zScore >= 0 ? "+" : "−"}${Math.abs(result.zScore).toFixed(2)} • P${formatPercentile(result.percentile)}`
                  : "—"}
              </dd>
            </div>
          );
        })}
      </dl>

      <IntakeStrip input={intake} />

      <div className="grid grid-cols-2 gap-2.5">
        <MeasurementDialog
          childId={childId}
          minDate={minDate}
          trigger={
            <button className="bg-primary text-primary-foreground text-body-md flex h-11 items-center justify-center gap-1.5 rounded-xl font-bold active:scale-[0.97]">
              <Icon name="add" className="text-[17px]" />
              Catat Pengukuran
            </button>
          }
        />
        <Link
          href={`/children/${childId}/`}
          className="bg-muted text-body-md flex h-11 items-center justify-center gap-1.5 rounded-xl font-bold active:scale-[0.97]"
        >
          Grafik WHO
          <Icon name="arrow_forward" className="text-[15px]" />
        </Link>
      </div>
    </section>
  );
}
