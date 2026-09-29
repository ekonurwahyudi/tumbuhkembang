import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getChildForViewer } from "@/lib/data/children";
import { listMeasurements } from "@/lib/data/measurements";
import { MeasurementDialog } from "@/components/measurements/measurement-dialog";
import { MeasurementList } from "@/components/measurements/measurement-list";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Riwayat Pengukuran" };

export default async function MeasurementsPage({
  params,
}: PageProps<"/children/[id]/measurements">) {
  const { id } = await params;
  const user = await requireUser();
  const viewer = await getChildForViewer(user.id, id);
  const child = viewer?.child;
  if (!child) notFound();

  const measurements = await listMeasurements(user.id, child.id, "desc");

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
        <div>
          <h1 className="text-headline-lg">Riwayat Pengukuran</h1>
          <p className="text-muted-foreground text-body-sm">
            {measurements.length} catatan tersimpan
          </p>
        </div>
        {measurements.length > 0 && (
          <MeasurementDialog childId={child.id} minDate={child.dateOfBirth} />
        )}
      </header>

      {measurements.length === 0 ? (
        <EmptyState
          icon="straighten"
          title="Belum ada pengukuran."
          description="Tambahkan pengukuran pertama untuk mulai membuat grafik pertumbuhan."
          action={<MeasurementDialog childId={child.id} minDate={child.dateOfBirth} />}
        />
      ) : (
        <MeasurementList measurements={measurements} child={child} />
      )}
    </div>
  );
}
