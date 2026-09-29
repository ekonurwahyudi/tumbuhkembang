import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminGetParent } from "@/lib/data/admin";
import { AdminParentForm } from "@/components/admin/admin-parent-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Ubah Data Orang Tua" };

export default async function AdminEditParentPage({
  params,
}: PageProps<"/admin/parents/[id]/edit">) {
  const { id } = await params;
  const parent = await adminGetParent(id);
  if (!parent) notFound();

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Link
        href="/admin/parents"
        className="text-muted-foreground hover:text-foreground text-body-sm inline-flex w-fit items-center gap-1"
      >
        <Icon name="arrow_back" className="text-[16px]" />
        Data Orang Tua
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Ubah Data {parent.name}</CardTitle>
          <CardDescription>
            Email dipakai untuk masuk dan menerima undangan pasangan — mengubahnya mengubah cara
            akun ini login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminParentForm parent={parent} />
        </CardContent>
      </Card>
    </div>
  );
}
