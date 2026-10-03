import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getShopProduct, listShopProducts } from "@/lib/data/shop";
import { listFavoriteIds } from "@/lib/data/shop-favorites";
import { SHOP_CATEGORY_LABEL } from "@/schemas/shop";
import { ProductCard } from "@/components/shop/product-card";
import { ShopPrice } from "@/components/shop/shop-price";
import { BuyBox, ItemGallery } from "@/components/registry/registry-shared";
import { Icon } from "@/components/ui/icon";

export async function generateMetadata({
  params,
}: PageProps<"/shop/[productId]">): Promise<Metadata> {
  const { productId } = await params;
  const product = await getShopProduct(productId);
  return { title: product ? product.name : "Shop Katalog" };
}

/**
 * Detail produk katalog.
 *
 * `notFound()` di sini pantas — rutenya di balik sesi dan tidak ada tautan yang dikirim
 * ke orang luar, beda dari halaman kado publik yang diberi halaman ramah. Produk draf
 * ikut jatuh ke sini: `getShopProduct` menyaring `is_published` di dalam query-nya.
 */
export default async function ShopProductPage({ params }: PageProps<"/shop/[productId]">) {
  const { productId } = await params;
  const user = await requireUser();

  const product = await getShopProduct(productId);
  if (!product) notFound();

  // Produk lain dari kategori yang sama. Satu query, lalu dirinya sendiri dibuang.
  const [others, favoriteIds] = await Promise.all([
    listShopProducts({ categories: [product.category], limit: 7 }).then((rows) =>
      rows.filter((p) => p.id !== product.id).slice(0, 6),
    ),
    listFavoriteIds(user.id),
  ]);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Link
        href="/shop"
        className="text-muted-foreground hover:text-foreground text-body-sm inline-flex w-fit items-center gap-1"
      >
        <Icon name="arrow_back" className="text-[16px]" />
        Shop Katalog
      </Link>

      {/* Dua kolom di layar lebar: foto di kiri, tombol tokonya di kanan tanpa digulir. */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        <div className="lg:sticky lg:top-6">
          <ItemGallery
            count={product.photoKeys.length}
            src={(i) => `/shop/${product.id}/photo?i=${i}`}
            name={product.name}
          />
        </div>

        <div className="space-y-4">
          <header className="space-y-2.5">
            <span className="bg-muted text-muted-foreground inline-flex h-6 items-center rounded-full px-2 text-[10px] leading-none font-bold">
              {SHOP_CATEGORY_LABEL[product.category]}
            </span>
            <h1 className="text-headline-lg">{product.name}</h1>
            <ShopPrice price={product.priceIdr} original={product.priceOriginalIdr} size="detail" />
            <p className="text-muted-foreground text-label-sm">
              Estimasi harga. Harga sebenarnya mengikuti tokonya saat dibuka.
            </p>
          </header>

          <BuyBox
            shopee={product.urlShopee}
            tokopedia={product.urlTokopedia}
            tiktok={product.urlTiktok}
          />
        </div>
      </div>

      {/*
        Deskripsi di bawah, selebar halaman — bukan di kolom kanan sebelah foto.
        Teks panjang di kolom selebar setengah layar jadi tiang sempit yang
        memanjangkan halaman; yang di sebelah foto cukup harga dan tombol belinya.
      */}
      {product.description && (
        <section className="space-y-2.5 pt-1" aria-labelledby="deskripsi-produk">
          <h2 id="deskripsi-produk" className="text-headline-sm">
            Deskripsi Produk
          </h2>
          <div className="bg-card rounded-2xl border p-4 shadow-sm sm:p-5">
            {/* `whitespace-pre-line`: tidyText menyisakan satu baris kosong sebagai pemisah paragraf. */}
            <p className="text-body-md whitespace-pre-line">{product.description}</p>
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section aria-label="Produk lain di kategori ini" className="space-y-3 pt-2">
          <div className="flex items-end justify-between gap-2">
            <h2 className="text-headline-sm">Produk Lain</h2>
            <Link
              href={`/shop?kategori=${encodeURIComponent(product.category)}`}
              className="text-primary text-body-sm inline-flex shrink-0 items-center gap-1 font-bold"
            >
              Lihat semua
              <Icon name="arrow_forward" className="text-[16px]" />
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {others.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} isFavorite={favoriteIds.has(p.id)} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
