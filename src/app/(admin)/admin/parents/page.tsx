import type { Metadata } from "next";
import Link from "next/link";
import { adminListParents } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";
import { AdminDeleteButton } from "@/components/admin/admin-delete-button";
import { AdminSearch } from "@/components/admin/admin-search";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Data Orang Tua" };

export default async function AdminParentsPage({ searchParams }: PageProps<"/admin/parents">) {
  const { q } = await searchParams;
  const term = typeof q === "string" ? q : undefined;
  const rows = await adminListParents(term);

  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* Tanpa tautan kembali: <AdminNav> di layout sudah jadi jalan pindah modul. */}
      <div className="flex items-center gap-1.5 px-1">
        <Icon name="person" className="text-primary text-[16px]" />
        <span className="text-muted-foreground text-label-sm font-bold tracking-wider uppercase">
          DATA ORANG TUA ({rows.length})
        </span>
        <Button size="sm" className="ml-auto" asChild>
          <Link href="/admin/parents/new">
            <Icon name="add" className="text-[16px]" />
            Tambah
          </Link>
        </Button>
      </div>

      <AdminSearch q={term} placeholder="Cari nama atau email" />

      {rows.length === 0 ? (
        <div className="bg-card rounded-2xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-body-sm">
            {term ? `Tidak ada akun yang cocok dengan "${term}".` : "Belum ada akun terdaftar."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((p) => (
            <li key={p.id} className="bg-card flex items-center gap-2 rounded-2xl border p-3.5 shadow-sm">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-body-md truncate font-bold">{p.name}</span>
                  {p.role === "SUPERADMIN" && (
                    <span className="bg-accent text-primary text-label-sm shrink-0 rounded px-1.5 py-0.5 font-bold">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-body-sm truncate">{p.email}</p>
                <p className="text-muted-foreground text-label-sm mt-0.5">
                  <span className="tabular-nums">{p.childCount}</span> anak · daftar{" "}
                  {formatDate(p.createdAt.toISOString().slice(0, 10))}
                </p>
              </div>

              <Button variant="ghost" size="icon" className="shrink-0" asChild>
                <Link href={`/admin/parents/${p.id}/edit`} aria-label={`Ubah akun ${p.name}`}>
                  <Icon name="edit" className="text-[16px]" />
                </Link>
              </Button>
              <AdminDeleteButton kind="parent" id={p.id} name={p.name} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
