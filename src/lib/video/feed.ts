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

/**
 * Mengacak urutan (Fisher–Yates), salinan baru — argumennya tidak diubah.
 *
 * Dipakai supaya umpan terasa berbeda tiap kali dibuka. Itu perlu karena hasil
 * penarikan di-cache enam jam: tanpa pengacakan, orang yang membuka halaman ini dua
 * kali dalam satu pagi melihat video pertama yang persis sama dan umpannya terasa
 * mati.
 *
 * Pengacakannya di sini, BUKAN di dalam cache: yang disimpan tetap satu hasil utuh,
 * dan tiap render menyusun ulang urutannya sendiri — jadi tidak ada panggilan API
 * tambahan hanya demi variasi.
 *
 * `Math.random` memang bukan acak kriptografis, dan di sini memang tidak perlu:
 * tidak ada yang dirahasiakan dari urutan video edukasi.
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
