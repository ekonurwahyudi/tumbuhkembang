import { describe, expect, it } from "vitest";
import { fitWithin } from "./compress-image";

describe("fitWithin", () => {
  it("tidak memperbesar gambar yang sudah lebih kecil dari batas", () => {
    expect(fitWithin(200, 120, 512)).toEqual({ width: 200, height: 120 });
  });

  it("menskalakan sisi terpanjang tepat ke batas, rasio terjaga", () => {
    expect(fitWithin(2048, 1024, 512)).toEqual({ width: 512, height: 256 });
    expect(fitWithin(1024, 2048, 512)).toEqual({ width: 256, height: 512 });
  });

  it("membiarkan gambar yang pas di batas apa adanya", () => {
    expect(fitWithin(512, 512, 512)).toEqual({ width: 512, height: 512 });
  });

  it("tidak pernah menghasilkan sisi 0 pada gambar sangat panjang", () => {
    // 8000x3 -> rasio 0,064; tinggi membulat jadi 0 tanpa penjagaan.
    const r = fitWithin(8000, 3, 512);
    expect(r.width).toBe(512);
    expect(r.height).toBeGreaterThanOrEqual(1);
  });
});
