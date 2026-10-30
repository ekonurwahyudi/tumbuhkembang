import type { Metadata } from "next";
import Link from "next/link";
import { listBlogCategoryCounts, listBlogPosts } from "@/lib/data/blog";
import { BLOG_CATEGORIES, BLOG_CATEGORY_LABEL, isBlogCategory } from "@/schemas/blog";
import { BlogCard } from "@/components/blog/blog-card";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = {
  title: "Artikel",
  description: "Artikel edukasi tumbuh kembang anak, bersumber dari lembaga kesehatan resmi.",
};

/** Query DB di tingkat atas, dan build Docker tidak punya DB. */
export const dynamic = "force-dynamic";

/**
 * Daftar artikel untuk orang tua. Hanya yang terbit — filternya di dalam
 * `listBlogPosts`, bukan di sini.
 *
 * Pencarian dan kategori tinggal di URL lewat `<form method="get">`, jadi halaman
 * ini tetap server component sepenuhnya: tidak ada satu pun pulau klien di sini,
 * dan hasil filternya bisa di-bookmark. Pola yang sama dengan /shop.
 */
export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  const { kategori, q } = await searchParams;
  const category = isBlogCategory(kategori) ? kategori : null;
  const term = typeof q === "string" && q.trim() !== "" ? q.trim() : undefined;

  const [posts, counts] = await Promise.all([
    listBlogPosts({ category: category ?? undefined, q: term }),
    listBlogCategoryCounts(),
  ]);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <header>
        <h1 className="text-headline-lg">Artikel</h1>
        <p className="text-muted-foreground text-body-sm mt-0.5">
          Panduan tumbuh kembang anak, bersumber dari lembaga kesehatan resmi.
        </p>
      </header>

      {/* Satu form GET berisi cari DAN kategori: form terpisah akan membuang
          `kategori` setiap kali kotak carinya disubmit. */}
      <form method="get" className="space-y-2.5">
        <input
          type="search"
          name="q"
          defaultValue={term ?? ""}
          placeholder="Cari judul atau topik artikel..."
          aria-label="Cari artikel"
          className="bg-card text-body-sm focus-visible:ring-ring h-10 w-full rounded-xl px-3.5 shadow-sm outline-none focus-visible:ring-2"
        />

        {/* Pil kategori sebagai tautan, bukan input: tiap kategori jadi URL yang
            bisa dibagikan, dan tanpa JS pun ia tetap bekerja. `q` ikut terbawa
            supaya mengganti kategori tidak membuang kata pencarian. */}
        <div className="flex flex-wrap gap-1.5">
          <CategoryPill label="Semua" href={hrefFor(null, term)} active={category === null} />
          {BLOG_CATEGORIES.filter((c) => (counts.get(c) ?? 0) > 0).map((c) => (
            <CategoryPill
              key={c}
              label={`${BLOG_CATEGORY_LABEL[c]} (${counts.get(c)})`}
              href={hrefFor(c, term)}
              active={category === c}
            />
          ))}
        </div>
      </form>

      {posts.length === 0 ? (
        <EmptyState
          icon="menu_book"
          title={term ? `Tidak ada artikel untuk "${term}".` : "Belum ada artikel."}
          description={
            term || category
              ? "Coba kata lain atau pilih Semua."
              : "Artikel edukasi akan muncul di sini."
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.id}>
              <BlogCard post={post} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function hrefFor(category: string | null, q?: string): string {
  const params = new URLSearchParams();
  if (category) params.set("kategori", category);
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `/blog?${query}` : "/blog";
}

function CategoryPill({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`text-label-sm rounded-full px-3 py-1.5 font-bold transition-colors ${
        active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground shadow-sm"
      }`}
    >
      {label}
    </Link>
  );
}
