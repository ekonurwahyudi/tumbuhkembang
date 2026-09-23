"use client";

import { useId } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAgeDaysLong, formatPercentile } from "@/lib/format";
import type { ChartSeries } from "@/lib/growth/chart-data";

/**
 * Grafik pertumbuhan: kurva reference WHO + lintasan anak pada satu sumbu.
 *
 * Kurva SD digambar abu-abu recessive sebagai konteks; hanya lintasan anak yang
 * memakai warna seri. Garis SD juga dijelaskan lewat label di bawah grafik,
 * sehingga identitasnya tidak bergantung pada warna saja.
 *
 * Satu sumbu Y saja — tidak pernah dual-axis.
 */

const AXIS_TICK = { fontSize: 11 };

const SD_LINES = [
  { key: "sd3neg", label: "−3 SD" },
  { key: "sd2neg", label: "−2 SD" },
  { key: "sd0", label: "Median" },
  { key: "sd2", label: "+2 SD" },
  { key: "sd3", label: "+3 SD" },
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

  if (series.points.length === 0) return null;

  const lastPoint = series.points.at(-1)!;
  const yDomain = niceDomain(series.points);

  return (
    <figure className="space-y-3">
      <figcaption id={titleId} className="sr-only">
        {series.label} menurut usia, dibandingkan dengan kurva reference {series.reference.name}
      </figcaption>

      <div className="h-[280px] w-full sm:h-[340px]" role="img" aria-labelledby={titleId}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series.points} margin={{ top: 8, right: 16, bottom: 4, left: -12 }}>
            <CartesianGrid stroke="var(--border)" strokeWidth={1} vertical={false} />

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

            {/* Kurva reference: konteks, bukan seri utama. Median sedikit lebih tegas. */}
            {SD_LINES.map(({ key, label }) => (
              <Line
                key={key}
                dataKey={key}
                name={label}
                type="monotone"
                stroke="var(--muted-foreground)"
                strokeOpacity={key === "sd0" ? 0.55 : 0.3}
                strokeWidth={key === "sd0" ? 1.5 : 1}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            ))}

            {/* Lintasan anak: satu-satunya seri berwarna. */}
            <Line
              dataKey="child"
              name={series.label}
              type="monotone"
              stroke="var(--chart-1)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              connectNulls
              dot={{ r: 4, fill: "var(--chart-1)", stroke: "var(--background)", strokeWidth: 2 }}
              activeDot={{
                r: 6,
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
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Keterangan garis — identitas tidak bergantung warna saja. */}
      <ul className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <li className="text-foreground flex items-center gap-1.5 font-medium">
          <span
            aria-hidden
            className="inline-block h-0.5 w-4 rounded-full"
            style={{ background: "var(--chart-1)" }}
          />
          {series.label}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="bg-muted-foreground/55 inline-block h-0.5 w-4 rounded-full" />
          Median ({lastPoint.sd0.toLocaleString("id-ID", { maximumFractionDigits: 1 })}{" "}
          {series.unit})
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="bg-muted-foreground/30 inline-block h-0.5 w-4 rounded-full" />
          −3 SD hingga +3 SD
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
      <p className="font-medium">Usia {formatAgeDaysLong(point.ageDays)}</p>
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
