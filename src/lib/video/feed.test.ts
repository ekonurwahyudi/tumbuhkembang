import { describe, expect, it } from "vitest";
import { interleave } from "./feed";
import type { FetchedVideo } from "./youtube";

const v = (id: string): FetchedVideo => ({
  sourceId: id,
  title: `Video ${id}`,
  author: null,
  thumbnailUrl: null,
  publishedAt: null,
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
