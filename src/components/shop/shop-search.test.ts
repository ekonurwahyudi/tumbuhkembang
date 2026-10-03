import { describe, expect, it } from "vitest";
import { matchSuggestions, nextActive } from "./shop-search-logic";

/**
 * Dua potong logika yang bisa salah tanpa terlihat salah: pencocokan nama dan putaran
 * sorotan papan ketik. Sisanya di `shop-search.tsx` adalah markup dan event.
 */
const SUGGESTIONS = [
  { id: "1", name: "Beras Merah Tabanan Luwih (1 Kg)" },
  { id: "2", name: "Teh Beras Merah Talu (250 gram)" },
  { id: "3", name: "Bantal Menyusui" },
].map((s) => ({ ...s, priceIdr: null, priceOriginalIdr: null, hasPhoto: false }));

describe("matchSuggestions", () => {
  it("mencocokkan di tengah nama, bukan hanya awalannya", () => {
    const hit = matchSuggestions(SUGGESTIONS, "beras").map((s) => s.id);
    // "Teh Beras Merah" ikut: itu yang membedakannya dari <datalist> sebagian peramban.
    expect(hit).toEqual(["1", "2"]);
  });

  it("mengabaikan beda huruf besar-kecil dan spasi pinggir", () => {
    expect(matchSuggestions(SUGGESTIONS, "  BANTAL ").map((s) => s.id)).toEqual(["3"]);
  });

  it("kosong saat tidak ada yang diketik — bukan seluruh katalog", () => {
    expect(matchSuggestions(SUGGESTIONS, "")).toEqual([]);
    expect(matchSuggestions(SUGGESTIONS, "   ")).toEqual([]);
  });

  it("dibatasi delapan baris", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ ...SUGGESTIONS[0], id: `x${i}` }));
    expect(matchSuggestions(many, "beras")).toHaveLength(8);
  });
});

describe("nextActive", () => {
  // -1 berarti "tidak ada saran tersorot", tempat Enter men-submit pencarian biasa.
  it("turun dari tanpa sorotan ke baris pertama", () => {
    expect(nextActive(-1, 1, 3)).toBe(0);
  });

  it("berputar lewat posisi tanpa sorotan, bukan langsung ke ujung lain", () => {
    expect(nextActive(2, 1, 3)).toBe(-1);
    expect(nextActive(-1, 1, 3)).toBe(0);
  });

  it("naik dari tanpa sorotan ke baris terakhir", () => {
    expect(nextActive(-1, -1, 3)).toBe(2);
    expect(nextActive(0, -1, 3)).toBe(-1);
  });

  it("tidak pernah keluar rentang untuk daftar sependek apa pun", () => {
    for (const n of [1, 2, 5]) {
      let i = -1;
      for (let step = 0; step < n * 3; step++) {
        i = nextActive(i, 1, n);
        expect(i).toBeGreaterThanOrEqual(-1);
        expect(i).toBeLessThan(n);
      }
    }
  });
});
