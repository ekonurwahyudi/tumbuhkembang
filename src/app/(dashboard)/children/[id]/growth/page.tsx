import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getChildForViewer } from "@/lib/data/children";
import { listMeasurements } from "@/lib/data/measurements";
import { buildChartSeries } from "@/lib/growth/chart-data";
import type { MeasurementType } from "@/lib/growth/types";
import { ChildHero } from "@/components/children/child-hero";
import { GrowthSummary } from "@/components/growth/growth-summary";
import { GrowthTabs } from "@/components/growth/growth-tabs";
import { MeasurementDialog } from "@/components/measurements/measurement-dialog";
import { MedicalDisclaimer } from "@/components/medical-disclaimer";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Pertumbuhan" };

const TYPES: MeasurementType[] = [
  "weight-for-age",
  "length-for-age",
  "head-circumference-for-age",
];

export default async function GrowthPage({ params }: PageProps<"/children/[id]/growth">) {
  const { id } = await params;
  const user = await requireUser();
  const viewer = await getChildForViewer(user.id, id);
  const child = viewer?.child;
  if (!child) notFound();

  const measurements = await listMeasurements(user.id, child.id, "asc");

  // Perhitungan seluruhnya di server; komponen chart hanya menerima angka jadi.
  const series = TYPES.map((type) => buildChartSeries(child, measurements, type));
  const summaries = Object.fromEntries(
    series.map((s) => [s.measurementType, <GrowthSummary key={s.measurementType} series={s} />]),
  );

  const refName = series[0].reference;

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Link
        href={`/children/${child.id}`}
        className="text-muted-foreground hover:text-foreground text-body-sm inline-flex w-fit items-center gap-1"
      >
        <Icon name="arrow_back" className="text-[16px]" />
        {child.name}
      </Link>

      <ChildHero child={child} />

      {measurements.length === 0 ? (
        <EmptyState
          icon="straighten"
          title="Belum ada pengukuran."
          description="Tambahkan pengukuran pertama untuk mulai membuat grafik pertumbuhan."
          action={<MeasurementDialog childId={child.id} minDate={child.dateOfBirth} />}
        />
      ) : (
        <>
          <GrowthTabs series={series} summaries={summaries} />
          <MeasurementDialog
            childId={child.id}
            minDate={child.dateOfBirth}
            trigger={
              <Button size="lg" className="w-full">
                <Icon name="add_circle" className="text-[20px]" />
                Catat Pengukuran Baru
              </Button>
            }
          />
        </>
      )}

      <p className="text-muted-foreground text-label-sm">
        Kurva reference: {refName.name} ({refName.version}).{" "}
        {child.birthType === "PRETERM"
          ? "Usia yang dipakai adalah usia terkoreksi sesuai rekomendasi AAP."
          : "Usia yang dipakai adalah usia kronologis."}
      </p>

      <MedicalDisclaimer />
    </div>
  );
}
