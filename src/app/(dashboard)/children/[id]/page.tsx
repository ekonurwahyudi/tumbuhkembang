import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, LineChart, ListOrdered, Milk, Pencil, Ruler } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getChild } from "@/lib/data/children";
import { listMeasurements } from "@/lib/data/measurements";
import { evaluateMeasurement, referenceMeta } from "@/lib/growth/engine";
import { isGrowthResult } from "@/lib/growth/types";
import { ChildAgeSummary } from "@/components/children/child-age-summary";
import { GrowthBadges } from "@/components/growth/growth-badges";
import { DeleteChildButton } from "@/components/children/delete-child-button";
import { FeedingDialog } from "@/components/feeding/feeding-dialog";
import { MeasurementDialog } from "@/components/measurements/measurement-dialog";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatHead, formatLength, formatWeight } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/children/[id]">): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser();
  const child = await getChild(user.id, id);
  return { title: child?.name ?? "Anak" };
}

export default async function ChildProfilePage({ params }: PageProps<"/children/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const child = await getChild(user.id, id);
  if (!child) notFound();

  const measurements = await listMeasurements(user.id, child.id, "desc");
  const latest = measurements[0];
  const growth = latest ? evaluateMeasurement(child, latest) : null;

  return (
    <div className="space-y-5">
      <Link
        href="/children"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Anak
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{child.name}</h1>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/children/${child.id}/edit`}>
            <Pencil className="size-4" aria-hidden />
            Ubah
          </Link>
        </Button>
      </header>

      <Card>
        <CardContent className="py-4">
          <ChildAgeSummary child={child} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <MeasurementDialog childId={child.id} minDate={child.dateOfBirth} />
        <FeedingDialog childId={child.id} />
        <Button asChild variant="outline">
          <Link href={`/children/${child.id}/growth`}>
            <LineChart className="size-4" aria-hidden />
            Lihat Grafik
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/children/${child.id}/measurements`}>
            <ListOrdered className="size-4" aria-hidden />
            Riwayat Pengukuran
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/children/${child.id}/feeding`}>
            <Milk className="size-4" aria-hidden />
            Riwayat Asupan
          </Link>
        </Button>
      </div>

      <section className="space-y-3" aria-labelledby="pengukuran-terakhir">
        <h2 id="pengukuran-terakhir" className="font-medium">
          Pengukuran terakhir
        </h2>

        {!latest ? (
          <EmptyState
            icon={Ruler}
            title="Belum ada pengukuran."
            description="Tambahkan pengukuran pertama untuk mulai membuat grafik pertumbuhan."
            action={<MeasurementDialog childId={child.id} minDate={child.dateOfBirth} />}
          />
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal">
                {formatDate(latest.measuredAt)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Berat</dt>
                  <dd className="font-medium tabular-nums">{formatWeight(latest.weightKg)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Tinggi</dt>
                  <dd className="font-medium tabular-nums">
                    {formatLength(latest.lengthHeightCm)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Kepala</dt>
                  <dd className="font-medium tabular-nums">
                    {formatHead(latest.headCircumferenceCm)}
                  </dd>
                </div>
              </dl>

              {growth && growth.some(isGrowthResult) && (
                <div className="mt-4 space-y-2 border-t pt-4">
                  <p className="text-muted-foreground text-xs">
                    Menurut {referenceMeta("weight-for-age", child.sex).name}
                  </p>
                  <GrowthBadges outcomes={growth} />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      <section className="pt-2">
        <DeleteChildButton childId={child.id} name={child.name} />
      </section>
    </div>
  );
}
