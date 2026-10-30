import type { Metadata } from "next";
import Link from "next/link";
import { AdminBlogForm } from "@/components/admin/admin-blog-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Tulis Artikel" };

/**
 * Tanpa `force-dynamic`: halaman ini tidak query DB sama sekali — form-nya klien
 * dan tujuan semua datanya adalah Server Action.
 */
export default function AdminNewBlogPostPage() {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <Link
        href="/admin/blog"
        className="text-muted-foreground hover:text-foreground text-body-sm inline-flex w-fit items-center gap-1"
      >
        <Icon name="arrow_back" className="text-[16px]" />
        Blog
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Tulis Artikel</CardTitle>
          <CardDescription>
            Isi artikel ditulis sebagai HTML sederhana — tag di luar daftar yang diizinkan dibuang
            otomatis. Sumber wajib diisi. Artikel tersimpan sebagai draf sampai diterbitkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminBlogForm />
        </CardContent>
      </Card>
    </div>
  );
}
