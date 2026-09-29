import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getChild } from "@/lib/data/children";
import { ChildForm } from "@/components/children/child-form";
import { ChildPhotoField } from "@/components/children/child-photo-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Ubah Data Anak" };

export default async function EditChildPage({ params }: PageProps<"/children/[id]/edit">) {
  const { id } = await params;
  const user = await requireUser();
  const child = await getChild(user.id, id);
  if (!child) notFound();

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Link
        href={`/children/${child.id}`}
        className="text-muted-foreground hover:text-foreground text-body-sm inline-flex w-fit items-center gap-1"
      >
        <Icon name="arrow_back" className="text-[16px]" />
        Kembali
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Ubah Data {child.name}</CardTitle>
          <CardDescription>Perubahan berpengaruh pada perhitungan usia dan reference.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ChildPhotoField child={child} />
          <ChildForm child={child} />
        </CardContent>
      </Card>
    </div>
  );
}
