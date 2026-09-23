import { isGrowthResult, type GrowthOutcome, type MeasurementType } from "@/lib/growth/types";
import { formatPercentile } from "@/lib/format";

/**
 * Z-score dan persentil pengukuran terakhir.
 *
 * Tidak memberi vonis medis ("kurang gizi", "normal") — hanya menyajikan angka
 * beserta reference-nya. Penilaian klinis adalah tugas tenaga kesehatan.
 */

const LABEL: Record<MeasurementType, string> = {
  "weight-for-age": "Berat",
  "length-for-age": "Tinggi",
  "head-circumference-for-age": "Kepala",
};

export function GrowthBadges({ outcomes }: { outcomes: GrowthOutcome[] }) {
  const results = outcomes.filter(isGrowthResult);
  if (results.length === 0) return null;

  return (
    <dl className="grid grid-cols-3 gap-3 text-sm">
      {results.map((r) => (
        <div key={r.measurementType}>
          <dt className="text-muted-foreground">{LABEL[r.measurementType]}</dt>
          <dd className="font-medium tabular-nums">
            {r.zScore >= 0 ? "+" : ""}
            {r.zScore.toFixed(2)} SD
          </dd>
          <dd className="text-muted-foreground text-xs tabular-nums">
            persentil {formatPercentile(r.percentile)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
