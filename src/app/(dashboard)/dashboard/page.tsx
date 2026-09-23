import type { Metadata } from "next";
import Link from "next/link";
import { Baby, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listChildrenWithLatestMeasurement } from "@/lib/data/children";
import { ChildCard } from "@/components/children/child-card";
import { EmptyState } from "@/components/empty-state";
import { InstallPrompt } from "@/components/install-prompt";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Beranda" };

export default async function DashboardPage() {
  const user = await requireUser();
  const items = await listChildrenWithLatestMeasurement(user.id);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Halo, {user.name}</h1>
        <p className="text-muted-foreground text-sm">
          Pantau pertumbuhan anak Anda dari satu tempat.
        </p>
      </header>

      <InstallPrompt />

      <section className="space-y-3" aria-labelledby="anak-saya">
        <div className="flex items-center justify-between">
          <h2 id="anak-saya" className="font-medium">
            Anak Saya
          </h2>
          {items.length > 0 && (
            <Button asChild size="sm" variant="ghost">
              <Link href="/children/new">
                <Plus className="size-4" aria-hidden />
                Tambah
              </Link>
            </Button>
          )}
        </div>

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
          <>
            <ul className="grid gap-3 sm:grid-cols-2">
              {items.map((item) => (
                <li key={item.child.id}>
                  <ChildCard item={item} />
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="w-full sm:hidden">
              <Link href="/children/new">
                <Plus className="size-4" aria-hidden />
                Tambah Anak
              </Link>
            </Button>
          </>
        )}
      </section>
    </div>
  );
}
