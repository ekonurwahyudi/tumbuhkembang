import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Icon } from "@/components/ui/icon";
import type { ChartSeries } from "@/lib/growth/chart-data";
import { formatDate, formatPercentile } from "@/lib/format";
import type { AgeBasis } from "@/lib/growth/types";

const BASIS_LABEL: Record<AgeBasis, string> = {
  chronological: "usia kronologis",
  corrected: "usia terkoreksi",
  postmenstrual: "usia pascamenstruasi (PMA)",
};

/**
 * Padanan teks untuk grafik: ringkasan naratif + tabel nilai.
 * Informasi pada grafik tidak boleh hanya tersedia secara visual.
 *
 * Angka z-score dan persentil ditampilkan apa adanya. Template desain menaruh
 * label penilaian ("Gizi Baik & Normal", "Terverifikasi WHO") di sebelah angka
 * ini; label itu sengaja tidak dipakai — penilaian klinis adalah tugas tenaga
 * kesehatan, bukan aplikasi ini.
 *
 * `compact` menghilangkan tabel — dipakai di halaman profil, yang sudah
 * menampilkan daftar pengukuran (beserta tautan ke riwayat penuh) di bawahnya.
 */
export function GrowthSummary({
  series,
  compact,
}: {
  series: ChartSeries;
  compact?: boolean;
}) {
  const latest = series.childPoints.at(-1);
  if (!latest) return null;

  const first = series.childPoints[0];
  const basis = BASIS_LABEL[series.ageBasis];
  const previous = series.childPoints.at(-2);
  const deltaZ = previous ? latest.zScore - previous.zScore : null;

  return (
    <div className="space-y-3">
      <div className="space-y-2.5">
        <h3 className="text-muted-foreground text-label-sm font-semibold tracking-wider uppercase">
          Hasil analisis terakhir
        </h3>

        {/* Blok z-score menonjol seperti template, lalu narasi lengkapnya. */}
        <div className="bg-muted border-border flex items-center justify-between gap-3 rounded-xl border p-3">
          <div className="min-w-0">
            <p className="text-muted-foreground text-label-sm">
              Z-score {series.label.toLowerCase()} menurut {basis}
            </p>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
              <span className="text-metric tabular-nums">
                {latest.zScore >= 0 ? "+" : ""}
                {latest.zScore.toFixed(2)} SD
              </span>
              <span className="text-muted-foreground text-label-sm tabular-nums">
                persentil {formatPercentile(latest.percentile)}
              </span>
            </div>
          </div>
          <span className="bg-accent text-primary grid size-10 shrink-0 place-items-center rounded-full">
            <Icon name="trending_up" className="text-[24px]" />
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2.5">
        <Icon name="sentiment_satisfied" className="text-primary mt-0.5 shrink-0 text-[20px]" />
        <p className="text-muted-foreground text-body-sm leading-relaxed">
          Pengukuran terakhir {series.label.toLowerCase()} pada {formatDate(latest.measuredAt)}{" "}
          adalah{" "}
          <span className="text-foreground font-semibold">
            {latest.value.toLocaleString("id-ID", { maximumFractionDigits: 2 })} {series.unit}
          </span>
          , menurut {series.reference.name} ({series.reference.version}) berdasarkan {basis}.
          {deltaZ !== null && (
            <>
              {" "}
              Z-score bergeser{" "}
              <span className="text-foreground font-semibold tabular-nums">
                {deltaZ >= 0 ? "+" : "−"}
                {Math.abs(deltaZ).toFixed(2)} SD
              </span>{" "}
              dari pengukuran sebelumnya.
            </>
          )}
          {series.childPoints.length > 1 && (
            <> Tercatat {series.childPoints.length} pengukuran sejak {formatDate(first.measuredAt)}.</>
          )}
        </p>
      </div>

      {compact ? null : (
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
      )}
    </div>
  );
}
