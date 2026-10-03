import type { Metadata } from "next";
import Link from "next/link";
import { AdminShopForm } from "@/components/admin/admin-shop-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Tambah Produk" };

/**
 * Tanpa `force-dynamic`: halaman ini tidak query DB sama sekali — form-nya klien
 * dan tujuan semua datanya adalah Server Action.
 */
export default function AdminNewShopProductPage() {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <Link
        href="/admin/shop"
        className="text-muted-foreground hover:text-foreground text-body-sm inline-flex w-fit items-center gap-1"
      >
        <Icon name="arrow_back" className="text-[16px]" />
        Katalog Shop
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Tambah Produk Katalog</CardTitle>
          <CardDescription>
            Tempel satu tautan Shopee atau Tokopedia dan tekan Baca — nama dan fotonya terisi
            sendiri. Produk tersimpan sebagai draf sampai diterbitkan, jadi aman disiapkan setengah
            jadi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminShopForm />
        </CardContent>
      </Card>
    </div>
  );
}
