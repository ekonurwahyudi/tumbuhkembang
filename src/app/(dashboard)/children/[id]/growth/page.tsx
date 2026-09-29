import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getChildForViewer } from "@/lib/data/children";
import { listMeasurements } from "@/lib/data/measurements";
import { buildChartSeries } from "@/lib/growth/chart-data";
import { fentonEligible } from "@/lib/growth/engine";
import type { MeasurementType } from "@/lib/growth/types";
import { ChildHero } from "@/components/children/child-hero";
import { FentonSwitch } from "@/components/growth/fenton-switch";
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

export default async function GrowthPage({
  params,
  searchParams,
}: PageProps<"/children/[id]/growth">) {
  const { id } = await params;
  const { fenton } = await searchParams;
  const user = await requireUser();
  const viewer = await getChildForViewer(user.id, id);
  const child = viewer?.child;
  if (!child) notFound();

  const measurements = await listMeasurements(user.id, child.id, "asc");

  // Saklar Fenton lewat URL, bukan kolom database: ini pilihan tampilan untuk
  // satu kunjungan halaman, bukan sifat anaknya, dan URL-nya bisa dibagikan ke
  // tenaga kesehatan apa adanya. Default menyala — Fenton memang reference yang
  // tepat untuk bayi prematur selama PMA-nya masih tercakup.
  const useFenton = fenton !== "off";

  // Perhitungan seluruhnya di server; komponen chart hanya menerima angka jadi.
  const series = TYPES.map((type) =>
    buildChartSeries({ ...child, useFenton }, measurements, type),
  );
  const summaries = Object.fromEntries(
    series.map((s) => [s.measurementType, <GrowthSummary key={s.measurementType} series={s} />]),
  );

  const refName = series[0].reference;

  return (
    <div className="flex flex-col gap-4 pt-2">
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
          {/*
            Saklar hanya muncul untuk anak yang usia kehamilannya <= 37 minggu:
            di atas itu Fenton tidak pernah terpilih, jadi saklarnya tidak akan
            mengubah apa pun.
          */}
          {fentonEligible(child) && (
            <FentonSwitch
              basePath={`/children/${child.id}/growth`}
              useFenton={useFenton}
              ageBasis={series[0].ageBasis}
              sex={child.sex}
              gestationalAgeWeeks={child.gestationalAgeWeeks!}
              gestationalAgeDays={child.gestationalAgeDays!}
            />
          )}
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

      {/*
        Dibaca dari `ageBasis` hasil perhitungan, bukan dari `birthType`: koreksi
        usia berhenti di 3 tahun (batas AAP), jadi anak prematur yang sudah lewat
        batas itu dinilai dengan usia kronologis. Menyimpulkan dari birthType
        membuat catatan ini berbohong tepat pada kasus tersebut.
      */}
      <p className="text-muted-foreground text-label-sm">
        Kurva reference: {refName.name} ({refName.version}).{" "}
        {series.some((s) => s.ageBasis === "postmenstrual")
          ? "Usia yang dipakai adalah usia pascamenstruasi (PMA), sumbu grafik Fenton."
          : series.some((s) => s.ageBasis === "corrected")
            ? "Usia yang dipakai adalah usia terkoreksi sesuai rekomendasi AAP."
            : "Usia yang dipakai adalah usia kronologis."}
      </p>

      <MedicalDisclaimer />
    </div>
  );
}
