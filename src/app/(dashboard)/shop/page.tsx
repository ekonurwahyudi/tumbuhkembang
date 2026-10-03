import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listShopProducts, listShopSuggestions } from "@/lib/data/shop";
import { listFavoriteIds, listFavoriteProducts } from "@/lib/data/shop-favorites";
import { isShopCategory } from "@/schemas/shop";
import { cn } from "@/lib/utils";
import { CategorySelect } from "@/components/shop/category-select";
import { ProductCard } from "@/components/shop/product-card";
import { ShopSearch } from "@/components/shop/shop-search";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Shop Katalog" };

/**
 * Katalog untuk orang tua. Hanya produk terbit — filternya ada di dalam
 * `listShopProducts`, bukan di sini.
 *
 * Pencarian dan filter tinggal di URL lewat satu `<form method="get">`, jadi halamannya
 * tetap server component — pulau kliennya hanya tombol hati, pemilih kategori, dan
 * kotak cari bersaran — dan hasil filternya bisa di-bookmark.
 *
 * Satu form berisi cari DAN kategori: form GET terpisah untuk kotak cari akan membuang
 * `kategori` setiap kali disubmit. `favorit` ikut sebagai input tersembunyi, bukan
 * sebagai kendali di dalamnya — yang memindahkan tab adalah tautan hati di sebelahnya,
 * dan kedua filter berlaku di kedua tab.
 */
export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const user = await requireUser();
  const { kategori, q, favorit } = await searchParams;

  /*
    `kategori` membawa satu kategori (13 nilai), bukan kelompok. Tautan lama
    `?kategori=Ibu` jatuh ke null di sini dan tampil sebagai "Semua Kategori".
  */
  const category = isShopCategory(kategori) ? kategori : null;
  const term = typeof q === "string" ? q : undefined;
  const onlyFavorites = favorit === "1";

  /*
    Cari dan kategori berlaku di kedua tab, dengan term yang sama. Tab Favorit dulu
    mengabaikannya, tapi kendalinya tetap terlihat di baris atas — kotak yang bisa
    diketik lalu tidak melakukan apa pun terbaca sebagai aplikasi yang rusak.
  */
  const filters = { categories: category ? [category] : undefined, q: term };

  const [products, favoriteIds, suggestions] = await Promise.all([
    onlyFavorites ? listFavoriteProducts(user.id, filters) : listShopProducts(filters),
    listFavoriteIds(user.id),
    /*
      Saran pencarian: produk terbit beserta foto dan harganya, disempitkan kategori
      yang sedang aktif saja — BUKAN oleh `q`, karena yang menyaringnya menurut `q`
      adalah browser.
    */
    listShopSuggestions({ categories: category ? [category] : undefined }),
  ]);

  return (
    <div className="flex flex-col gap-4 pt-2">
      {/*
        Satu baris kendali, tanpa judul halaman dan tanpa pil "Semua Produk": judulnya
        sudah tertulis di header aplikasi dan di nav, dan pil "Semua" hanya menamai
        keadaan bawaan — yang menandai keadaan itu adalah ikon hati yang TIDAK menyala.

        `h1` tetap ada, tapi hanya untuk pembaca layar: halaman tanpa heading tingkat
        satu membuat daftar heading pembaca layar kehilangan judul halamannya.
      */}
      <h1 className="sr-only">Shop Katalog</h1>

      <div className="flex items-center gap-2">
        {/*
          Kotak cari ada di KEDUA tab. Dulu ia disembunyikan di tab Favorit, sehingga
          beralih ke Favorit membuat kotak cari dan filter kategori lenyap — padahal
          yang diubah hanya daftar mana yang disaring.

          Tanpa tombol "Cari": Enter di kolom pencarian sudah men-submit form GET di
          dalam `ShopSearch`, dan di HP tombol kirim papan ketiknya yang jadi tombolnya.
          Ruang yang dihematnya itulah yang membuat kolomnya lebih lebar.

          `CategorySelect` diteruskan sebagai anak, bukan dirender di dalam `ShopSearch`:
          keduanya harus berada di dalam `<form>` yang SAMA supaya `kategori` ikut
          tersubmit, dan jalan ini menjaga keduanya tetap dirender di server.
        */}
        <ShopSearch defaultValue={term ?? ""} suggestions={suggestions} favorit={onlyFavorites}>
          <CategorySelect value={category} />
        </ShopSearch>

        {/* Cari dan kategori ikut saat berganti tab: yang diubah tabnya, bukan filternya. */}
        <FavoriteTab active={onlyFavorites} q={term} category={category} className="shrink-0" />
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon="card_giftcard"
          title={emptyTitle({ onlyFavorites, term, category })}
          description={
            term || category
              ? "Coba kata lain atau pilih Semua Kategori."
              : onlyFavorites
                ? "Ketuk ikon hati di produk mana pun untuk menyimpannya di sini."
                : "Rekomendasi produk akan muncul di sini."
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {products.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} isFavorite={favoriteIds.has(p.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function emptyTitle({
  onlyFavorites,
  term,
  category,
}: {
  onlyFavorites: boolean;
  term?: string;
  category: string | null;
}) {
  // Filter diperiksa lebih dulu: di tab Favorit, kosong karena pencarian BUKAN sama
  // dengan belum punya favorit, dan "Belum ada produk favorit" di situ menyesatkan.
  const where = onlyFavorites ? "favorit" : "katalog";
  if (term) return `Tidak ada produk ${where} yang cocok dengan "${term}".`;
  if (category) return `Belum ada produk ${where} di kategori ini.`;
  if (onlyFavorites) return "Belum ada produk favorit.";
  return "Katalog masih kosong.";
}

/**
 * Tab Favorit sebagai ikon hati, ukuran tetap di kedua keadaan. Keadaannya ada di URL,
 * jadi tidak butuh state klien.
 *
 * Yang berubah saat menyala hanya hatinya — merah dan terisi. Sebelumnya ia melebar
 * dan menumbuhkan tulisan "Favorit", sehingga kotak cari di sebelahnya ikut menyusut
 * setiap kali tab ditekan; satu ketukan memindahkan dua kendali lain.
 *
 * Warna bukan penanda tunggalnya: sumbu FILL-nya ikut berubah (hati berongga → hati
 * padat), jadi bentuknya sendiri sudah membedakan — dan `aria-current` menyampaikannya
 * ke pembaca layar.
 */
function FavoriteTab({
  active,
  q,
  category,
  className,
}: {
  active: boolean;
  q?: string;
  category: string | null;
  className?: string;
}) {
  // Filter yang sedang berlaku dibawa menyeberang; `favorit` yang menentukan tabnya.
  const params = new URLSearchParams();
  if (!active) params.set("favorit", "1");
  if (q) params.set("q", q);
  if (category) params.set("kategori", category);
  const query = params.toString();

  return (
    <Link
      href={query ? `/shop?${query}` : "/shop"}
      aria-current={active ? "page" : undefined}
      aria-label={active ? "Tampilkan semua produk" : "Tampilkan produk favorit"}
      className={cn(
        "focus-visible:ring-ring grid size-10 place-items-center rounded-xl border shadow-sm outline-none transition-colors active:scale-[0.97] focus-visible:ring-2",
        active
          ? "bg-card border-[var(--color-status-alert-text)]/40 text-[var(--color-status-alert-text)]"
          : "bg-card border-border text-muted-foreground",
        className,
      )}
    >
      <Icon name="favorite" filled={active} className="text-[18px]" />
    </Link>
  );
}
