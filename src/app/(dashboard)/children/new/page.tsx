import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ChildForm } from "@/components/children/child-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Tambah Anak" };

export default function NewChildPage() {
  return (
    <div className="space-y-4">
      <Link
        href="/children"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeft className="size-4" aria-hidden />
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
