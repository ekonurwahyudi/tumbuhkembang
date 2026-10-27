import type { FetchedVideo } from "./youtube";

/**
 * Menggabung hasil beberapa kata kunci jadi satu umpan.
 *
 * Bergantian antar-sumber (round-robin), bukan disambung berurutan: kalau
 * disambung, dua belas video pertama semuanya MPASI dan orang harus menggeser jauh
 * sebelum bertemu topik lain — padahal justru keberagaman itu yang membuat umpan
 * tanpa kategori terasa masuk akal.
 *
 * Duplikat dibuang berdasarkan `sourceId`: satu video bisa muncul di hasil beberapa
 * kata kunci sekaligus, dan video yang sama dua kali dalam satu geseran terbaca
 * seperti umpannya macet.
 */
export function interleave(groups: FetchedVideo[][]): FetchedVideo[] {
  const out: FetchedVideo[] = [];
  const seen = new Set<string>();
  const longest = Math.max(0, ...groups.map((g) => g.length));

  for (let i = 0; i < longest; i++) {
    for (const g of groups) {
      const v = g[i];
      if (!v || seen.has(v.sourceId)) continue;
      seen.add(v.sourceId);
      out.push(v);
    }
  }

  return out;
}
