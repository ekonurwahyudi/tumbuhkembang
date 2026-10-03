import Link from "next/link";
import { SHOP_CATEGORY_LABEL } from "@/schemas/shop";
import { DetailCue, StoreRow } from "@/components/registry/registry-shared";
import { FavoriteButton } from "@/components/shop/favorite-button";
import { ShopPrice } from "@/components/shop/shop-price";
import { Icon } from "@/components/ui/icon";
import type { ShopProduct } from "@/db/schema";

/**
 * Kartu produk katalog. Server component — statenya hanya ada di tombol favoritnya.
 *
 * Markup sendiri, bukan `ItemPhoto`: komponen itu menuntut `priority` dan `category`
 * bertipe registry, dan produk katalog tidak punya prioritas. Menambah prop opsional
 * ke komponen yang sudah dipakai lima tempat lebih mahal daripada enam baris di sini.
 *
 * `aspect-square`, bukan `aspect-[4/3]` seperti registry: pada grid 2 kolom di HP,
 * 4/3 membuat kartunya pendek sampai nama produk yang dua baris terlihat lebih besar
 * daripada fotonya.
 *
 * Susunannya — foto penuh, lalu judul, lalu harga, lalu kaki berisi lambang toko dan
 * "Lihat detail" — adalah susunan yang sama dengan kartu `RegistryStrip`. Judul dan
 * harga seukuran (`text-body-sm`): yang membedakan harganya warna, bukan ukuran.
 */
export function ProductCard({
  product: p,
  compact = false,
  isFavorite,
}: {
  product: ShopProduct;
  /** Strip beranda: tanpa baris kategori, ruangnya sempit. */
  compact?: boolean;
  /**
   * Tanpa prop ini tombol hatinya tidak dirender — dipakai di tempat yang tidak
   * punya sesi atau tidak mengambil daftar favoritnya.
   */
  isFavorite?: boolean;
}) {
  return (
    /* `relative`: tombol hati melayang di atas foto sebagai saudara tautannya. */
    <div className="relative h-full">
      <Link
        href={`/shop/${p.id}`}
        className="bg-card hover:border-primary/40 flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-transform active:scale-[0.98]"
      >
        <div className="bg-accent text-primary relative aspect-square w-full overflow-hidden">
          {p.photoKeys.length > 0 ? (
            /* eslint-disable-next-line @next/next/no-img-element -- route foto berotorisasi, bukan aset statis untuk next/image */
            <img
              src={`/shop/${p.id}/photo?i=0`}
              alt={`Foto ${p.name}`}
              className="size-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="grid size-full place-items-center">
              <Icon name="card_giftcard" filled className="text-[32px]" />
            </span>
          )}
        </div>

        {/* `flex-1` + `mt-auto` di kaki: harga dan "Lihat detail" rata bawah walau nama
            produknya satu baris di satu kartu dan dua baris di sebelahnya. */}
        <div className="flex flex-1 flex-col gap-1 p-3">
          {!compact && (
            <p className="text-muted-foreground text-label-sm truncate font-bold uppercase">
              {SHOP_CATEGORY_LABEL[p.category]}
            </p>
          )}
          <h3 className="text-body-sm line-clamp-2 font-bold">{p.name}</h3>
          <ShopPrice price={p.priceIdr} original={p.priceOriginalIdr} />

          <div className="mt-auto flex items-center justify-between gap-1.5 pt-1">
            <StoreRow shopee={p.urlShopee} tokopedia={p.urlTokopedia} tiktok={p.urlTiktok} />
            <DetailCue className="ml-auto" />
          </div>
        </div>
      </Link>

      {/* Di luar Link, bukan di dalamnya: tombol di dalam tautan itu HTML tak sah. */}
      {isFavorite !== undefined && (
        <FavoriteButton
          productId={p.id}
          name={p.name}
          isFavorite={isFavorite}
          className="absolute top-1.5 right-1.5 z-10"
        />
      )}
    </div>
  );
}
