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

const METRICS = [
  {
    key: "weightKg",
    label: "Berat",
    icon: "scale",
    type: "weight-for-age",
    format: splitWeight,
    /** Selisih berat lebih terbaca dalam gram. */
    delta: (d: number) => `${d > 0 ? "+" : "−"}${Math.round(Math.abs(d) * 1000)} g`,
  },
  {
    key: "lengthHeightCm",
    label: "Tinggi",
    icon: "height",
    type: "length-for-age",
    format: splitLength,
    delta: (d: number) => `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(1).replace(".", ",")} cm`,
  },
  {
    key: "headCircumferenceCm",
    label: "L. Kepala",
    icon: "psychology",
    type: "head-circumference-for-age",
    format: splitHead,
    delta: (d: number) => `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(1).replace(".", ",")} cm`,
  },
] as const satisfies readonly {
  key: keyof GrowthMeasurement;
  label: string;
  icon: IconName;
  type: MeasurementType;
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
    <section className="bg-card space-y-3.5 rounded-2xl border p-4 shadow-sm">
      <div>
        <h2 className="text-headline-sm flex items-center gap-1.5">
          <Icon name="monitor_heart" className="text-primary text-[18px]" />
          Tumbuh Kembang Si Kecil
        </h2>
        <p className="text-muted-foreground text-body-sm mt-0.5">
          Pengukuran terakhir • {formatDate(latest.measuredAt)}
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-2.5">
        {METRICS.map(({ key, label, icon, type, format, delta }) => {
          const m = format(latest[key] as string | null);
          const prev = previous?.[key] as string | null | undefined;
          const now = latest[key] as string | null;
          const diff = now != null && prev != null ? Number(now) - Number(prev) : null;
          const result = byType.get(type);

          return (
            <div key={key} className="bg-muted border-border rounded-xl border p-2.5">
              <dt className="text-muted-foreground text-label-sm flex items-center justify-between gap-1">
                <span className="truncate">{label}</span>
                <Icon name={icon} className="text-primary shrink-0 text-[15px]" />
              </dt>
              <dd className="mt-1 flex items-baseline gap-0.5">
                <span className="text-metric tabular-nums">{m.value}</span>
                {m.unit && <span className="text-muted-foreground text-label-sm">{m.unit}</span>}
              </dd>
              <dd className="text-label-sm mt-0.5 flex items-center gap-0.5">
                {diff !== null && diff !== 0 ? (
                  <>
                    <Icon
                      name="trending_up"
                      className={`text-[13px] ${diff > 0 ? "" : "rotate-180"}`}
                    />
                    <span className="tabular-nums font-semibold">{delta(diff)}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">
                    {diff === 0 ? "tidak berubah" : "data pertama"}
                  </span>
                )}
              </dd>
              <dd className="text-muted-foreground text-label-sm mt-1.5 tabular-nums">
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
          className="bg-card text-body-md flex h-11 items-center justify-center gap-1.5 rounded-xl border font-bold active:scale-[0.97]"
        >
          Grafik WHO
          <Icon name="arrow_forward" className="text-[15px]" />
        </Link>
      </div>
    </section>
  );
}
