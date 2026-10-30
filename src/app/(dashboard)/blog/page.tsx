import type { Metadata } from "next";
import Link from "next/link";
import { listBlogCategoryCounts, listBlogPosts, listCuratedPosts } from "@/lib/data/blog";
import {
  BLOG_CATEGORY_LABEL,
  BLOG_VIDEO_TOPIC,
  isBlogCategory,
  type BlogCategoryValue,
} from "@/schemas/blog";
import { formatRelative } from "@/lib/format";
import { readingMinutes } from "@/lib/sanitize-html";
import { interleave, shuffle } from "@/lib/video/feed";
import { fetchYoutubeVideos, TOPIC_QUERIES, type FetchedVideo } from "@/lib/video/youtube";
import { BlogCard } from "@/components/blog/blog-card";
import { BlogCategorySelect } from "@/components/blog/blog-category-select";
import { BlogListRow } from "@/components/blog/blog-list-row";
import { VideoShelf } from "@/components/video/video-shelf";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/ui/icon";
import type { BlogPost } from "@/db/schema";

export const metadata: Metadata = {
  title: "Artikel",
  description: "Artikel edukasi tumbuh kembang anak, bersumber dari lembaga kesehatan resmi.",
};

/** Query DB di tingkat atas, dan build Docker tidak punya DB. */
export const dynamic = "force-dynamic";

/** Berapa yang tampil di tiap blok sebelum tombol "lainnya". */
const SLIDE_COUNT = 4;
const CURATED_COUNT = 4;
const LIST_COUNT = 5;

/**
 * Halaman artikel, empat blok dengan bentuk yang sengaja berbeda-beda:
 *
 *   1. Terbaru   — kartu besar digeser mendatar (carousel).
 *   2. Pilihan   — grid dua kolom, empat artikel.
 *   3. Video     — rak thumbnail Shorts; iframe baru dipasang saat diketuk.
 *   4. Lainnya   — baris berthumbnail kecil, lima artikel.
 *
 * Bentuk yang berbeda itu yang membuat halaman ini terbaca sebagai empat bagian,
 * bukan satu daftar panjang. Saat orang MENYARING (cari/kategori), semua blok itu
 * runtuh jadi satu grid hasil — yang dicari orang adalah hasilnya, bukan susunannya.
 */
