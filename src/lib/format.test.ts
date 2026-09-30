import { describe, expect, it } from "vitest";
import { formatRelative, splitHead, splitLength, splitWeight } from "./format";

describe("formatRelative", () => {
  const now = new Date("2026-09-30T12:00:00Z");
  const ago = (ms: number) => formatRelative(new Date(now.getTime() - ms), now);

  it("memilih unit terbesar yang masih menghasilkan angka utuh", () => {
    expect(ago(30_000)).toBe("baru saja");
    expect(ago(5 * 60_000)).toContain("menit");
    expect(ago(3 * 3600_000)).toContain("jam");
    // numeric: "auto" menulis "kemarin"/"kemarin dulu" alih-alih "1 hari lalu".
    expect(ago(86_400_000)).toBe("kemarin");
    expect(ago(5 * 86_400_000)).toContain("hari");
    expect(ago(400 * 86_400_000)).toContain("tahun");
  });

  it("tidak melewatkan batas 1 menit maupun 1 jam", () => {
    // 59 detik masih "baru saja"; 61 detik sudah pindah unit.
    expect(ago(59_000)).toBe("baru saja");
    expect(ago(61_000)).not.toBe("baru saja");
    expect(ago(59 * 60_000)).toContain("menit");
    expect(ago(61 * 60_000)).toContain("jam");
  });
});

describe("splitMeasure", () => {
  it("memisahkan angka dan satuan dengan jumlah desimal per jenis ukuran", () => {
    expect(splitWeight("3.2")).toEqual({ value: "3,20", unit: "kg" });
    expect(splitLength("49.5")).toEqual({ value: "49,5", unit: "cm" });
    expect(splitHead("34.54")).toEqual({ value: "34,5", unit: "cm" });
  });

  it("tidak menampilkan satuan ketika nilainya tidak ada atau bukan angka", () => {
    expect(splitWeight(null)).toEqual({ value: "—", unit: null });
    expect(splitWeight("bukan angka")).toEqual({ value: "—", unit: null });
  });
});
