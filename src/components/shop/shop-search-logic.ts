import type { ShopSuggestion } from "@/lib/data/shop";

/** Delapan sudah melebihi tinggi layar HP; sisanya ditemukan dengan mengetik lebih panjang. */
const MAX_SUGGESTIONS = 8;

/**
 * Saran yang cocok dengan yang sedang diketik. Substring, bukan awalan: "beras" harus
 * menemukan "Teh Beras Merah" juga — itu justru yang tidak dijamin `<datalist>`, yang
 * pencocokannya berbeda-beda antar peramban.
 *
 * Kosong saat belum ada yang diketik: daftar penuh yang terbuka begitu kotaknya difokus
 * menutupi katalog di belakangnya tanpa diminta.
 */
export function matchSuggestions(all: ShopSuggestion[], term: string): ShopSuggestion[] {
  const needle = term.trim().toLowerCase();
  if (!needle) return [];
  return all.filter((s) => s.name.toLowerCase().includes(needle)).slice(0, MAX_SUGGESTIONS);
}

/**
 * Sorotan berikutnya untuk panah atas/bawah.
 *
 * Rentangnya -1 … n-1, dan -1 BUKAN sekadar "belum memilih": ia posisi yang berarti
 * "cari kata ini", tempat Enter men-submit form alih-alih membuka saran teratas.
 * Putarannya melewati posisi itu, jadi menekan panah terus-menerus selalu bisa kembali
 * ke pencarian biasa tanpa harus menghapus ketikan.
 */
export function nextActive(current: number, step: 1 | -1, count: number): number {
  // Digeser +1 supaya modulonya tidak pernah bertemu angka negatif, lalu dikembalikan.
  const n = count + 1;
  return ((current + 1 + step + n) % n) - 1;
}
