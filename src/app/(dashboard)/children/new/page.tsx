import type { Metadata } from "next";
import Link from "next/link";
import { ChildForm } from "@/components/children/child-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Tambah Anak" };

export default function NewChildPage() {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <Link
        href="/children"
        className="text-muted-foreground hover:text-foreground text-body-sm inline-flex w-fit items-center gap-1"
      >
        <Icon name="arrow_back" className="text-[16px]" />
        Kembali
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Tambah Anak</CardTitle>
          <CardDescription>
            Data ini dipakai untuk memilih reference pertumbuhan yang sesuai.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChildForm />
        </CardContent>
      </Card>
    </div>
  );
}
