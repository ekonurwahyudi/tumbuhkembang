import type { RegistryItem, RegistryPriority } from "@/db/schema";

/** Pengurutan daftar barang. Dipakai daftar privat dan halaman publik. */

export const SORT_LABEL = {
  priority: "Prioritas",
  newest: "Terbaru",
  price: "Harga",
} as const;

export type SortKey = keyof typeof SORT_LABEL;

const PRIORITY_RANK: Record<RegistryPriority, number> = { HIGH: 0, NORMAL: 1, EXTRA: 2 };

/** Barang tanpa harga diletakkan di akhir, bukan dianggap Rp 0. */
const priceOf = (i: RegistryItem) => i.priceMinIdr ?? i.priceMaxIdr ?? Number.POSITIVE_INFINITY;

/**
 * `toSorted` — baris datang dari props, jadi tidak boleh diurut di tempat.
 * Constraint-nya hanya `item`: sisi publik membawa bentuk klaim yang lebih sempit.
 */
export function sortRows<T extends { item: RegistryItem }>(rows: T[], key: SortKey): T[] {
  switch (key) {
    case "priority":
      return rows.toSorted(
        (a, b) => PRIORITY_RANK[a.item.priority] - PRIORITY_RANK[b.item.priority],
      );
    case "price":
      return rows.toSorted((a, b) => priceOf(a.item) - priceOf(b.item));
    case "newest":
      // Server sudah mengirim terbaru di atas; urutan ini yang jadi acuannya.
      return rows;
  }
}
