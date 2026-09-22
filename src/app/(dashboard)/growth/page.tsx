import type { Metadata } from "next";
import Link from "next/link";
import { Baby, ChevronRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listChildren } from "@/lib/data/children";
import { chronologicalAge, formatAge } from "@/lib/growth/age";
import { EmptyState } from "@/components/empty-state";
import { MedicalDisclaimer } from "@/components/medical-disclaimer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Pertumbuhan" };

export default async function GrowthIndexPage() {
  const user = await requireUser();
  const children = await listChildren(user.id);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Pertumbuhan</h1>
        <p className="text-muted-foreground text-sm">Pilih anak untuk melihat perkembangannya.</p>
      </header>

      {children.length === 0 ? (
        <EmptyState
          icon={Baby}
          title="Belum ada data anak."
          description="Tambahkan profil anak untuk mulai memantau pertumbuhannya."
          action={
            <Button asChild>
              <Link href="/children/new">Tambah Anak</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {children.map((child) => (
            <li key={child.id}>
              <Card>
                <CardContent className="p-0">
                  <Link
                    href={`/children/${child.id}/growth`}
                    className="hover:bg-accent/50 flex min-h-14 items-center justify-between gap-3 rounded-xl px-4 py-3 transition-colors"
                  >
                    <span>
                      <span className="block font-medium">{child.name}</span>
                      <span className="text-muted-foreground block text-sm">
                        {formatAge(chronologicalAge(child.dateOfBirth))}
                      </span>
                    </span>
                    <ChevronRight className="text-muted-foreground size-4" aria-hidden />
                  </Link>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <MedicalDisclaimer />
    </div>
  );
}
