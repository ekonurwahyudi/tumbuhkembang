import { discountPercent, formatIdr } from "@/schemas/shop";
import { cn } from "@/lib/utils";

/**
 * Nada harga: tebal, angka selebar sama, hijau.
 *
 * Diekspor supaya `RegistryStrip` memakai kelas yang SAMA, bukan salinannya — dua
 * section berisi kartu yang bersebelahan di beranda pernah berbeda justru karena
 * masing-masing menulis kelasnya sendiri.
 *
 * Hijaunya `status-normal-text` (#047857), bukan `status-normal` (#10b981) yang lebih
 * lembut: yang lembut hanya 2,5:1 di atas latar kartu dan gagal AA untuk teks sekecil
 * ini — globals.css:49-55 sudah mencatat pasangan `*-text` sebagai yang untuk teks dan
 * yang mentah untuk isian. Nuansa lembutnya tetap terpakai, sebagai latar badge diskon.
 */
export const PRICE_TONE = "font-bold tabular-nums text-[var(--color-status-normal-text)]";

/**
 * Harga katalog: harga jual, harga asli dicoret, dan persen diskonnya.
 *
 * Satu komponen untuk kartu, halaman detail, dan tabel admin — kalau tiga tempat
 * menyusunnya masing-masing, diskon yang sama akan terlihat berbeda di tiga halaman.
 *
 * Di kartu, harga jual seukuran judul produk (`text-body-sm`) — yang membedakannya
 * warna, bukan ukuran.
 */
export function ShopPrice({
  price,
  original,
  size = "card",
  className,
}: {
  price: number | null;
  original: number | null;
  size?: "card" | "detail";
  className?: string;
}) {
  // Harga asli sendiri tanpa harga jual bukan diskon, jadi ia yang jadi harganya.
  const sell = price ?? original;
  const strike = price === null ? null : original;
  const off = discountPercent(price, original);

  if (sell === null)
    return <p className={cn("text-muted-foreground text-body-sm", className)}>Harga menyusul</p>;

  const detail = size === "detail";

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cn(PRICE_TONE, detail ? "text-metric" : "text-body-sm")}>
        {formatIdr(sell)}
      </span>

      {strike !== null && strike > sell && (
        <span
          className={cn(
            "text-muted-foreground tabular-nums line-through",
            detail ? "text-body-md" : "text-label-sm",
          )}
        >
          {formatIdr(strike)}
        </span>
      )}

      {off !== null && (
        <span className="text-label-sm inline-flex items-center rounded-full bg-[var(--color-status-normal)]/15 px-1.5 py-0.5 font-bold tabular-nums text-[var(--color-status-normal-text)]">
          -{off}%
        </span>
      )}
    </div>
  );
}
