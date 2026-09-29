import type { Metadata } from "next";
import Link from "next/link";
import { AdminParentForm } from "@/components/admin/admin-parent-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Tambah Orang Tua" };

export default function AdminNewParentPage() {
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
          <CardTitle>Tambah Akun Orang Tua</CardTitle>
          <CardDescription>
            Akun dibuat dengan peran pengguna biasa. Profil anak ditambahkan sendiri oleh
            pemiliknya setelah masuk.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminParentForm />
        </CardContent>
      </Card>
    </div>
  );
}
