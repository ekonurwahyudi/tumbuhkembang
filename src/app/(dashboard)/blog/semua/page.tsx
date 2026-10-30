import type { Metadata } from "next";
import Link from "next/link";
import { listBlogPosts } from "@/lib/data/blog";
import { formatRelative } from "@/lib/format";
import { BlogListRow } from "@/components/blog/blog-list-row";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Semua Artikel" };

/** Query DB di tingkat atas, dan build Docker tidak punya DB. */
export const dynamic = "force-dynamic";

/**
 * Seluruh artikel sebagai satu daftar. Tujuan tombol "Lihat N artikel lainnya" di
 * /blog — di sana sengaja hanya lima yang tampil supaya empat bloknya tetap muat
 * dalam beberapa layar.
 *
 * Bentuknya baris, sama dengan blok asalnya: orang yang menekan "lainnya" sedang
 * memindai judul, bukan melihat-lihat gambar.
 */
export default async function AllBlogPostsPage() {
  const posts = await listBlogPosts();
  const now = new Date();

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Link
        href="/blog"
        className="text-muted-foreground text-label-sm flex w-fit items-center gap-1 font-bold"
      >
        <Icon name="arrow_back" className="text-[14px]" />
        Artikel
      </Link>

      <header>
        <h1 className="text-headline-lg">Semua Artikel</h1>
        <p className="text-muted-foreground text-body-sm mt-0.5">
          {posts.length} artikel, terbaru lebih dulu.
        </p>
      </header>

      {posts.length === 0 ? (
        <EmptyState
          icon="menu_book"
          title="Belum ada artikel."
          description="Artikel edukasi akan muncul di sini."
        />
      ) : (
        <ul className="space-y-2">
          {posts.map((p) => (
            <li key={p.id}>
              <BlogListRow post={p} relative={formatRelative(p.createdAt, now)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
