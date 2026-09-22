import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getChild } from "@/lib/data/children";
import { listMeasurements } from "@/lib/data/measurements";
import { ChildAgeSummary } from "@/components/children/child-age-summary";
import { MeasurementList } from "@/components/measurements/measurement-list";
import { MedicalDisclaimer } from "@/components/medical-disclaimer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Pertumbuhan" };

export default async function GrowthPage({ params }: PageProps<"/children/[id]/growth">) {
  const { id } = await params;
  const user = await requireUser();
  const child = await getChild(user.id, id);
  if (!child) notFound();

  const measurements = await listMeasurements(user.id, child.id, "asc");

  return (
    <div className="space-y-5">
      <Link
        href={`/children/${child.id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeft className="size-4" aria-hidden />
        {child.name}
      </Link>

      <header>
        <h1 className="text-xl font-semibold tracking-tight">Pertumbuhan {child.name}</h1>
      </header>

      <Card>
        <CardContent className="py-4">
          <ChildAgeSummary child={child} />
        </CardContent>
      </Card>

      {/*
        Grafik dengan reference curve WHO/Fenton belum diaktifkan karena dataset
        reference-nya belum dimasukkan ke repository. Menampilkan grafik tanpa
        reference akan menyesatkan, jadi halaman ini menyatakan statusnya apa adanya
        dan tetap menampilkan data mentah yang sudah tercatat.
      */}
      <Alert>
        <AlertTitle>Grafik pertumbuhan belum tersedia</AlertTitle>
        <AlertDescription>
          Grafik beserta kurva reference (WHO Child Growth Standards untuk anak cukup bulan,
          Fenton untuk bayi prematur) sedang disiapkan. Data yang Anda catat tetap tersimpan
          lengkap dan akan langsung tampil pada grafik begitu reference resminya diterapkan.
        </AlertDescription>
      </Alert>

      <section className="space-y-3" aria-labelledby="data-tercatat">
        <h2 id="data-tercatat" className="font-medium">
          Data tercatat
        </h2>
        {measurements.length === 0 ? (
          <p className="text-muted-foreground text-sm">Belum ada pengukuran.</p>
        ) : (
          <MeasurementList
            measurements={[...measurements].reverse()}
            childId={child.id}
            dateOfBirth={child.dateOfBirth}
          />
        )}
      </section>

      <MedicalDisclaimer />
    </div>
  );
}
