import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminGetShopProduct } from "@/lib/data/shop";
import { AdminShopForm } from "@/components/admin/admin-shop-form";
import { AdminShopPhotoField } from "@/components/admin/admin-shop-photo-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Ubah Produk" };

/** Query DB di tingkat atas, dan build Docker tidak punya DB. */
export const dynamic = "force-dynamic";

/**
 * Foto di atas form, bukan di dalamnya: foto punya action sendiri, jadi mengganti
 * foto tidak perlu menyimpan ulang form — dan sebaliknya.
 */
export default async function AdminEditShopProductPage({
  params,
}: PageProps<"/admin/shop/[id]/edit">) {
  const { id } = await params;
  const product = await adminGetShopProduct(id);
  if (!product) notFound();

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
          <CardTitle>Ubah {product.name}</CardTitle>
          <CardDescription>
            {product.isPublished
              ? "Produk ini sudah terbit — perubahannya langsung terlihat orang tua."
              : "Produk ini masih draf dan belum terlihat orang tua."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <AdminShopPhotoField product={product} />
          <AdminShopForm product={product} />
        </CardContent>
      </Card>
    </div>
  );
}
