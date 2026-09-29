"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import { GrowthChart } from "./growth-chart";
import type { ChartSeries } from "@/lib/growth/chart-data";

const SHORT: Record<string, string> = {
  "weight-for-age": "Berat Badan",
  "length-for-age": "Panjang",
  "head-circumference-for-age": "Lingkar Kepala",
};

const ICON: Record<string, IconName> = {
  "weight-for-age": "scale",
  "length-for-age": "straighten",
  "head-circumference-for-age": "face",
};

/** Judul kartu memakai singkatan standar WHO, seperti template. */
const TITLE: Record<string, string> = {
  "weight-for-age": "Berat Badan menurut Usia (WFA)",
  "length-for-age": "Panjang/Tinggi menurut Usia (LHFA)",
  "head-circumference-for-age": "Lingkar Kepala menurut Usia (HCFA)",
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
      <TabsList className="bg-muted h-auto w-full rounded-full p-1 shadow-inner">
        {series.map((s) => (
          <TabsTrigger
            key={s.measurementType}
            value={s.measurementType}
            className="text-body-sm flex-1 gap-1.5 rounded-full py-2 font-semibold data-[state=active]:shadow-sm"
          >
            <Icon name={ICON[s.measurementType] ?? "scale"} className="text-[16px]" />
            {SHORT[s.measurementType] ?? s.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {series.map((s) => (
        <TabsContent key={s.measurementType} value={s.measurementType} className="space-y-4">
          <Card>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-headline-sm">{TITLE[s.measurementType] ?? s.label}</h2>
                  <Icon name="info" className="text-muted-foreground text-[18px]" />
                </div>
                <span className="bg-accent text-primary text-label-sm inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold">
                  <span className="bg-primary size-1.5 rounded-full" />
                  {s.reference.name} ({s.reference.version})
                </span>
              </div>

              {s.unavailable ? (
                <Alert>
                  <AlertDescription>{s.unavailable}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="bg-muted border-border rounded-xl border p-3">
                    <GrowthChart series={s} />
                  </div>
                  {summaries[s.measurementType]}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}
