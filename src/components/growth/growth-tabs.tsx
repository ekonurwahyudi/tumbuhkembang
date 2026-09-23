"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GrowthChart } from "./growth-chart";
import type { ChartSeries } from "@/lib/growth/chart-data";

const SHORT: Record<string, string> = {
  "weight-for-age": "Berat",
  "length-for-age": "Tinggi",
  "head-circumference-for-age": "Kepala",
};

/**
 * Tab per indikator. Grafik dan ringkasan teksnya selalu berdampingan, sehingga
 * informasi tidak pernah hanya tersedia secara visual.
 */
export function GrowthTabs({
  series,
  summaries,
}: {
  series: ChartSeries[];
  /** Ringkasan teks dirender di server, dipetakan berdasarkan indikator. */
  summaries: Record<string, ReactNode>;
}) {
  return (
    <Tabs defaultValue={series[0]?.measurementType} className="gap-4">
      <TabsList className="w-full">
        {series.map((s) => (
          <TabsTrigger key={s.measurementType} value={s.measurementType} className="flex-1">
            {SHORT[s.measurementType] ?? s.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {series.map((s) => (
        <TabsContent key={s.measurementType} value={s.measurementType} className="space-y-4">
          <h2 className="font-medium">{s.label}</h2>

          {s.unavailable ? (
            <Alert>
              <AlertDescription>{s.unavailable}</AlertDescription>
            </Alert>
          ) : (
            <>
              <GrowthChart series={s} />
              {summaries[s.measurementType]}
            </>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