export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  const { kategori, q } = await searchParams;
  const category = isBlogCategory(kategori) ? kategori : null;
  const term = typeof q === "string" && q.trim() !== "" ? q.trim() : undefined;
  const filtering = Boolean(category || term);

  const [posts, counts, curated, videos] = await Promise.all([
    listBlogPosts({ category: category ?? undefined, q: term }),
    listBlogCategoryCounts(),
    filtering ? Promise.resolve([]) : listCuratedPosts(CURATED_COUNT),
    /*
      Rak video ikut menyesuaikan saringan — memilih "Imunisasi" lalu melihat rak
      video MPASI terbaca seperti saringannya setengah jalan.

      Kategori → satu topik tetap (`BLOG_VIDEO_TOPIC`); tanpa kategori → tiga topik
      campuran. Yang TIDAK dilakukan: mengirim kata pencarian bebas ke YouTube.
      Tiap kata kunci unik adalah satu `search.list` (100 unit) dengan entri
      cache-nya sendiri, dan pencarian bebas berarti kunci cache tak terbatas —
      kuota 10.000 unit/hari habis oleh beberapa puluh pencarian. Kata pencarian
      menyaring hasil yang sudah ada, di bawah.
    */
    fetchShelf(category),
  ]);

  // Waktu relatif dihitung di server dan dikirim sebagai string: `formatRelative` di
  // klien memakai jam perangkat, dan itu membuat teks server beda dengan klien.
  const now = new Date();
  const ago = (p: BlogPost) => formatRelative(p.createdAt, now);

  /*
    Kata pencarian menyaring judul video yang SUDAH ditarik, bukan dikirim ke
    YouTube (alasannya di atas). Konsekuensinya jujur: hasilnya terbatas pada
    belasan video topik itu, jadi pencarian sempit bisa tidak menemukan apa pun —
    dan saat itu terjadi raknya menghilang, bukan menampilkan video yang tidak
    nyambung.
  */
  const shelf = term
    ? videos.filter((v) => v.title.toLowerCase().includes(term.toLowerCase()))
    : videos;

  const curatedIds = new Set(curated.map((p) => p.id));
  // Empat, bukan enam: tiap slide selebar layar penuh, dan geseran kelima terasa
  // seperti daftar yang tidak selesai-selesai di tempat yang seharusnya sekilas.
  const latest = posts.slice(0, SLIDE_COUNT);
  const latestIds = new Set(latest.map((p) => p.id));
  // Blok 4 tidak mengulang apa yang sudah tampil di blok 1 dan 2.
  const others = posts.filter((p) => !latestIds.has(p.id) && !curatedIds.has(p.id));

  return (
    <div className="flex flex-col gap-6 pt-2">
      <header>
        <h1 className="text-headline-lg">Artikel</h1>
        <p className="text-muted-foreground text-body-sm mt-0.5">
          Panduan tumbuh kembang anak, bersumber dari lembaga kesehatan resmi.
        </p>
      </header>

      {/*
        Satu form GET berisi cari DAN kategori: form terpisah akan membuang
        `kategori` setiap kali kotak carinya disubmit.

        Kategori jadi satu ikon di sebelah kotak cari, bukan deret pil: enam pil
        memakan satu baris penuh di HP, dan baris itu mendorong artikelnya keluar
        layar sebelum apa pun sempat terlihat.
      */}
      <form method="get" className="flex items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={term ?? ""}
          placeholder="Cari judul atau topik artikel..."
          aria-label="Cari artikel"
          className="bg-card text-body-sm focus-visible:ring-ring h-11 min-w-0 flex-1 rounded-2xl px-4 shadow-sm outline-none focus-visible:ring-2"
        />
        <BlogCategorySelect value={category} counts={counts} />
      </form>

      {filtering ? (
        /*
          Sedang menyaring: satu grid artikel, lalu rak video yang ikut tersaring.
          Keduanya ditampilkan berdampingan supaya orang bisa memilih mau membaca
          atau menonton — tanpa harus pindah halaman dan menyaring ulang di sana.
        */
        <>
          {posts.length === 0 ? (
            <EmptyState
              icon="menu_book"
              title={term ? `Tidak ada artikel untuk "${term}".` : "Belum ada artikel."}
              description={
                shelf.length > 0
                  ? "Coba kata lain, atau tonton video di bawah."
                  : "Coba kata lain atau pilih Semua Kategori."
              }
            />
          ) : (
            <section className="space-y-3">
              <h2 className="text-headline-sm">{posts.length} artikel ditemukan</h2>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
                {posts.map((p) => (
                  <li key={p.id}>
                    <BlogCard post={p} relative={ago(p)} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {shelf.length > 0 && (
            <section className="space-y-3">
              <SectionHead
                title={category ? `Video ${BLOG_CATEGORY_LABEL[category]}` : "Video Terkait"}
                href="/video"
                hrefLabel="Semua video"
              />
              <VideoShelf videos={shelf} />
            </section>
          )}
        </>
      ) : posts.length === 0 ? (
        <EmptyState
          icon="menu_book"
          title="Belum ada artikel."
          description="Artikel edukasi akan muncul di sini."
        />
      ) : (
        <>
          {/*
            ---------- Blok 1: slide terbaru ----------

            Satu slide memenuhi lebar, digeser kiri-kanan. Tanpa judul blok: slide
            ini bagian paling atas halaman dan sudah menjelaskan dirinya sendiri —
            label di atasnya cuma mendorong gambarnya turun.

            `w-full` + `snap-center`: tiap geseran berhenti tepat di satu slide,
            bukan di antara dua. `-mx-4 px-4` membuat slide menyentuh tepi layar
            saat digeser tapi tetap sejajar dengan isi halaman saat diam.
          */}
          <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {latest.map((p) => (
              <li key={p.id} className="w-full shrink-0 snap-center">
                <BlogSlide post={p} relative={ago(p)} />
              </li>
            ))}
          </ul>

          {/* ---------- Blok 2: pilihan redaksi ---------- */}
          {curated.length > 0 && (
            <section className="space-y-3">
              {/* Menaut ke seluruh artikel, bukan ke satu kategori: "lainnya" di
                  sini berarti bacaan lain, dan menyempitkannya ke satu kategori
                  justru menyembunyikan sebagian besarnya. */}
              <SectionHead title="Pilihan Redaksi" href="/blog/semua" hrefLabel="Lainnya" />
              <ul className="grid grid-cols-2 gap-x-3 gap-y-5 lg:grid-cols-4">
                {curated.map((p) => (
                  <li key={p.id}>
                    <BlogCard post={p} relative={ago(p)} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ---------- Blok 3: rak video pendek ---------- */}
          {shelf.length > 0 && (
            <section className="space-y-3">
              <SectionHead title="Video Pendek" href="/video" hrefLabel="Semua video" />
              <VideoShelf videos={shelf} />
            </section>
          )}

          {/* ---------- Blok 4: sisanya, sebagai daftar ---------- */}
          {others.length > 0 && (
            <section className="space-y-3">
              <SectionHead title="Artikel Lainnya" />
              <ul className="space-y-2">
                {others.slice(0, LIST_COUNT).map((p) => (
                  <li key={p.id}>
                    <BlogListRow post={p} relative={ago(p)} />
                  </li>
                ))}
              </ul>

              {/* Tombolnya hanya muncul bila memang masih ada sisanya. */}
              {others.length > LIST_COUNT && (
                <Link
                  href="/blog/semua"
                  className="bg-card text-body-sm flex items-center justify-center gap-1.5 rounded-2xl p-3 font-bold shadow-sm"
                >
                  Lihat {others.length - LIST_COUNT} artikel lainnya
                  <Icon name="arrow_forward" className="text-[16px]" />
                </Link>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Menarik rak video sesuai kategori yang sedang dipilih.
 *
 * Tanpa kategori: tiga topik campuran. Dengan kategori: satu topik yang sepadan,
 * dan jumlahnya dinaikkan jadi 12 supaya raknya tidak jadi terlalu pendek saat
 * hanya satu sumber topik.
 *
 * Penarikan yang gagal (API key kosong, kuota habis) jadi daftar kosong: raknya
 * menghilang, halaman artikelnya tetap utuh.
 */
async function fetchShelf(category: BlogCategoryValue | null): Promise<FetchedVideo[]> {
  const topics = category ? [BLOG_VIDEO_TOPIC[category]] : (["MPASI", "GROWTH", "HEALTH"] as const);
  const perTopic = category ? 12 : 6;

  const results = await Promise.all(
    topics.map((t) => fetchYoutubeVideos(TOPIC_QUERIES[t], perTopic)),
  );
  return shuffle(interleave(results.map((r) => (r.ok ? r.videos : [])))).slice(0, 12);
}

/**
 * Slide penuh di kepala halaman: gambar lebar dengan judul di atasnya.
 *
 * Teksnya putih di atas gradien gelap — gradien itu yang menjamin kontrasnya,
 * bukan keberuntungan warna fotonya. Tanpa sampul, gradien warna menggantikan
 * gambarnya; ruang kosong setinggi gambar terbaca seperti gambar yang gagal dimuat.
 */
function BlogSlide({ post, relative }: { post: BlogPost; relative: string }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="relative block aspect-[16/11] w-full overflow-hidden rounded-3xl shadow-sm sm:aspect-[2/1]"
    >
      {post.coverKey ? (
        /* eslint-disable-next-line @next/next/no-img-element -- route sampul berotorisasi, bukan aset statis untuk next/image */
        <img
          src={`/blog/${post.slug}/cover`}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-sky-400 to-violet-500"
        />
      )}

      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
      />

      <span className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-1.5 p-4 sm:p-5">
        <span className="text-label-sm rounded-full bg-white/90 px-2.5 py-1 font-bold text-slate-900">
          {BLOG_CATEGORY_LABEL[post.category]}
        </span>
        <span className="text-headline-md sm:text-headline-lg line-clamp-2 text-white">
          {post.title}
        </span>
        <span className="text-label-sm flex items-center gap-1.5 text-white/85">
          <Icon name="schedule" className="text-[13px]" />
          {readingMinutes(post.contentHtml)} menit · {relative}
        </span>
      </span>
    </Link>
  );
}

function SectionHead({
  title,
  href,
  hrefLabel,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-headline-sm">{title}</h2>
      {href && (
        <Link
          href={href}
          className="text-muted-foreground text-label-sm flex shrink-0 items-center gap-1 font-bold"
        >
          {hrefLabel}
          <Icon name="arrow_forward" className="text-[14px]" />
        </Link>
      )}
    </div>
  );
}

