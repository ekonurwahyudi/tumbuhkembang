import Link from "next/link";
import {
  ClaimProgress,
  DetailCue,
  PriorityBadge,
  StoreRow,
  formatPriceRange,
} from "@/components/registry/registry-shared";
import { SectionHeader } from "@/components/dashboard/section-header";
import { PRICE_TONE } from "@/components/shop/shop-price";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { ItemWithClaims } from "@/lib/data/registry";

/**
 * Daftar kado di beranda, grid dua kolom — bentuk yang sama dengan `ShopStrip` di
 * bawahnya, bukan digeser mendatar seperti `VaccineSlider`: dua section berisi kartu
 * produk yang bersebelahan tapi satu digeser dan satu digrid terbaca sebagai dua gaya.
 *
 * Kartunya satu bentuk dengan `ProductCard` di Shop Katalog: foto `aspect-square`
 * penuh lebar, judul di bawahnya, lalu harga, lalu kaki berisi lambang toko dan
 * "Lihat detail". Sebelumnya di sini fotonya thumbnail 72px di SAMPING teks, jadi
 * dua section yang bersebelahan di satu halaman terbaca sebagai dua gaya.
 *
 * Seluruh kartu satu tautan — lambang tokonya `<span>` (lihat `StoreRow`), bukan
 * `<a>`, jadi tidak ada tautan bersarang. Tombol toko yang sungguhan ada di halaman
 * detailnya.
 *
 * Tanpa pembungkus kartu di section: kartu barangnya sendiri sudah berlatar.
 *
 * Daftar kosong → `null`. Ubin "MyRegistry" di Akses Cepat tetap jadi jalan
 * masuknya, jadi tidak ada yang hilang.
 */
export function RegistryStrip({
  rows,
  summary,
}: {
  rows: ItemWithClaims[];
  summary: { listed: number; gifted: number };
}) {
  if (rows.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="list-kado">
      <SectionHeader
        id="list-kado"
        icon="card_giftcard"
        title="List Kado"
        href="/registry"
        action={
          <span className="bg-accent text-primary text-label-sm rounded-full px-2.5 py-1 font-bold">
            {summary.gifted}/{summary.listed} terpenuhi
          </span>
        }
      />

      {/* Grid yang sama dengan `ShopStrip` dan `/shop`: 2 / 3 / 5. Dua section kartu
          yang bersebelahan dengan jumlah kolom berbeda terbaca sebagai dua gaya —
          itu persis keluhan yang membuat section ini jadi grid sejak awal.
          `md:` tidak dipakai di repo ini — hanya sm/lg/xl. */}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {rows.map(({ item, claims, claimedQty }) => {
          const price = formatPriceRange(item.priceMinIdr, item.priceMaxIdr);
          const fulfilled = claimedQty >= item.desiredQty;

          return (
            <li key={item.id}>
              <Link
                href={`/registry/${item.id}`}
                className="bg-card hover:border-primary/40 flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-transform active:scale-[0.98]"
              >
                <div className="bg-accent text-primary relative aspect-square w-full overflow-hidden">
                  {item.photoKeys.length > 0 ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- route foto berotorisasi, bukan aset statis untuk next/image */
                    <img
                      src={`/registry/${item.id}/photo?i=0`}
                      alt={`Foto ${item.name}`}
                      className="size-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="grid size-full place-items-center">
                      <Icon name="card_giftcard" filled className="text-[32px]" />
                    </span>
                  )}

                  {/* Badge melayang di atas foto, bukan baris sendiri di bawahnya:
                      di kartu selebar setengah layar HP, satu baris badge memakan
                      ruang yang dibutuhkan nama barangnya. */}
                  <span className="absolute inset-x-2 top-2 flex">
                    {fulfilled ? (
                      <span className="bg-background/90 text-foreground inline-flex h-6 items-center gap-1 rounded-full px-2 text-[10px] leading-none font-bold backdrop-blur-sm">
                        <Icon name="check_circle" filled className="text-primary text-[12px]" />
                        Sudah Dihadiahi
                      </span>
                    ) : (
                      <PriorityBadge priority={item.priority} />
                    )}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-1 p-3">
                  <h3 className="text-body-sm line-clamp-2 font-bold">{item.name}</h3>
                  {/* `PRICE_TONE` diimpor dari ShopPrice, bukan disalin: dua section
                      kartu yang bersebelahan di beranda pernah berbeda justru karena
                      masing-masing menulis kelas hargannya sendiri.

                      Tetap kisaran: harga barang impian ditebak orang tua, bukan dibaca
                      dari halaman toko, jadi tidak ada "harga asli" yang bisa dicoret. */}
                  <p
                    className={cn(
                      "text-body-sm",
                      price ? PRICE_TONE : "text-muted-foreground tabular-nums",
                    )}
                  >
                    {price ?? "Harga menyusul"}
                  </p>

                  {/* Kemajuan pemenuhan, selalu ada — termasuk untuk barang satuan
                      yang belum diklaim: pertanyaannya "sudah terpenuhi atau belum",
                      dan bar yang hilang saat 0 membuat kartu bergeser-geser tinggi.
                      Varian `compact`-nya milik `ClaimProgress` yang sama dengan
                      halaman detail, jadi keduanya tidak bisa berbeda diam-diam. */}
                  <ClaimProgress claimed={claimedQty} desired={item.desiredQty} compact />

                  <div className="mt-auto flex items-center justify-between gap-1.5 pt-1">
                    <StoreRow
                      shopee={item.urlShopee}
                      tokopedia={item.urlTokopedia}
                      tiktok={item.urlTiktok}
                    />
                    <DetailCue className="ml-auto" />
                  </div>

                  {claims.length > 0 && (
                    <p className="text-muted-foreground text-label-sm">
                      {claims.length} orang sudah mengklaim
                    </p>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
