import { describe, expect, it } from "vitest";
import { interleave, shuffle } from "./feed";
import type { FetchedVideo } from "./youtube";

const v = (id: string): FetchedVideo => ({
  sourceId: id,
  title: `Video ${id}`,
  author: null,
  thumbnailUrl: null,
  publishedAt: null,
  viewCount: 0,
});

describe("interleave", () => {
  it("menyelang antar-kelompok, bukan menyambung berurutan", () => {
    const out = interleave([[v("a1"), v("a2")], [v("b1"), v("b2")], [v("c1")]]);
    expect(out.map((x) => x.sourceId)).toEqual(["a1", "b1", "c1", "a2", "b2"]);
  });

  it("membuang video yang sama walau muncul di beberapa kata kunci", () => {
    const out = interleave([[v("sama"), v("a2")], [v("sama"), v("b2")]]);
    expect(out.map((x) => x.sourceId)).toEqual(["sama", "a2", "b2"]);
  });

  it("tahan terhadap kelompok kosong dan panjang tak sama", () => {
    expect(interleave([]).length).toBe(0);
    expect(interleave([[], []]).length).toBe(0);
    expect(interleave([[v("a")], []]).map((x) => x.sourceId)).toEqual(["a"]);
  });
});

describe("shuffle", () => {
  const ids = Array.from({ length: 20 }, (_, i) => `v${i}`);

  it("tidak menghilangkan, menggandakan, atau mengubah isinya", () => {
    // Yang paling berbahaya dari pengacakan buatan sendiri: satu item hilang diam-diam
    // karena salah indeks. Himpunannya harus persis sama, hanya urutannya berbeda.
    const out = shuffle(ids);
    expect(out).toHaveLength(ids.length);
    expect([...out].sort()).toEqual([...ids].sort());
  });

  it("tidak mengubah argumennya", () => {
    const asli = [...ids];
    shuffle(ids);
    expect(ids).toEqual(asli);
  });

  it("benar-benar mengacak, bukan mengembalikan urutan yang sama", () => {
    // Satu panggilan bisa saja kebetulan menghasilkan urutan asli (1/20! — praktis
    // mustahil, tapi bukan nol), jadi diuji beberapa kali dan cukup satu yang beda.
    const berbeda = Array.from({ length: 5 }, () => shuffle(ids)).some(
      (out) => out.join() !== ids.join(),
    );
    expect(berbeda).toBe(true);
  });

  it("aman untuk daftar kosong dan satu item", () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle(["satu"])).toEqual(["satu"]);
  });
});
