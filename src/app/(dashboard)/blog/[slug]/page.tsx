import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPost, listRelatedPosts } from "@/lib/data/blog";
import { BLOG_CATEGORY_LABEL } from "@/schemas/blog";
import { formatDate } from "@/lib/format";
import { readingMinutes } from "@/lib/sanitize-html";
import { BLOG_TONE, BlogCard } from "@/components/blog/blog-card";
import { Icon } from "@/components/ui/icon";

/** Query DB di tingkat atas, dan build Docker tidak punya DB. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Artikel tidak ditemukan" };
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  // Artikel draf dan slug asing sama-sama `undefined` — keduanya 404, tidak bisa
  // dibedakan dari luar.
  if (!post) notFound();

  const related = await listRelatedPosts(post);

  return (
    <article className="flex flex-col gap-4 pt-2">
      <Link
        href="/blog"
        className="text-muted-foreground text-label-sm flex w-fit items-center gap-1 font-bold"
      >
        <Icon name="arrow_back" className="text-[14px]" />
        Semua Artikel
      </Link>

      {post.coverKey && (
        <span className="bg-muted block aspect-[16/10] w-full overflow-hidden rounded-3xl shadow-sm sm:aspect-[2/1]">
          {/* eslint-disable-next-line @next/next/no-img-element -- route sampul berotorisasi, bukan aset statis untuk next/image */}
          <img src={`/blog/${post.slug}/cover`} alt="" className="size-full object-cover" />
        </span>
      )}

      <header className="space-y-2.5">
        <span
          className={`text-label-sm w-fit rounded-full px-2.5 py-1 font-bold ${
            BLOG_TONE[post.category] ?? BLOG_TONE.TUMBUH_KEMBANG
          }`}
        >
          {BLOG_CATEGORY_LABEL[post.category]}
        </span>
        <h1 className="text-headline-lg">{post.title}</h1>
        <p className="text-muted-foreground text-body-sm">{post.excerpt}</p>
        <p className="text-muted-foreground text-label-sm flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1">
            <Icon name="schedule" className="text-[13px]" />
            {readingMinutes(post.contentHtml)} menit baca
          </span>
          <span aria-hidden>•</span>
          <span>Diperbarui {formatDate(post.updatedAt.toISOString().slice(0, 10))}</span>
        </p>
      </header>

      {/*
        `dangerouslySetInnerHTML` dipakai dengan satu syarat yang sudah dipenuhi di
        jalur tulisnya: `content_html` SELALU hasil `sanitizeHtml()` — pembersihan
        terjadi di `blogPostSchema`, pintu satu-satunya menuju tabel ini. Jangan
        pernah merender kolom lain dengan cara ini.

        Gaya tipografinya ditulis di sini sebagai kelas anak (`[&_p]`), bukan plugin
        prose: hanya segelintir tag yang diizinkan sanitizer, jadi daftarnya pendek
        dan tidak perlu dependency baru.
      */}
      <div
        /* `max-w-[68ch]`: baris teks yang melebihi ~70 karakter membuat mata
           kehilangan baris berikutnya saat kembali ke kiri. */
        className="text-body-md [&_h2]:text-headline-md [&_h3]:text-headline-sm [&_a]:text-primary max-w-[68ch] space-y-3.5 leading-relaxed [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--rule)] [&_blockquote]:pl-3 [&_blockquote]:italic [&_h2]:mt-6 [&_h3]:mt-5 [&_li]:ml-4 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ul]:list-disc [&_ul]:space-y-1.5"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />

      {/*
        Penyangkalan medis, bukan hiasan: aplikasi ini tidak menilai kondisi medis
        sendiri, dan pembaca harus tahu batas gunanya artikel ini.
      */}
      <aside className="bg-muted flex items-start gap-2 rounded-2xl p-4">
        <Icon name="info" className="text-muted-foreground mt-0.5 shrink-0 text-[15px]" />
        <p className="text-muted-foreground text-label-sm">
          Artikel ini ringkasan edukasi, bukan pengganti pemeriksaan tenaga kesehatan. Konsultasikan
          kondisi anak Anda ke dokter atau bidan.
        </p>
      </aside>

      {related.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-headline-sm">Bacaan Lain</h2>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3">
            {related.map((r) => (
              <li key={r.id}>
                <BlogCard post={r} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
