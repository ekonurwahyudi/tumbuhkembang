import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminUpdateChildAction } from "@/lib/actions/admin";
import { adminGetChild } from "@/lib/data/admin";
import { ChildForm } from "@/components/children/child-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Ubah Data Anak" };

/**
 * Form yang sama dengan halaman pemilik, hanya action dan tujuan redirect-nya beda —
 * jadi aturan usia gestasi tetap tinggal di satu tempat.
 *
 * Tanpa <ChildPhotoField>: unggah/hapus foto lewat action owner-only, dan membuka itu
 * untuk admin bukan bagian permintaan.
 */
export default async function AdminEditChildPage({
  params,
}: PageProps<"/admin/children/[id]/edit">) {
  const { id } = await params;
  const row = await adminGetChild(id);
  if (!row) notFound();

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Link
        href="/admin/children"
        className="text-muted-foreground hover:text-foreground text-body-sm inline-flex w-fit items-center gap-1"
      >
        <Icon name="arrow_back" className="text-[16px]" />
        Data Anak
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Ubah Data {row.child.name}</CardTitle>
          <CardDescription>
            Milik {row.ownerName} ({row.ownerEmail}). Perubahan berpengaruh pada perhitungan usia
            dan reference pertumbuhan anak ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChildForm
            child={row.child}
            submitAction={adminUpdateChildAction.bind(null, id)}
            redirectTo="/admin/children"
          />
        </CardContent>
      </Card>
    </div>
  );
}
