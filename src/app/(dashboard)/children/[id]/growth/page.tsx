import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Ruler } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getChild } from "@/lib/data/children";
import { listMeasurements } from "@/lib/data/measurements";
import { buildChartSeries } from "@/lib/growth/chart-data";
import type { MeasurementType } from "@/lib/growth/types";
import { ChildAgeSummary } from "@/components/children/child-age-summary";
import { GrowthSummary } from "@/components/growth/growth-summary";
import { GrowthTabs } from "@/components/growth/growth-tabs";
import { MeasurementDialog } from "@/components/measurements/measurement-dialog";
import { MedicalDisclaimer } from "@/components/medical-disclaimer";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Pertumbuhan" };

const TYPES: MeasurementType[] = [
  "weight-for-age",
  "length-for-age",
  "head-circumference-for-age",
];

export default async function GrowthPage({ params }: PageProps<"/children/[id]/growth">) {
  const { id } = await params;
  const user = await requireUser();
  const child = await getChild(user.id, id);
  if (!child) notFound();

  const measurements = await listMeasurements(user.id, child.id, "asc");

  // Perhitungan seluruhnya di server; komponen chart hanya menerima angka jadi.
  const series = TYPES.map((type) => buildChartSeries(child, measurements, type));
  const summaries = Object.fromEntries(
    series.map((s) => [s.measurementType, <GrowthSummary key={s.measurementType} series={s} />]),
  );

  const refName = series[0].reference;

  return (
    <div className="space-y-5">
      <Link
        href={`/children/${child.id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeft className="size-4" aria-hidden />
        {child.name}
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Pertumbuhan {child.name}</h1>
        <MeasurementDialog childId={child.id} minDate={child.dateOfBirth} />
      </header>

      <Card>
        <CardContent className="py-4">
          <ChildAgeSummary child={child} />
        </CardContent>
      </Card>

      {measurements.length === 0 ? (
        <EmptyState
          icon={Ruler}
          title="Belum ada pengukuran."
          description="Tambahkan pengukuran pertama untuk mulai membuat grafik pertumbuhan."
          action={<MeasurementDialog childId={child.id} minDate={child.dateOfBirth} />}
        />
      ) : (
        <GrowthTabs series={series} summaries={summaries} />
      )}

      <p className="text-muted-foreground text-xs">
        Kurva reference: {refName.name} ({refName.version}).{" "}
        {child.birthType === "PRETERM"
          ? "Usia yang dipakai adalah usia terkoreksi sesuai rekomendasi AAP."
          : "Usia yang dipakai adalah usia kronologis."}
      </p>

      <MedicalDisclaimer />
    </div>
  );
}
