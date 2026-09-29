import type { Metadata } from "next";
import Link from "next/link";
import { adminListChildren } from "@/lib/data/admin";
import { BIRTH_TYPE_LABEL, SEX_LABEL, formatDate } from "@/lib/format";
import { AdminDeleteButton } from "@/components/admin/admin-delete-button";
import { AdminSearch } from "@/components/admin/admin-search";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Data Anak" };

/**
 * Tanpa foto anak: route /children/[id]/photo ber-scope pemilik/pasangan dan menjawab 404
 * untuk orang lain. Membukanya untuk admin adalah pekerjaan terpisah yang tidak diminta.
 */
export default async function AdminChildrenPage({ searchParams }: PageProps<"/admin/children">) {
  const { q } = await searchParams;
  const term = typeof q === "string" ? q : undefined;
  const rows = await adminListChildren(term);

  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* Tanpa tautan kembali: <AdminNav> di layout sudah jadi jalan pindah modul. */}
      <div className="flex items-center gap-1.5 px-1">
        <Icon name="child_care" className="text-primary text-[16px]" />
        <span className="text-muted-foreground text-label-sm font-bold tracking-wider uppercase">
          DATA ANAK ({rows.length})
        </span>
      </div>

      <AdminSearch q={term} placeholder="Cari nama anak atau orang tua" />

      {rows.length === 0 ? (
        <div className="bg-card rounded-2xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-body-sm">
            {term ? `Tidak ada anak yang cocok dengan "${term}".` : "Belum ada anak terdaftar."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map(({ child, ownerName, ownerEmail }) => (
            <li
              key={child.id}
              className="bg-card flex items-center gap-2 rounded-2xl border p-3.5 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="text-body-md truncate font-bold">{child.name}</p>
                <p className="text-muted-foreground text-body-sm">
                  {SEX_LABEL[child.sex]} · {BIRTH_TYPE_LABEL[child.birthType]} ·{" "}
                  {formatDate(child.dateOfBirth)}
                </p>
                <p className="text-muted-foreground text-label-sm mt-0.5 truncate">
                  {ownerName} · {ownerEmail}
                </p>
              </div>

              <Button variant="ghost" size="icon" className="shrink-0" asChild>
                <Link
                  href={`/admin/children/${child.id}/edit`}
                  aria-label={`Ubah data ${child.name}`}
                >
                  <Icon name="edit" className="text-[16px]" />
                </Link>
              </Button>
              <AdminDeleteButton kind="child" id={child.id} name={child.name} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
