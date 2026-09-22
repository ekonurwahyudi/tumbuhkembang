import type { Metadata } from "next";
import Link from "next/link";
import { Baby, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listChildrenWithLatestMeasurement } from "@/lib/data/children";
import { ChildCard } from "@/components/children/child-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Anak" };

export default async function ChildrenPage() {
  const user = await requireUser();
  const items = await listChildrenWithLatestMeasurement(user.id);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Anak</h1>
        {items.length > 0 && (
          <Button asChild size="sm">
            <Link href="/children/new">
              <Plus className="size-4" aria-hidden />
              Tambah
            </Link>
          </Button>
        )}
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={Baby}
          title="Belum ada data anak."
          description="Tambahkan profil anak untuk mulai memantau pertumbuhannya."
          action={
            <Button asChild>
              <Link href="/children/new">
                <Plus className="size-4" aria-hidden />
                Tambah Anak
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.child.id}>
              <ChildCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
