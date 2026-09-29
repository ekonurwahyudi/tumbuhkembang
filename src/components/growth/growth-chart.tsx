"use client";

import { useId } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBasisAge, formatPercentile } from "@/lib/format";
import type { ChartSeries } from "@/lib/growth/chart-data";

/**
 * Grafik pertumbuhan: kurva reference WHO + lintasan anak pada satu sumbu.
 *
 * Pita berarsir menandai rentang ±2 SD dan ±2 s/d ±3 SD populasi acuan — itu
 * properti kurva WHO, bukan penilaian atas anak. Kurva SD sendiri digambar
 * recessive; hanya lintasan anak yang memakai warna seri penuh. Setiap pita dan
 * garis punya label di bawah grafik, sehingga identitasnya tidak bergantung
 * pada warna saja.
 *
 * Satu sumbu Y saja — tidak pernah dual-axis.
 */

const AXIS_TICK = { fontSize: 11 };

/** Diverging: biru di atas median, oranye di bawah, abu-abu netral di median. */
const SD_LINES = [
  { key: "sd3neg", label: "−3 SD", color: "var(--chart-5)", opacity: 0.55 },
  { key: "sd2neg", label: "−2 SD", color: "var(--chart-4)", opacity: 0.75 },
  { key: "sd0", label: "Median", color: "var(--muted-foreground)", opacity: 0.55 },
  { key: "sd2", label: "+2 SD", color: "var(--chart-2)", opacity: 0.75 },
  { key: "sd3", label: "+3 SD", color: "var(--chart-3)", opacity: 0.55 },
] as const;

/** Label usia pada sumbu X: hari saat bayi, bulan setelahnya. */
function formatAge(days: number): string {
  if (days < 61) return `${days}h`;
  const months = Math.round(days / 30.4375);
  if (months < 24) return `${months}b`;
  return `${Math.floor(months / 12)}th`;
}

/** Batas sumbu Y yang rapi: mencakup seluruh kurva dan data anak, dibulatkan. */
function niceDomain(points: { sd3neg: number; sd3: number; child: number | null }[]) {
  let min = Infinity;
  let max = -Infinity;
  for (const p of points) {
    min = Math.min(min, p.sd3neg, p.child ?? Infinity);
    max = Math.max(max, p.sd3, p.child ?? -Infinity);
  }
  // Langkah pembulatan mengikuti besaran rentang: 1 untuk kg, 5-10 untuk cm.
  const span = max - min;
  const step = span > 60 ? 10 : span > 20 ? 5 : span > 6 ? 2 : 1;
  return [Math.max(0, Math.floor(min / step) * step), Math.ceil(max / step) * step] as const;
}

