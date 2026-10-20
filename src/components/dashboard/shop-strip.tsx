import Link from "next/link";
import { ProductCard } from "@/components/shop/product-card";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { ShopProduct } from "@/db/schema";

/**
 * Strip katalog di beranda, di bawah jadwal vaksinasi. Produknya diteruskan dari
 * halaman — satu `Promise.all` di sana lebih baik daripada query kedua di sini.
 *
 * Katalog kosong (atau semuanya masih draf) → `null`: section kosong di beranda lebih
 * buruk daripada tidak ada section.
 *
 * ponytail: lima produk terbaru, tanpa personalisasi. Pencocokan usia anak ditolak
 * user secara eksplisit ("kategori saja"); bila nanti dibutuhkan, kategori + usia anak
 * sudah cukup untuk memetakannya tanpa migrasi.
 */
export function ShopStrip({
  products,
  favoriteIds,
}: {
  products: ShopProduct[];
  favoriteIds: Set<string>;
}) {
  if (products.length === 0) return null;

  return (
    // Tanpa pembungkus kartu: kartu produknya sendiri sudah berlatar, dan kartu di
    // dalam kartu membuat dua garis tepi bersarang. Judulnya langsung di atas latar.
    <section className="space-y-3" aria-labelledby="shop-katalog">
      <SectionHeader
        id="shop-katalog"
        icon="card_giftcard"
        title="Shop Katalog"
        subtitle="Kebutuhan ibu, bayi, dan anak"
        href="/shop"
      />

      {/* 2 kolom di HP, 3 di tablet, 5 di desktop — sama persis dengan grid `/shop`,
          jadi kartunya selebar di beranda dan di katalognya. Enam kolom membuat kartu
          selebar 180px di layar 1280, terlalu sempit untuk nama produk dua baris plus
          harga coret plus badge diskon. `md:` tidak dipakai di repo ini.

          Kartu ke-5 disembunyikan di HP (`hidden sm:block`): grid dua kolom
          menyisakan satu kartu sendirian di baris ketiga kalau kelimanya tampak. */}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p, i) => (
          <li key={p.id} className={cn(i >= 4 && "hidden sm:block")}>
            <ProductCard product={p} compact isFavorite={favoriteIds.has(p.id)} />
          </li>
        ))}
      </ul>

      <Button asChild variant="outline" className="w-full rounded-full sm:hidden">
        <Link href="/shop">
          Lihat Shop Katalog
          <Icon name="arrow_forward" className="text-[16px]" />
        </Link>
      </Button>
    </section>
  );
}
