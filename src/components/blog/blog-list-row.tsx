import Link from "next/link";
import { BLOG_CATEGORY_LABEL } from "@/schemas/blog";
import { readingMinutes } from "@/lib/sanitize-html";
import { Icon } from "@/components/ui/icon";
import { BLOG_TONE } from "./blog-card";
import type { BlogPost } from "@/db/schema";

/**
 * Baris daftar: thumbnail kecil di kiri, teks di kanan.
 *
 * Bentuk yang BERBEDA dari `BlogCard` dengan sengaja — blok "Artikel Lainnya" ada
 * di bawah dua blok kartu, dan tiga blok berkartu sama persis terbaca sebagai satu
 * daftar panjang yang tidak pernah selesai. Baris juga memuat lebih banyak judul
 * per layar, yang pas untuk blok "sisanya".
 */
export function BlogListRow({ post, relative }: { post: BlogPost; relative?: string }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="bg-card flex items-center gap-3 rounded-2xl p-2.5 shadow-sm transition-all hover:brightness-[0.98] active:scale-[0.99]"
    >
      <span className="bg-muted relative block size-[72px] shrink-0 overflow-hidden rounded-xl">
        {post.coverKey ? (
          /* eslint-disable-next-line @next/next/no-img-element -- route sampul berotorisasi, bukan aset statis untuk next/image */
          <img
            src={`/blog/${post.slug}/cover`}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <span
            aria-hidden
            className={`grid size-full place-items-center ${
              BLOG_TONE[post.category] ?? BLOG_TONE.TUMBUH_KEMBANG
            }`}
          >
            <Icon name="menu_book" filled className="text-[24px] opacity-50" />
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1 space-y-1">
        <span
          className={`text-label-sm inline-block rounded-full px-2 py-0.5 font-bold ${
            BLOG_TONE[post.category] ?? BLOG_TONE.TUMBUH_KEMBANG
          }`}
        >
          {BLOG_CATEGORY_LABEL[post.category]}
        </span>
        <span className="text-body-sm line-clamp-2 block font-bold leading-snug">
          {post.title}
        </span>
        <span className="text-muted-foreground text-label-sm flex items-center gap-1.5">
          <Icon name="schedule" className="text-[12px]" />
          {readingMinutes(post.contentHtml)} menit
          {relative && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{relative}</span>
            </>
          )}
        </span>
      </span>

      <Icon name="chevron_right" className="text-muted-foreground shrink-0 text-[18px]" />
    </Link>
  );
}
