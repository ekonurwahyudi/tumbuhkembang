import { describe, expect, it } from "vitest";
import { groupByDay, summarizeDay } from "./summary";
import { combineDateTime, feedingSchema } from "@/schemas/feeding";
import type { FeedingLog } from "@/db/schema";

const log = (
  type: FeedingLog["feedingType"],
  amountMl: string | null,
  fedAt: string,
): FeedingLog => ({
  id: `${type}-${fedAt}-${amountMl}`,
  childId: "child",
  feedingType: type,
  amountMl,
  fedAt: new Date(fedAt),
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

/** Contoh dari spesifikasi: 3 sesi ASI langsung, 180 ml perah, 200 ml sufor. */
const HARI_INI = [
  log("BREAST_DIRECT", null, "2026-09-23T06:30:00"),
  log("EXPRESSED_BREAST_MILK", "90.0", "2026-09-23T09:00:00"),
  log("BREAST_DIRECT", null, "2026-09-23T11:30:00"),
  log("FORMULA", "100.0", "2026-09-23T14:00:00"),
  log("EXPRESSED_BREAST_MILK", "90.0", "2026-09-23T17:00:00"),
  log("FORMULA", "100.0", "2026-09-23T20:00:00"),
  log("BREAST_DIRECT", null, "2026-09-23T22:00:00"),
];

describe("summarizeDay", () => {
  it("menghitung sesi dan volume sesuai contoh spesifikasi", () => {
    const s = summarizeDay(HARI_INI, "2026-09-23");
    expect(s.breastDirectSessions).toBe(3);
    expect(s.expressedMl).toBe(180);
    expect(s.formulaMl).toBe(200);
    expect(s.totalMeasuredMl).toBe(380);
    expect(s.totalSessions).toBe(7);
  });

  it("TIDAK memasukkan sesi ASI langsung tanpa volume ke total ml", () => {
    const s = summarizeDay(HARI_INI, "2026-09-23");
    // 3 sesi ASI langsung tidak menambah satu ml pun.
    expect(s.totalMeasuredMl).toBe(180 + 200);
    expect(s.breastDirectMl).toBeNull();
    expect(s.hasUnmeasuredSessions).toBe(true);
  });

  it("memasukkan ASI langsung bila volumenya memang diketahui", () => {
    const s = summarizeDay(
      [
        log("BREAST_DIRECT", "60.0", "2026-09-23T06:30:00"),
        log("BREAST_DIRECT", null, "2026-09-23T09:00:00"),
        log("FORMULA", "100.0", "2026-09-23T12:00:00"),
      ],
      "2026-09-23",
    );
    expect(s.breastDirectSessions).toBe(2);
    expect(s.breastDirectMl).toBe(60);
    expect(s.totalMeasuredMl).toBe(160);
    expect(s.hasUnmeasuredSessions).toBe(true);
  });

  it("membedakan nol dari tidak ada nilai terukur", () => {
    const s = summarizeDay([log("BREAST_DIRECT", null, "2026-09-23T06:30:00")], "2026-09-23");
    // Bukan 0 ml — memang tidak ada volume yang diketahui.
    expect(s.totalMeasuredMl).toBeNull();
    expect(s.expressedMl).toBeNull();
    expect(s.formulaMl).toBeNull();
    expect(s.hasUnmeasuredSessions).toBe(true);
  });

  it("hari tanpa sesi tanpa-volume ditandai lengkap", () => {
    const s = summarizeDay(
      [
        log("FORMULA", "100.0", "2026-09-23T08:00:00"),
        log("EXPRESSED_BREAST_MILK", "80.0", "2026-09-23T12:00:00"),
      ],
      "2026-09-23",
    );
    expect(s.hasUnmeasuredSessions).toBe(false);
    expect(s.totalMeasuredMl).toBe(180);
  });

  it("hari kosong menghasilkan ringkasan nol tanpa nilai palsu", () => {
    const s = summarizeDay([], "2026-09-23");
    expect(s.totalSessions).toBe(0);
    expect(s.totalMeasuredMl).toBeNull();
    expect(s.hasUnmeasuredSessions).toBe(false);
  });
});

describe("groupByDay", () => {
  it("mengelompokkan per tanggal lokal, terbaru lebih dulu", () => {
    const days = groupByDay([
      log("FORMULA", "100.0", "2026-09-21T08:00:00"),
      log("FORMULA", "100.0", "2026-09-23T08:00:00"),
      log("FORMULA", "100.0", "2026-09-22T08:00:00"),
    ]);
    expect(days.map((d) => d.date)).toEqual(["2026-09-23", "2026-09-22", "2026-09-21"]);
  });

  it("mengurutkan sesi dalam satu hari dari yang terbaru", () => {
    const days = groupByDay([
      log("FORMULA", "100.0", "2026-09-23T08:00:00"),
      log("FORMULA", "100.0", "2026-09-23T20:00:00"),
      log("FORMULA", "100.0", "2026-09-23T14:00:00"),
    ]);
    expect(days[0].logs.map((l) => l.fedAt.getHours())).toEqual([20, 14, 8]);
  });

  it("memakai tanggal lokal, bukan UTC", () => {
    // 23:30 waktu lokal tetap masuk tanggal itu, meski di UTC sudah hari berikutnya.
    const days = groupByDay([log("FORMULA", "100.0", "2026-09-23T23:30:00")]);
    expect(days[0].date).toBe("2026-09-23");
  });
});

describe("feedingSchema", () => {
  const valid = {
    feedingType: "FORMULA" as const,
    fedDate: "2026-09-23",
    fedTime: "14:00",
    amountMl: "100",
  };

  it("menerima ASI langsung tanpa volume", () => {
    const r = feedingSchema.safeParse({
      feedingType: "BREAST_DIRECT",
      fedDate: "2026-09-23",
      fedTime: "06:30",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.amountMl).toBeNull();
  });

  it("mewajibkan volume untuk ASI perah dan susu formula", () => {
    for (const t of ["EXPRESSED_BREAST_MILK", "FORMULA"] as const) {
      const r = feedingSchema.safeParse({ ...valid, feedingType: t, amountMl: "" });
      expect(r.success, t).toBe(false);
    }
  });

  it("menolak volume nol, negatif, dan tak masuk akal", () => {
    for (const v of ["0", "-10", "5000", "abc"]) {
      expect(feedingSchema.safeParse({ ...valid, amountMl: v }).success, v).toBe(false);
    }
  });

  it("menggabungkan tanggal dan jam jadi satu waktu lokal", () => {
    const r = feedingSchema.parse(valid);
    expect(r.fedAt.getFullYear()).toBe(2026);
    expect(r.fedAt.getMonth()).toBe(8);
    expect(r.fedAt.getDate()).toBe(23);
    expect(r.fedAt.getHours()).toBe(14);
    expect(r.fedAt.getMinutes()).toBe(0);
  });

  it("menolak waktu di masa depan", () => {
    const besok = new Date();
    besok.setDate(besok.getDate() + 1);
    const r = feedingSchema.safeParse({
      ...valid,
      fedDate: `${besok.getFullYear()}-${String(besok.getMonth() + 1).padStart(2, "0")}-${String(besok.getDate()).padStart(2, "0")}`,
    });
    expect(r.success).toBe(false);
  });

  it("menolak jam yang tidak valid", () => {
    for (const t of ["25:00", "12:60", "9:00", ""]) {
      expect(feedingSchema.safeParse({ ...valid, fedTime: t }).success, t).toBe(false);
    }
  });
});

describe("combineDateTime", () => {
  it("menghasilkan waktu lokal, bukan UTC", () => {
    const d = combineDateTime("2026-09-23", "23:30")!;
    expect(d.getDate()).toBe(23);
    expect(d.getHours()).toBe(23);
  });

  it("menolak masukan tidak valid", () => {
    expect(combineDateTime("2026-02-31", "10:00")).toBeNull();
    expect(combineDateTime("2026-09-23", "24:00")).toBeNull();
    expect(combineDateTime("2026-09-23", "10:60")).toBeNull();
  });
});
