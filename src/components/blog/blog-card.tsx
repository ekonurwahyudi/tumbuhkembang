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

/**
 * Kartu artikel. Gambarnya kartu tersendiri yang membulat penuh, bukan gambar yang
 * menempel di tepi atas — lalu teksnya duduk DI BAWAH kartu itu tanpa latar sendiri.
 * Bentuk ini membuat deretan kartu terbaca sebagai galeri, bukan tumpukan kotak.
 *
 * Tanpa sampul, petak kategori berwarna menggantikan gambarnya: ruang kosong
 * setinggi gambar terbaca seperti gambar yang gagal dimuat.
 */
export function BlogCard({ post, relative }: { post: BlogPost; relative?: string }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group flex h-full flex-col gap-2.5">
      <span className="bg-muted relative block aspect-square w-full overflow-hidden rounded-2xl">
        {post.coverKey ? (
          /* eslint-disable-next-line @next/next/no-img-element -- route sampul berotorisasi, bukan aset statis untuk next/image */
          <img
            src={`/blog/${post.slug}/cover`}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <span
            aria-hidden
            className={`grid size-full place-items-center ${
              BLOG_TONE[post.category] ?? BLOG_TONE.TUMBUH_KEMBANG
            }`}
          >
            <Icon name="menu_book" filled className="text-[36px] opacity-50" />
          </span>
        )}

        {/* Keping kategori di atas gambar, seperti keping tandai di contoh:
            satu penanda bulat di sudut, bukan baris label yang memakan tinggi. */}
        <span
          className={`text-label-sm absolute top-2.5 left-2.5 rounded-full px-2.5 py-1 font-bold shadow-sm backdrop-blur-sm ${
            BLOG_TONE[post.category] ?? BLOG_TONE.TUMBUH_KEMBANG
          }`}
        >
          {BLOG_CATEGORY_LABEL[post.category]}
        </span>
      </span>

      <h3 className="text-headline-sm line-clamp-2 leading-snug">{post.title}</h3>

      {/* Satu baris meta kecil di kaki kartu — bukan ringkasan tiga baris:
          di grid dua kolom, ringkasan membuat tiap kartu setinggi layar. */}
      <p className="text-muted-foreground text-label-sm mt-auto flex items-center gap-1.5">
        <Icon name="schedule" className="text-[13px]" />
        {readingMinutes(post.contentHtml)} menit
        {relative && (
          <>
            <span aria-hidden>·</span>
            <span className="truncate">{relative}</span>
          </>
        )}
      </p>
    </Link>
  );
}
