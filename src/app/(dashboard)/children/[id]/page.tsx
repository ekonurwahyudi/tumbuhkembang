import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getChildForViewer } from "@/lib/data/children";
import { listFeedingLogs } from "@/lib/data/feeding";
import { listMeasurements } from "@/lib/data/measurements";
import { listVaccinations } from "@/lib/data/vaccinations";
import { listReminders } from "@/lib/data/vaccine-reminders";
import { listSkippedCatalogKeys } from "@/lib/data/vaccination-skips";
import { buildChartSeries } from "@/lib/growth/chart-data";
import type { MeasurementType } from "@/lib/growth/types";
import { groupByDay, summarizeDay } from "@/lib/feeding/summary";
import { todayLocalISO } from "@/schemas/date";
import { ChildHero } from "@/components/children/child-hero";
import { DeleteChildButton } from "@/components/children/delete-child-button";
import { FeedingDialog } from "@/components/feeding/feeding-dialog";
import { FeedingEstimate } from "@/components/feeding/feeding-estimate";
import { GrowthSummary } from "@/components/growth/growth-summary";
import { GrowthTabs } from "@/components/growth/growth-tabs";
import { ImmunizationList } from "@/components/immunization/immunization-list";
import { MeasurementDialog } from "@/components/measurements/measurement-dialog";
import { MeasurementList } from "@/components/measurements/measurement-list";
import { MedicalDisclaimer } from "@/components/medical-disclaimer";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

const TYPES: MeasurementType[] = [
  "weight-for-age",
  "length-for-age",
  "head-circumference-for-age",
];

/** Riwayat di halaman profil hanya pratinjau; daftar penuh ada di sub-halamannya. */
const RECENT_COUNT = 3;

export async function generateMetadata({ params }: PageProps<"/children/[id]">): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser();
  const viewer = await getChildForViewer(user.id, id);
  const child = viewer?.child;
  return { title: child?.name ?? "Anak" };
}

