import { ProductCard } from "@/components/shop/product-card";
import { SectionHeader } from "@/components/dashboard/section-header";
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
          harga coret plus badge diskon. `md:` tidak dipakai di repo ini. */}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {products.map((p) => (
          <li key={p.id}>
            <ProductCard product={p} compact isFavorite={favoriteIds.has(p.id)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
