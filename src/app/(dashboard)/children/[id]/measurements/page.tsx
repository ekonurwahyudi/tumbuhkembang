import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Ruler } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getChild } from "@/lib/data/children";
import { listMeasurements } from "@/lib/data/measurements";
import { MeasurementDialog } from "@/components/measurements/measurement-dialog";
import { MeasurementList } from "@/components/measurements/measurement-list";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Riwayat Pengukuran" };

export default async function MeasurementsPage({
  params,
}: PageProps<"/children/[id]/measurements">) {
  const { id } = await params;
  const user = await requireUser();
  const child = await getChild(user.id, id);
  if (!child) notFound();

  const measurements = await listMeasurements(user.id, child.id, "desc");

  return (
    <div className="space-y-4">
      <Link
        href={`/children/${child.id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeft className="size-4" aria-hidden />
        {child.name}
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Riwayat Pengukuran</h1>
          <p className="text-muted-foreground text-sm">
            {measurements.length} catatan tersimpan
          </p>
        </div>
        {measurements.length > 0 && (
          <MeasurementDialog childId={child.id} minDate={child.dateOfBirth} />
        )}
      </header>

      {measurements.length === 0 ? (
        <EmptyState
          icon={Ruler}
          title="Belum ada pengukuran."
          description="Tambahkan pengukuran pertama untuk mulai membuat grafik pertumbuhan."
          action={<MeasurementDialog childId={child.id} minDate={child.dateOfBirth} />}
        />
      ) : (
        <MeasurementList
          measurements={measurements}
          childId={child.id}
          dateOfBirth={child.dateOfBirth}
        />
      )}
    </div>
  );
}
