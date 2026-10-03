import type { Metadata } from "next";
import Link from "next/link";
import { adminListChildren } from "@/lib/data/admin";
import { BIRTH_TYPE_LABEL, SEX_LABEL, formatDate } from "@/lib/format";
import { AdminDeleteButton } from "@/components/admin/admin-delete-button";
import { AdminSearch } from "@/components/admin/admin-search";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      {/* Tanpa tautan kembali: <AdminNav> di header sudah jadi jalan pindah modul. */}
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
        /*
          Kolomnya sejajar tabel orang tua, tapi tidak identik: "jumlah anak" tidak
          punya arti di baris anak, jadi tempatnya diisi data anaknya sendiri (jenis
          kelamin, kelahiran, tanggal lahir) dan kontak orang tuanya.
        */
        <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
          <Table className="text-body-sm">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-10 text-right">No.</TableHead>
                <TableHead>Nama Anak</TableHead>
                <TableHead>Jenis Kelamin</TableHead>
                <TableHead>Tanggal Lahir</TableHead>
                <TableHead>Kelahiran</TableHead>
                <TableHead>Orang Tua</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ child, ownerName, ownerEmail }, i) => (
                <TableRow key={child.id}>
                  <TableCell className="text-muted-foreground text-right tabular-nums">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-bold">
                    <span className="block max-w-[12rem] truncate">{child.name}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{SEX_LABEL[child.sex]}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {formatDate(child.dateOfBirth)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {BIRTH_TYPE_LABEL[child.birthType]}
                  </TableCell>
                  <TableCell>
                    <span className="block max-w-[12rem] truncate">{ownerName}</span>
                    <span className="text-muted-foreground text-label-sm block max-w-[12rem] truncate">
                      {ownerEmail}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          href={`/admin/children/${child.id}/edit`}
                          aria-label={`Ubah data ${child.name}`}
                        >
                          <Icon name="edit" className="text-[16px]" />
                        </Link>
                      </Button>
                      <AdminDeleteButton kind="child" id={child.id} name={child.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
