import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ChartSeries } from "@/lib/growth/chart-data";
import { formatDate, formatPercentile } from "@/lib/format";

/**
 * Padanan teks untuk grafik: ringkasan naratif + tabel nilai.
 * Informasi pada grafik tidak boleh hanya tersedia secara visual.
 */
export function GrowthSummary({ series }: { series: ChartSeries }) {
  const latest = series.childPoints.at(-1);
  if (!latest) return null;

  const first = series.childPoints[0];
  const basis = series.ageBasis === "corrected" ? "usia terkoreksi" : "usia kronologis";

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Pengukuran terakhir {series.label.toLowerCase()} pada {formatDate(latest.measuredAt)}{" "}
        adalah{" "}
        <span className="text-foreground font-medium">
          {latest.value.toLocaleString("id-ID", { maximumFractionDigits: 2 })} {series.unit}
        </span>
        , yaitu z-score {latest.zScore >= 0 ? "+" : ""}
        {latest.zScore.toFixed(2)} atau persentil {formatPercentile(latest.percentile)} menurut{" "}
        {series.reference.name} ({series.reference.version}) berdasarkan {basis}.
        {series.childPoints.length > 1 && (
          <> Tercatat {series.childPoints.length} pengukuran sejak {formatDate(first.measuredAt)}.</>
        )}
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead className="text-right">{series.unit}</TableHead>
            <TableHead className="text-right">Z-score</TableHead>
            <TableHead className="text-right">Persentil</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...series.childPoints].reverse().map((p) => (
            <TableRow key={`${p.measuredAt}-${p.value}`}>
              <TableCell>{formatDate(p.measuredAt)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {p.value.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {p.zScore >= 0 ? "+" : ""}
                {p.zScore.toFixed(2)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPercentile(p.percentile)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
