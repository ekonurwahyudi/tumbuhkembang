import type { Metadata } from "next";
import Link from "next/link";
import { adminListBlogPosts } from "@/lib/data/blog";
import { BLOG_CATEGORY_LABEL } from "@/schemas/blog";
import { formatDate } from "@/lib/format";
import { AdminBlogPublishButton } from "@/components/admin/admin-blog-publish-button";
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

export const metadata: Metadata = { title: "Blog" };

/** Query DB di tingkat atas, dan build Docker tidak punya DB. */
export const dynamic = "force-dynamic";

/**
 * Daftar artikel blog. Rute statis ini menang atas `[section]` yang dinamis, jadi
 * placeholder "belum tersedia" tidak pernah tercapai lagi untuk slug `blog`.
 *
 * Draf ikut ditampilkan — itu seluruh gunanya halaman ini.
 */
export default async function AdminBlogPage({ searchParams }: PageProps<"/admin/blog">) {
  const { q } = await searchParams;
  const term = typeof q === "string" ? q : undefined;
  const rows = await adminListBlogPosts(term);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-1.5">
          <Icon name="menu_book" className="text-primary text-[16px]" />
          <span className="text-muted-foreground text-label-sm font-bold tracking-wider uppercase">
            BLOG ({rows.length})
          </span>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/blog/new">
            <Icon name="add" className="text-[16px]" />
            Tulis Artikel
          </Link>
        </Button>
      </div>

      <AdminSearch q={term} placeholder="Cari judul artikel" />

      {rows.length === 0 ? (
        <div className="bg-card rounded-2xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-body-sm">
            {term
              ? `Tidak ada artikel yang cocok dengan "${term}".`
              : "Belum ada artikel. Tulis satu, lengkap dengan sumbernya."}
          </p>
        </div>
      ) : (
        <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
          <Table className="text-body-sm">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-10 text-right">No.</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Sumber</TableHead>
                <TableHead>Diperbarui</TableHead>
                <TableHead>Status</TableHead>
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
                    <span className="block max-w-[18rem] truncate">{p.title}</span>
                    <span className="text-muted-foreground block max-w-[18rem] truncate font-normal">
                      /blog/{p.slug}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {BLOG_CATEGORY_LABEL[p.category]}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <a
                      href={p.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground inline-flex items-center gap-1"
                    >
                      <Icon name="link" className="text-[13px]" />
                      <span className="max-w-[8rem] truncate">{p.sourceName}</span>
                    </a>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(p.updatedAt.toISOString().slice(0, 10))}
                  </TableCell>
                  <TableCell>
                    {/* Statusnya tertulis, bukan hanya warna. */}
                    <span
                      className={`text-label-sm rounded-full px-2 py-0.5 font-bold ${
                        p.isPublished
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.isPublished ? "Terbit" : "Draf"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-0.5">
                      <AdminBlogPublishButton
                        id={p.id}
                        title={p.title}
                        isPublished={p.isPublished}
                      />
                      <Button variant="ghost" size="icon" asChild aria-label={`Ubah ${p.title}`}>
                        <Link href={`/admin/blog/${p.id}/edit`}>
                          <Icon name="edit" className="text-[16px]" />
                        </Link>
                      </Button>
                      <AdminDeleteButton kind="blogPost" id={p.id} name={p.title} />
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
