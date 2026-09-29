import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listChildrenWithLatestForViewer } from "@/lib/data/children";
import { listMeasurements } from "@/lib/data/measurements";
import { listVaccinations } from "@/lib/data/vaccinations";
import { listReminders } from "@/lib/data/vaccine-reminders";
import { listSkippedCatalogKeys } from "@/lib/data/vaccination-skips";
import { evaluateMeasurement } from "@/lib/growth/engine";
import { chronologicalAge, formatAgeDaysDetailed, formatAgeDetailed } from "@/lib/growth/age";
import { correctedAge } from "@/lib/growth/corrected-age";
import { upcomingVaccines, vaccineSchedule } from "@/lib/immunization/schedule";
import { ChildSwitcher } from "@/components/dashboard/child-switcher";
import { GrowthHighlight } from "@/components/dashboard/growth-highlight";
import { QuickAccess } from "@/components/dashboard/quick-access";
import { VaccineSlider } from "@/components/dashboard/vaccine-slider";
import { EmptyState } from "@/components/empty-state";
import { InstallPrompt } from "@/components/install-prompt";
import { MeasurementDialog } from "@/components/measurements/measurement-dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Beranda" };

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const user = await requireUser();
  const { anak } = await searchParams;
  const items = await listChildrenWithLatestForViewer(user.id);

  if (items.length === 0)
    return (
      <div className="flex flex-col gap-4 pt-2">
        <Greeting name={user.name} />
        <InstallPrompt />
        <EmptyState
          icon="child_care"
          title="Belum ada data anak."
          description="Tambahkan profil anak untuk mulai memantau pertumbuhannya."
          action={
            <Button asChild>
              <Link href="/children/new">
                <Icon name="add" className="text-[18px]" />
                Tambah Anak
              </Link>
            </Button>
          }
        />
      </div>
    );

  const selectedId = typeof anak === "string" ? anak : undefined;
  const active = items.find((i) => i.child.id === selectedId) ?? items[0];
  const child = active.child;

  // Hanya anak aktif yang ditarik detailnya — bukan semua anak di carousel.
  const [measurements, vaccinations, skippedKeys, reminders] = await Promise.all([
    listMeasurements(user.id, child.id, "desc"),
    listVaccinations(user.id, child.id),
    listSkippedCatalogKeys(user.id, child.id),
    listReminders(user.id, child.id),
  ]);

  const latest = measurements[0];
  const currentWeightGrams =
    latest?.weightKg != null ? Math.round(Number(latest.weightKg) * 1000) : child.birthWeightGrams;
  const schedule = vaccineSchedule({ child, vaccinations, skippedKeys, currentWeightGrams });

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Greeting name={user.name} />

      <ChildSwitcher
        activeId={child.id}
        items={items.map(({ child: c }) => ({
          id: c.id,
          name: c.name,
          photoKey: c.photoKey,
          caption: formatAgeDetailed(chronologicalAge(c.dateOfBirth)),
          preterm: c.birthType === "PRETERM",
        }))}
      />

      <AgeBand child={child} />

      <InstallPrompt />

      {latest ? (
        <GrowthHighlight
          childId={child.id}
          minDate={child.dateOfBirth}
          latest={latest}
          previous={measurements[1]}
          outcomes={evaluateMeasurement(child, latest)}
          intake={{
            weightKg: latest.weightKg != null ? Number(latest.weightKg) : null,
            dateOfBirth: child.dateOfBirth,
            birthType: child.birthType,
            gestationalAgeWeeks: child.gestationalAgeWeeks,
            gestationalAgeDays: child.gestationalAgeDays,
          }}
        />
      ) : (
        <EmptyState
          icon="straighten"
          title="Belum ada pengukuran."
          description={`Catat berat, panjang, dan lingkar kepala ${child.name} untuk mulai grafiknya.`}
          action={<MeasurementDialog childId={child.id} minDate={child.dateOfBirth} />}
        />
      )}

      <QuickAccess childId={child.id} />

      <VaccineSlider
        childId={child.id}
        child={child}
        entries={upcomingVaccines(schedule, new Map(reminders.map((r) => [r.catalogKey, r])))}
        givenCount={schedule.filter((e) => e.status === "given").length}
        reminders={reminders}
      />
    </div>
  );
}

function Greeting({ name }: { name: string }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-headline-lg truncate">Halo, {name}! 👋</h1>
        <p className="text-muted-foreground text-body-sm mt-0.5">Semangat merawat si kecil</p>
      </div>
      <span className="bg-accent text-primary grid size-10 shrink-0 place-items-center rounded-full shadow-sm">
        <Icon name="favorite" filled />
      </span>
    </header>
  );
}

/** Usia kronologis, plus usia terkoreksi bila anak lahir prematur. */
function AgeBand({
  child,
}: {
  child: {
    dateOfBirth: string;
    birthType: "TERM" | "PRETERM";
    gestationalAgeWeeks: number | null;
    gestationalAgeDays: number | null;
  };
}) {
  const chrono = formatAgeDetailed(chronologicalAge(child.dateOfBirth));

  const ga =
    child.birthType === "PRETERM" &&
    child.gestationalAgeWeeks !== null &&
    child.gestationalAgeDays !== null
      ? { gestationalAgeWeeks: child.gestationalAgeWeeks, gestationalAgeDays: child.gestationalAgeDays }
      : null;
  const args = ga ? { dateOfBirth: child.dateOfBirth, ...ga } : null;
  const corrected =
    args && correctedAge(args).applicable
      ? formatAgeDaysDetailed(correctedAge(args).days)
      : null;

  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[var(--color-sky-tint)] to-[var(--color-sky-tint)]/40 px-3.5 py-3 text-[var(--color-accent-foreground)] shadow-sm">
      <span className="bg-card/70 grid size-9 shrink-0 place-items-center rounded-full">
        <Icon name="auto_awesome" filled className="text-[18px]" />
      </span>
      <dl className="text-body-sm min-w-0 flex-1 font-semibold">
        <div className="flex flex-wrap gap-x-1.5">
          <dt>Usia kronologis:</dt>
          <dd>{chrono}</dd>
        </div>
        {corrected && (
          <div className="mt-0.5 flex flex-wrap gap-x-1.5">
            <dt>Usia koreksi:</dt>
            <dd>{corrected}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
