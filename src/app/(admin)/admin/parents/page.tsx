import type { Metadata } from "next";
import Link from "next/link";
import { adminListParents } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";
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

export const metadata: Metadata = { title: "Data Orang Tua" };

export default async function AdminParentsPage({ searchParams }: PageProps<"/admin/parents">) {
  const { q } = await searchParams;
  const term = typeof q === "string" ? q : undefined;
  const rows = await adminListParents(term);

  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* Tanpa tautan kembali: <AdminNav> di header sudah jadi jalan pindah modul. */}
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
        /*
          <Table> sudah membungkus dirinya dengan overflow-x-auto, jadi di HP
          tabelnya digeser mendatar daripada kolomnya ditumpuk. Tujuh kolom tidak
          punya bentuk kartu yang masih terbaca sebagai tabel.
        */
        <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
          <Table className="text-body-sm">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-10 text-right">No.</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>No. HP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Jumlah Anak</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p, i) => (
                <TableRow key={p.id}>
                  <TableCell className="text-muted-foreground text-right tabular-nums">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-bold">
                    <span className="block max-w-[14rem] truncate">{p.name}</span>
                    <span className="text-muted-foreground text-label-sm font-normal">
                      Daftar {formatDate(p.createdAt.toISOString().slice(0, 10))}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="block max-w-[16rem] truncate">{p.email}</span>
                  </TableCell>
                  {/* Tanda pisah, bukan sel kosong: kolom kosong terbaca seperti data hilang. */}
                  <TableCell className="text-muted-foreground tabular-nums">
                    {p.phone || "—"}
                  </TableCell>
                  <TableCell>
                    {p.role === "SUPERADMIN" ? (
                      <span className="bg-accent text-primary text-label-sm rounded px-1.5 py-0.5 font-bold">
                        ADMIN
                      </span>
                    ) : (
                      <span className="bg-muted text-muted-foreground text-label-sm rounded px-1.5 py-0.5 font-bold">
                        ORANG TUA
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{p.childCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          href={`/admin/parents/${p.id}/edit`}
                          aria-label={`Ubah akun ${p.name}`}
                        >
                          <Icon name="edit" className="text-[16px]" />
                        </Link>
                      </Button>
                      <AdminDeleteButton kind="parent" id={p.id} name={p.name} />
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
