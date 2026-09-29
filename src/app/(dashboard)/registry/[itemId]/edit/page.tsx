import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getRegistryItem, listRegistryChildren } from "@/lib/data/registry";
import { RegistryItemForm } from "@/components/registry/registry-item-form";
import { RegistryPhotoField } from "@/components/registry/registry-photo-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Ubah Barang Impian" };

export default async function EditRegistryItemPage({
  params,
}: PageProps<"/registry/[itemId]/edit">) {
  const user = await requireUser();
  const { itemId } = await params;

  // Barang milik orang lain sama saja dengan tidak ada — 404, bukan pesan lain.
  const [item, childList] = await Promise.all([
    getRegistryItem(user.id, itemId),
    listRegistryChildren(user.id),
  ]);
  if (!item) notFound();

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Link
        href="/registry"
        className="text-muted-foreground hover:text-foreground text-body-sm inline-flex w-fit items-center gap-1"
      >
        <Icon name="arrow_back" className="text-[16px]" />
        Kembali
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Ubah {item.name}</CardTitle>
          <CardDescription>
            Perubahan langsung terlihat di tautan publik bila wishlist Anda sedang dibagikan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Foto punya action sendiri: mengganti foto tidak perlu menyimpan ulang form. */}
          <RegistryPhotoField item={item} />
          <RegistryItemForm item={item} childrenList={childList} />
        </CardContent>
      </Card>
    </div>
  );
}
