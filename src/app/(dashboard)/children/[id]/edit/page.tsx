import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getChild } from "@/lib/data/children";
import { ChildForm } from "@/components/children/child-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Ubah Data Anak" };

export default async function EditChildPage({ params }: PageProps<"/children/[id]/edit">) {
  const { id } = await params;
  const user = await requireUser();
  const child = await getChild(user.id, id);
  if (!child) notFound();

  return (
    <div className="space-y-4">
      <Link
        href={`/children/${child.id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Kembali
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Ubah Data {child.name}</CardTitle>
          <CardDescription>Perubahan berpengaruh pada perhitungan usia dan reference.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChildForm child={child} />
        </CardContent>
      </Card>
    </div>
  );
}