export default async function ChildProfilePage({ params }: PageProps<"/children/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const viewer = await getChildForViewer(user.id, id);
  const child = viewer?.child;
  const isOwner = viewer?.role === "OWNER";
  if (!child) notFound();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const measurements = await listMeasurements(user.id, child.id, "desc");
  const vaccinations = await listVaccinations(user.id, child.id);
  const skippedKeys = await listSkippedCatalogKeys(user.id, child.id);
  const reminders = await listReminders(user.id, child.id);
  const todayFeedingLogs = await listFeedingLogs(user.id, child.id, { from: todayStart });
  const latest = measurements[0];
  const currentWeightGrams =
    latest?.weightKg != null ? Math.round(Number(latest.weightKg) * 1000) : child.birthWeightGrams;

  // Perhitungan kurva seluruhnya di server; komponen chart menerima angka jadi.
  // listMeasurements di sini desc (riwayat), buildChartSeries mengurut sendiri.
  const series = TYPES.map((type) => buildChartSeries(child, measurements, type));
  const summaries = Object.fromEntries(
    series.map((s) => [
      s.measurementType,
      <GrowthSummary key={s.measurementType} series={s} compact />,
    ]),
  );

  const today = todayLocalISO();
  const todayLogs = groupByDay(todayFeedingLogs).find((d) => d.date === today)?.logs ?? [];
  const todaySummary = summarizeDay(todayLogs, today);

  return (
    <div className="space-y-5">
      <Link
        href="/children"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <Icon name="arrow_back" className="text-[16px]" />
        Anak
      </Link>

      <ChildHero
        child={child}
        action={
          isOwner ? (
            <Button asChild variant="ghost" size="icon-sm" aria-label="Ubah profil anak">
              <Link href={`/children/${child.id}/edit`}>
                <Icon name="edit" className="text-[18px]" />
              </Link>
            </Button>
          ) : undefined
        }
      />

      <nav aria-label="Aksi cepat" className="grid grid-cols-2 gap-3">
        <MeasurementDialog
          childId={child.id}
          minDate={child.dateOfBirth}
          trigger={
            <button className="bg-primary text-primary-foreground text-body-md flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 font-semibold tracking-tight shadow-sm transition-transform hover:bg-[#006194] active:scale-[0.98]">
              <span className="grid size-7 place-items-center rounded-full bg-white/20">
                <Icon name="straighten" className="text-[18px]" />
              </span>
              Catat Tumbuh
            </button>
          }
        />
        <FeedingDialog
          childId={child.id}
          trigger={
            <button className="text-body-md flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-butter-pastel)] px-4 py-3.5 font-semibold tracking-tight text-[var(--color-on-butter)] shadow-sm transition-transform hover:bg-[var(--color-butter-bright)] active:scale-[0.98]">
              <span className="grid size-7 place-items-center rounded-full bg-[var(--color-butter-bright)]">
                <Icon name="water_bottle" className="text-[18px]" />
              </span>
              Catat Minum
            </button>
          }
        />
      </nav>

      {!latest ? (
        <EmptyState
          icon="straighten"
          title="Belum ada pengukuran."
          description="Tambahkan pengukuran pertama untuk mulai membuat grafik pertumbuhan."
          action={<MeasurementDialog childId={child.id} minDate={child.dateOfBirth} />}
        />
      ) : (
        <>
          <section className="space-y-3" aria-labelledby="pertumbuhan">
            <h2 id="pertumbuhan" className="text-headline-sm flex items-center gap-2">
              <Icon name="monitor_heart" className="text-primary" />
              Grafik Pertumbuhan
            </h2>
            <GrowthTabs series={series} summaries={summaries} />
          </section>

          <section aria-labelledby="riwayat-pengukuran" className="space-y-3">
            <MeasurementList
              measurements={measurements.slice(0, RECENT_COUNT)}
              child={child}
              heading={
                <div className="flex items-center justify-between gap-2">
                  <h2 id="riwayat-pengukuran" className="text-headline-sm flex items-center gap-1.5">
                    <Icon name="history_edu" className="text-primary text-[20px]" />
                    Riwayat Pengukuran
                  </h2>
                  <span className="text-muted-foreground text-label-sm tabular-nums">
                    {Math.min(measurements.length, RECENT_COUNT)} entri terakhir
                  </span>
                </div>
              }
            />
            {measurements.length > RECENT_COUNT && (
              <Link
                href={`/children/${child.id}/measurements`}
                className="bg-card border-border hover:bg-accent text-body-sm flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border font-semibold shadow-sm transition-colors"
              >
                Lihat semua {measurements.length} pengukuran
                <Icon name="arrow_forward" className="text-[16px]" />
              </Link>
            )}
          </section>
        </>
      )}

      <FeedingEstimate
        input={{
          weightKg: latest?.weightKg != null ? Number(latest.weightKg) : null,
          dateOfBirth: child.dateOfBirth,
          birthType: child.birthType,
          gestationalAgeWeeks: child.gestationalAgeWeeks,
          gestationalAgeDays: child.gestationalAgeDays,
        }}
        measuredToday={todaySummary.totalMeasuredMl}
      />

      <section className="space-y-3" aria-labelledby="vaksinasi">
        <h2 id="vaksinasi" className="text-headline-sm flex items-center gap-2">
          <Icon name="vaccines" className="text-primary" />
          Jadwal Imunisasi
        </h2>
        <ImmunizationList
          child={child}
          vaccinations={vaccinations}
          skippedKeys={skippedKeys}
          currentWeightGrams={currentWeightGrams}
          reminders={reminders}
        />
      </section>

      <nav aria-label="Riwayat lain">
        <Link
          href={`/children/${child.id}/feeding`}
          className="bg-card border-border hover:bg-accent text-body-sm flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 font-semibold shadow-sm transition-colors"
        >
          <Icon name="water_bottle" className="text-primary" />
          Riwayat Asupan
          <Icon name="chevron_right" className="text-muted-foreground ml-auto" />
        </Link>
      </nav>

      <MedicalDisclaimer />

      {isOwner && (
        <section className="pt-2">
          <DeleteChildButton childId={child.id} name={child.name} />
        </section>
      )}
    </div>
  );
}
