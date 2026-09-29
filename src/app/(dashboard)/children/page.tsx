import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listChildrenWithLatestForViewer } from "@/lib/data/children";
import { ChildCard } from "@/components/children/child-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Anak" };

export default async function ChildrenPage() {
  const user = await requireUser();
  const items = await listChildrenWithLatestForViewer(user.id);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <header className="flex items-center justify-between">
        <h1 className="text-headline-lg">Anak</h1>
        {items.length > 0 && (
          <Button asChild size="sm">
            <Link href="/children/new">
              <Icon name="add" className="text-[16px]" />
              Tambah
            </Link>
          </Button>
        )}
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon="child_care"
          title="Belum ada data anak."
          description="Tambahkan profil anak untuk mulai memantau pertumbuhannya."
          action={
            <Button asChild>
              <Link href="/children/new">
                <Icon name="add" className="text-[16px]" />
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
