import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listRegistryChildren } from "@/lib/data/registry";
import { RegistryItemForm } from "@/components/registry/registry-item-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Tambah Barang Impian" };

export default async function NewRegistryItemPage() {
  const user = await requireUser();
  const childList = await listRegistryChildren(user.id);

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
          <CardTitle>Tambah Barang Impian</CardTitle>
          <CardDescription>
            Semakin jelas rinciannya, semakin kecil kemungkinan pemberi hadiah membeli yang salah.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegistryItemForm childrenList={childList} />
        </CardContent>
      </Card>
    </div>
  );
}
