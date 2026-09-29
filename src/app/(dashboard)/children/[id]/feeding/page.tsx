import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getChildForViewer } from "@/lib/data/children";
import { listFeedingLogs } from "@/lib/data/feeding";
import { groupByDay } from "@/lib/feeding/summary";
import { todayLocalISO } from "@/schemas/date";
import { FeedingDay } from "@/components/feeding/feeding-day";
import { FeedingDialog } from "@/components/feeding/feeding-dialog";
import { MedicalDisclaimer } from "@/components/medical-disclaimer";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Asupan" };

/** Berapa hari terakhir yang ditampilkan. */
const HISTORY_DAYS = 14;

export default async function FeedingPage({ params }: PageProps<"/children/[id]/feeding">) {
  const { id } = await params;
  const user = await requireUser();
  const viewer = await getChildForViewer(user.id, id);
  const child = viewer?.child;
  if (!child) notFound();

  const from = new Date();
  from.setDate(from.getDate() - HISTORY_DAYS);
  from.setHours(0, 0, 0, 0);

  const logs = await listFeedingLogs(user.id, child.id, { from });

  const days = groupByDay(logs);
  const today = todayLocalISO();

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Link
        href={`/children/${child.id}`}
        className="text-muted-foreground hover:text-foreground text-body-sm inline-flex w-fit items-center gap-1"
      >
        <Icon name="arrow_back" className="text-[16px]" />
        {child.name}
      </Link>

      <header className="flex items-start justify-between gap-3">
        <h1 className="text-headline-lg">Asupan {child.name}</h1>
        <FeedingDialog childId={child.id} />
      </header>

      <section className="space-y-3" aria-labelledby="riwayat-asupan">
        <h2 id="riwayat-asupan" className="font-medium">
          Riwayat {HISTORY_DAYS} hari terakhir
        </h2>

        {days.length === 0 ? (
          <EmptyState
            icon="water_bottle"
            title="Belum ada catatan asupan."
            description="Catat sesi menyusu atau pemberian susu untuk mulai melihat ringkasan harian."
            action={<FeedingDialog childId={child.id} />}
          />
        ) : (
          <ul className="space-y-3">
            {days.map((day) => (
              <li key={day.date}>
                <FeedingDay
                  date={day.date}
                  logs={day.logs}
                  childId={child.id}
                  isToday={day.date === today}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <MedicalDisclaimer />
    </div>
  );
}
