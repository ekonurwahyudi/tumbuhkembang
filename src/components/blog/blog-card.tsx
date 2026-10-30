import Link from "next/link";
import { BLOG_CATEGORY_LABEL } from "@/schemas/blog";
import { readingMinutes } from "@/lib/sanitize-html";
import { Icon } from "@/components/ui/icon";
import type { BlogPost } from "@/db/schema";

/**
 * Warna per kategori — sebahasa dengan ubin Akses Cepat: pembeda tempat, bukan
 * penanda status. Labelnya selalu tertulis, jadi tidak ada makna yang hilang bila
 * warnanya tidak terbedakan.
 */
export const BLOG_TONE: Record<string, string> = {
  NUTRISI: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  TUMBUH_KEMBANG: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  IMUNISASI: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  KESEHATAN: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  PERAWATAN: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  IBU: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300",
};

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="bg-card flex h-full flex-col gap-2 rounded-2xl p-4 shadow-sm transition-all hover:brightness-[0.98] active:scale-[0.99]"
    >
      <span
        className={`text-label-sm w-fit rounded-full px-2.5 py-1 font-bold ${
          BLOG_TONE[post.category] ?? BLOG_TONE.TUMBUH_KEMBANG
        }`}
      >
        {BLOG_CATEGORY_LABEL[post.category]}
      </span>

      <h3 className="text-headline-sm line-clamp-2">{post.title}</h3>
      <p className="text-muted-foreground text-body-sm line-clamp-3 flex-1">{post.excerpt}</p>

      <p className="text-muted-foreground text-label-sm flex items-center gap-2">
        <span className="flex items-center gap-1">
          <Icon name="schedule" className="text-[13px]" />
          {readingMinutes(post.contentHtml)} menit baca
        </span>
        <span aria-hidden>•</span>
        {/* Sumber tampil di kartu, bukan hanya di dalam artikel: pembaca berhak
            tahu dari mana klaimnya berasal sebelum memutuskan membukanya. */}
        <span className="truncate">{post.sourceName}</span>
      </p>
    </Link>
  );
}
