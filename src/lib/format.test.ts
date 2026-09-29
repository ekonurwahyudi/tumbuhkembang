import { describe, expect, it } from "vitest";
import { splitHead, splitLength, splitWeight } from "./format";

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
