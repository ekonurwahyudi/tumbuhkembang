import type { Metadata } from "next";
import Link from "next/link";
import { adminListShopProducts } from "@/lib/data/shop";
import { SHOP_CATEGORY_LABEL } from "@/schemas/shop";
import { AdminDeleteButton } from "@/components/admin/admin-delete-button";
import { AdminSearch } from "@/components/admin/admin-search";
import { AdminShopPublishButton } from "@/components/admin/admin-shop-publish-button";
import { StoreMark } from "@/components/registry/registry-shared";
import { ShopPrice } from "@/components/shop/shop-price";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Katalog Shop" };

/** Query DB di tingkat atas, dan build Docker tidak punya DB. */
export const dynamic = "force-dynamic";

/**
 * Daftar katalog Shop. Rute statis ini menang atas `[section]` yang dinamis, jadi
 * placeholder "belum tersedia" tidak pernah tercapai lagi untuk slug `shop`.
 *
 * Draf ikut ditampilkan — itu seluruh gunanya halaman ini: menyiapkan produk sebelum
 * orang tua melihatnya.
 */
export default async function AdminShopPage({ searchParams }: PageProps<"/admin/shop">) {
  const { q } = await searchParams;
  const term = typeof q === "string" ? q : undefined;
  const rows = await adminListShopProducts(term);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-1.5">
          <Icon name="card_giftcard" className="text-primary text-[16px]" />
          <span className="text-muted-foreground text-label-sm font-bold tracking-wider uppercase">
            KATALOG SHOP ({rows.length})
          </span>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/shop/new">
            <Icon name="add" className="text-[16px]" />
            Tambah Produk
          </Link>
        </Button>
      </div>

      <AdminSearch q={term} placeholder="Cari nama produk" />

      {rows.length === 0 ? (
        <div className="bg-card rounded-2xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-body-sm">
            {term
              ? `Tidak ada produk yang cocok dengan "${term}".`
              : "Belum ada produk di katalog. Tempel satu tautan Shopee atau Tokopedia untuk mulai."}
          </p>
        </div>
      ) : (
        <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
          <Table className="text-body-sm">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-10 text-right">No.</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Toko</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p, i) => (
                <TableRow key={p.id}>
                  <TableCell className="text-muted-foreground text-right tabular-nums">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-bold">
                    <div className="flex items-center gap-2.5">
                      <span className="bg-accent text-primary grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg">
                        {p.photoKeys.length > 0 ? (
                          /* eslint-disable-next-line @next/next/no-img-element -- route foto berotorisasi, bukan aset statis untuk next/image */
                          <img
                            src={`/shop/${p.id}/photo?i=0`}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <Icon name="card_giftcard" filled className="text-[18px]" />
                        )}
                      </span>
                      <span className="block max-w-[14rem] truncate">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {SHOP_CATEGORY_LABEL[p.category]}
                  </TableCell>
                  <TableCell>
                    <ShopPrice price={p.priceIdr} original={p.priceOriginalIdr} />
                  </TableCell>
                  <TableCell>
                    {/* Lambang saja, tapi judul kolomnya tertulis dan setiap lambang
                        punya title — warna bukan satu-satunya penanda. */}
                    <div className="text-muted-foreground flex items-center gap-1.5">
                      {(
                        [
                          ["shopee", p.urlShopee],
                          ["tokopedia", p.urlTokopedia],
                          ["tiktok", p.urlTiktok],
                        ] as const
                      )
                        .filter(([, url]) => url)
                        .map(([brand]) => (
                          <span key={brand} title={brand}>
                            <StoreMark brand={brand} />
                          </span>
                        ))}
                      {!p.urlShopee && !p.urlTokopedia && !p.urlTiktok && "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        p.isPublished
                          ? "bg-primary text-primary-foreground text-label-sm rounded-full px-2 py-0.5 font-bold"
                          : "bg-muted text-muted-foreground text-label-sm rounded-full px-2 py-0.5 font-bold"
                      }
                    >
                      {p.isPublished ? "TERBIT" : "DRAF"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <AdminShopPublishButton id={p.id} name={p.name} isPublished={p.isPublished} />
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/shop/${p.id}/edit`} aria-label={`Ubah ${p.name}`}>
                          <Icon name="edit" className="text-[16px]" />
                        </Link>
                      </Button>
                      <AdminDeleteButton kind="shopProduct" id={p.id} name={p.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