export function GrowthChart({ series }: { series: ChartSeries }) {
  const titleId = useId();
  const gradientId = useId();

  if (series.points.length === 0) return null;

  const lastPoint = series.points.at(-1)!;
  const latest = series.childPoints.at(-1);
  const yDomain = niceDomain(series.points);

  // Recharts menggambar Area berpita dari pasangan [bawah, atas] pada satu
  // dataKey. Pita dirakit di sini, bukan di server, supaya ChartPoint tetap
  // berisi angka kurva saja.
  const data = series.points.map((p) => ({
    ...p,
    bandNormal: [p.sd2neg, p.sd2] as [number, number],
    bandLow: [p.sd3neg, p.sd2neg] as [number, number],
    bandHigh: [p.sd2, p.sd3] as [number, number],
  }));

  const safeId = `${gradientId}-safe`;
  const edgeId = `${gradientId}-edge`;

  return (
    <figure className="space-y-2">
      <figcaption id={titleId} className="sr-only">
        {series.label} menurut usia, dibandingkan dengan kurva reference {series.reference.name}
      </figcaption>

      {/* Ringkas plot terakhir di atas kanvas, seperti template. */}
      {latest && (
        <div className="text-body-sm text-muted-foreground flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block size-2 rounded-full"
              style={{ background: "var(--chart-1)" }}
            />
            Plot terakhir:{" "}
            <strong className="text-foreground font-semibold tabular-nums">
              {latest.value.toLocaleString("id-ID", { maximumFractionDigits: 2 })} {series.unit}
            </strong>
            <span className="text-muted-foreground">
              ({formatBasisAge(series.ageBasis, latest.ageDays)})
            </span>
          </span>
          <span className="text-primary font-semibold tabular-nums">
            Persentil {formatPercentile(latest.percentile)}
          </span>
        </div>
      )}

      <div className="h-[280px] w-full sm:h-[340px]" role="img" aria-labelledby={titleId}>
        {/*
          initialDimension menggantikan default Recharts {-1,-1}: render pertama
          terjadi sebelum ResizeObserver mengukur, dan ukuran negatif memicu
          peringatan "width(-1) and height(-1) ... should be greater than 0".
          Lebar tetap 0 supaya grafik baru digambar setelah lebar asli diketahui.
        */}
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 0, height: 280 }}
        >
          <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -12 }}>
            <defs>
              {/*
                Gradien memakai warna kurva SD yang sama (biru di atas, oranye di
                bawah) dengan opasitas rendah, bukan palet tetap template: dengan
                begitu pita ikut benar di mode gelap dan tetap satu keluarga
                dengan garisnya.
              */}
              <linearGradient id={safeId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.2} />
                <stop offset="50%" stopColor="var(--chart-2)" stopOpacity={0.07} />
                <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0.16} />
              </linearGradient>
              <linearGradient id={edgeId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.05} />
                <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0.16} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="2 3"
              strokeWidth={1}
              vertical={false}
            />

            <XAxis
              dataKey="ageDays"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={formatAge}
              tick={AXIS_TICK}
              stroke="var(--border)"
              tickLine={false}
              minTickGap={24}
            />
            {/*
              Sumbu Y mengikuti rentang data (−3 SD sampai +3 SD), bukan dipaksa
              mulai dari nol: yang dibaca pada grafik pertumbuhan adalah posisi
              anak relatif terhadap kurva reference, dan baseline nol memampatkan
              seluruh kurva. Batasnya dibulatkan ke angka rapi agar label sumbu
              tetap terbaca.
            */}
            <YAxis
              tick={AXIS_TICK}
              stroke="var(--border)"
              tickLine={false}
              axisLine={false}
              width={44}
              domain={[yDomain[0], yDomain[1]]}
              allowDecimals={false}
            />

            {/* Pita rentang: latar konteks, digambar sebelum garis mana pun. */}
            <Area
              dataKey="bandHigh"
              name="+2 s/d +3 SD"
              type="monotone"
              fill={`url(#${edgeId})`}
              stroke="none"
              isAnimationActive={false}
              activeDot={false}
              tooltipType="none"
              legendType="none"
            />
            <Area
              dataKey="bandNormal"
              name="Rentang ±2 SD"
              type="monotone"
              fill={`url(#${safeId})`}
              stroke="none"
              isAnimationActive={false}
              activeDot={false}
              tooltipType="none"
              legendType="none"
            />
            <Area
              dataKey="bandLow"
              name="−2 s/d −3 SD"
              type="monotone"
              fill={`url(#${edgeId})`}
              stroke="none"
              isAnimationActive={false}
              activeDot={false}
              tooltipType="none"
              legendType="none"
            />

            {/* Kurva reference: konteks, bukan seri utama. Median sedikit lebih tegas. */}
            {SD_LINES.map(({ key, label, color, opacity }) => (
              <Line
                key={key}
                dataKey={key}
                name={label}
                type="monotone"
                stroke={color}
                strokeOpacity={opacity}
                strokeWidth={key === "sd0" ? 1.8 : 1}
                strokeDasharray={key === "sd0" ? undefined : "3 3"}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            ))}

            {/* Lintasan anak: satu-satunya seri berwarna penuh. */}
            <Line
              dataKey="child"
              name={series.label}
              type="monotone"
              stroke="var(--chart-1)"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              connectNulls
              dot={{ r: 3.2, fill: "var(--background)", stroke: "var(--chart-1)", strokeWidth: 2 }}
              activeDot={{
                r: 5,
                fill: "var(--chart-1)",
                stroke: "var(--background)",
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />

            <Tooltip
              cursor={{ stroke: "var(--muted-foreground)", strokeOpacity: 0.4, strokeWidth: 1 }}
              content={<GrowthTooltip series={series} />}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Keterangan garis dan pita — identitas tidak bergantung warna saja. */}
      <ul className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-t pt-2 text-xs">
        <li className="text-foreground flex items-center gap-1.5 font-medium">
          <span
            aria-hidden
            className="inline-block h-1 w-3 rounded-full"
            style={{ background: "var(--chart-1)" }}
          />
          Kurva anak
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="bg-muted-foreground/55 inline-block h-1 w-3 rounded-full" />
          Median WHO ({lastPoint.sd0.toLocaleString("id-ID", { maximumFractionDigits: 1 })}{" "}
          {series.unit})
        </li>
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2.5 w-3 rounded-sm"
            style={{
              background:
                "linear-gradient(to bottom, color-mix(in oklab, var(--chart-2) 20%, transparent), color-mix(in oklab, var(--chart-4) 16%, transparent))",
            }}
          />
          Rentang ±2 SD
        </li>
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2.5 w-3 rounded-sm"
            style={{ background: "color-mix(in oklab, var(--chart-4) 16%, transparent)" }}
          />
          ±2 s/d ±3 SD
        </li>
      </ul>
    </figure>
  );
}

type TooltipPayload = { payload?: { ageDays: number; child: number | null; sd0: number } };

function GrowthTooltip({
  active,
  payload,
  series,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  series: ChartSeries;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  const childPoint = series.childPoints.find((p) => p.ageDays === point.ageDays);

  return (
    <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-2 text-xs shadow-md">
      <p className="font-medium">
        {series.ageBasis === "postmenstrual" ? "PMA " : ""}
        {formatBasisAge(series.ageBasis, point.ageDays)}
      </p>
      {childPoint ? (
        <dl className="mt-1 space-y-0.5">
          <div className="flex gap-3">
            <dt className="text-muted-foreground">{series.label}</dt>
            <dd className="ml-auto font-medium tabular-nums">
              {childPoint.value.toLocaleString("id-ID", { maximumFractionDigits: 2 })}{" "}
              {series.unit}
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="text-muted-foreground">Z-score</dt>
            <dd className="ml-auto font-medium tabular-nums">
              {childPoint.zScore >= 0 ? "+" : ""}
              {childPoint.zScore.toFixed(2)}
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="text-muted-foreground">Persentil</dt>
            <dd className="ml-auto font-medium tabular-nums">
              {formatPercentile(childPoint.percentile)}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-muted-foreground mt-1">
          Median {point.sd0.toLocaleString("id-ID", { maximumFractionDigits: 1 })} {series.unit}
        </p>
      )}
    </div>
  );
}
