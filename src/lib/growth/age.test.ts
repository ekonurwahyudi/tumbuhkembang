import { describe, expect, it } from "vitest";
import {
  addDays,
  chronologicalAge,
  diffInDays,
  formatAge,
  formatAgeDaysDetailed,
  formatAgeDetailed,
  formatYMD,
  parseYMD,
  todayYMD,
} from "./age";
import {
  CORRECTION_LIMIT_DAYS,
  TERM_GESTATION_DAYS,
  correctedAge,
  estimatedDueDate,
  formatWeeksDays,
  gestationalAgeInDays,
  postMenstrualAgeDays,
} from "./corrected-age";

describe("diffInDays", () => {
  it("menghitung selisih hari kalender", () => {
    expect(diffInDays("2026-01-01", "2026-01-31")).toBe(30);
    expect(diffInDays("2026-01-31", "2026-01-01")).toBe(-30);
    expect(diffInDays("2026-01-01", "2026-01-01")).toBe(0);
  });

  it("benar melintasi tahun kabisat", () => {
    // 2024 kabisat: Feb punya 29 hari.
    expect(diffInDays("2024-02-28", "2024-03-01")).toBe(2);
    expect(diffInDays("2023-02-28", "2023-03-01")).toBe(1);
    expect(diffInDays("2024-01-01", "2025-01-01")).toBe(366);
    expect(diffInDays("2025-01-01", "2026-01-01")).toBe(365);
  });

  it("tidak terpengaruh transisi DST", () => {
    // DST AS mulai 8 Maret 2026 — selisih tetap 31 hari kalender.
    expect(diffInDays("2026-03-01", "2026-04-01")).toBe(31);
  });
});

describe("chronologicalAge", () => {
  it("tidak menganggap 1 bulan = 30 hari", () => {
    // 15 Jan -> 15 Feb tetap 1 bulan penuh meski hanya 31 hari.
    const a = chronologicalAge("2026-01-15", "2026-02-15");
    expect(a.months).toBe(1);
    expect(a.remainingDays).toBe(0);
    expect(a.days).toBe(31);
  });

  it("meminjam hari dari bulan sebelumnya dengan benar", () => {
    // 31 Jan -> 1 Mar 2026: 0 bulan penuh + sisa hari, total 29 hari.
    const a = chronologicalAge("2026-01-31", "2026-03-01");
    expect(a.days).toBe(29);
    expect(a.years).toBe(0);
    expect(a.months).toBe(1);
    expect(a.remainingDays).toBe(1);
  });

  it("menghitung tahun dan bulan", () => {
    const a = chronologicalAge("2024-03-10", "2026-09-22");
    expect(a.years).toBe(2);
    expect(a.months).toBe(6);
    expect(a.remainingDays).toBe(12);
    expect(a.totalMonths).toBe(30);
  });

  it("usia nol pada hari lahir", () => {
    const a = chronologicalAge("2026-09-22", "2026-09-22");
    expect(a).toMatchObject({ days: 0, years: 0, months: 0, remainingDays: 0 });
  });
});

describe("formatAge", () => {
  it("memakai satuan yang sesuai per rentang usia", () => {
    expect(formatAge(chronologicalAge("2026-09-20", "2026-09-22"))).toBe("2 hari");
    expect(formatAge(chronologicalAge("2026-09-01", "2026-09-22"))).toBe("3 minggu");
    expect(formatAge(chronologicalAge("2026-01-22", "2026-09-22"))).toBe("8 bulan");
    expect(formatAge(chronologicalAge("2024-09-22", "2026-09-22"))).toBe("2 tahun");
    expect(formatAge(chronologicalAge("2024-03-22", "2026-09-22"))).toBe("2 tahun 6 bulan");
  });
});

describe("formatAgeDetailed", () => {
  it("menampilkan sampai hari sesuai rentang usia", () => {
    expect(formatAgeDetailed(chronologicalAge("2026-09-20", "2026-09-22"))).toBe("2 Hari");
    expect(formatAgeDetailed(chronologicalAge("2026-09-08", "2026-09-22"))).toBe("2 Minggu 0 Hari");
    expect(formatAgeDetailed(chronologicalAge("2026-01-08", "2026-09-22"))).toBe(
      "8 Bulan 14 Hari",
    );
    expect(formatAgeDetailed(chronologicalAge("2023-07-22", "2026-09-22"))).toBe(
      "3 Tahun 2 Bulan",
    );
    expect(formatAgeDetailed(chronologicalAge("2023-07-22", "2025-07-22"))).toBe("2 Tahun");
  });

  it("hari negatif (belum lahir menurut EDD) tampil sebagai strip", () => {
    expect(formatAgeDetailed({ ...chronologicalAge("2026-01-15", "2026-01-01"), days: -14 })).toBe(
      "-",
    );
  });

  it("formatAgeDaysDetailed menghitung dari jumlah hari (anchor 2000)", () => {
    expect(formatAgeDaysDetailed(257)).toBe("8 Bulan 13 Hari");
    expect(formatAgeDaysDetailed(10)).toBe("10 Hari");
  });
});

describe("addDays / formatYMD / todayYMD", () => {
  it("menambah hari melintasi batas bulan", () => {
    expect(formatYMD(addDays("2026-02-28", 1))).toBe("2026-03-01");
    expect(formatYMD(addDays("2024-02-28", 1))).toBe("2024-02-29");
    expect(formatYMD(addDays("2026-01-01", -1))).toBe("2025-12-31");
  });

  it("todayYMD menghasilkan format ISO tanggal", () => {
    expect(todayYMD(new Date(2026, 8, 22))).toBe("2026-09-22");
  });

  it("YMD ⇄ Date lokal bolak-balik tanpa bergeser sehari", () => {
    /*
      Jalur yang dipakai DateField (@/components/ui/date-field.tsx): react-day-picker
      memberi objek Date, form mengirim string. Lewat toISOString() tanggalnya
      bergeser satu hari di zona timur seperti WIB, jadi konversinya harus lewat
      parseYMD/formatYMD.
    */
    for (const ymd of ["2026-09-22", "2026-01-01", "2026-12-31", "2024-02-29"]) {
      const { year, month, day } = parseYMD(ymd);
      const asDate = new Date(year, month - 1, day);
      expect(formatYMD(parseYMD(asDate))).toBe(ymd);
    }
  });
});

describe("gestationalAgeInDays", () => {
  it("32 minggu 4 hari = 228 hari", () => {
    expect(gestationalAgeInDays(32, 4)).toBe(228);
  });

  it("menolak hari di luar 0-6", () => {
    expect(() => gestationalAgeInDays(32, 7)).toThrow();
    expect(() => gestationalAgeInDays(32, -1)).toThrow();
  });
});

describe("correctedAge (AAP 2004)", () => {
  // Contoh AAP: lahir 32w0d, usia kronologis 8 minggu.
  // Prematuritas = 40w - 32w = 8 minggu -> corrected age = 0.
  it("bayi 32w0d berusia kronologis 8 minggu punya corrected age 0", () => {
    const r = correctedAge({
      dateOfBirth: "2026-01-01",
      gestationalAgeWeeks: 32,
      gestationalAgeDays: 0,
      asOf: "2026-02-26", // 56 hari = 8 minggu
    });
    expect(r.prematurityDays).toBe(56);
    expect(r.chronological.days).toBe(56);
    expect(r.days).toBe(0);
    expect(r.applicable).toBe(true);
  });

  it("corrected age = kronologis - prematuritas", () => {
    const r = correctedAge({
      dateOfBirth: "2026-01-01",
      gestationalAgeWeeks: 32,
      gestationalAgeDays: 4,
      asOf: "2026-07-01",
    });
    expect(r.prematurityDays).toBe(TERM_GESTATION_DAYS - 228); // 52
    expect(r.days).toBe(r.chronological.days - 52);
  });

  it("negatif bila bayi belum mencapai usia term", () => {
    const r = correctedAge({
      dateOfBirth: "2026-01-01",
      gestationalAgeWeeks: 28,
      gestationalAgeDays: 0,
      asOf: "2026-02-01",
    });
    expect(r.days).toBeLessThan(0);
  });

  it("tidak ada koreksi untuk bayi 40 minggu atau lebih", () => {
    const r = correctedAge({
      dateOfBirth: "2026-01-01",
      gestationalAgeWeeks: 40,
      gestationalAgeDays: 0,
      asOf: "2026-06-01",
    });
    expect(r.prematurityDays).toBe(0);
    expect(r.days).toBe(r.chronological.days);
    expect(r.applicable).toBe(false);
  });

  it("berhenti berlaku setelah 3 tahun usia kronologis (AAP)", () => {
    const base = {
      dateOfBirth: "2023-01-01",
      gestationalAgeWeeks: 30,
      gestationalAgeDays: 0,
    };
    const within = correctedAge({ ...base, asOf: "2025-12-01" });
    expect(within.chronological.days).toBeLessThanOrEqual(CORRECTION_LIMIT_DAYS);
    expect(within.applicable).toBe(true);

    const beyond = correctedAge({ ...base, asOf: "2026-06-01" });
    expect(beyond.chronological.days).toBeGreaterThan(CORRECTION_LIMIT_DAYS);
    expect(beyond.applicable).toBe(false);
  });
});

describe("postMenstrualAgeDays (AAP: GA + usia kronologis)", () => {
  it("bayi 32w0d berusia 2 minggu punya PMA 34w0d", () => {
    const pma = postMenstrualAgeDays({
      dateOfBirth: "2026-01-01",
      gestationalAgeWeeks: 32,
      gestationalAgeDays: 0,
      asOf: "2026-01-15",
    });
    expect(pma).toBe(34 * 7);
    expect(formatWeeksDays(pma)).toBe("34 minggu");
  });

  it("membawa sisa hari dengan benar", () => {
    const pma = postMenstrualAgeDays({
      dateOfBirth: "2026-01-01",
      gestationalAgeWeeks: 32,
      gestationalAgeDays: 5,
      asOf: "2026-01-05",
    });
    expect(pma).toBe(32 * 7 + 5 + 4);
    expect(formatWeeksDays(pma)).toBe("33 minggu 2 hari");
  });
});

describe("estimatedDueDate", () => {
  it("bayi 32w0d punya EDD 56 hari setelah lahir", () => {
    expect(
      estimatedDueDate({
        dateOfBirth: "2026-01-01",
        gestationalAgeWeeks: 32,
        gestationalAgeDays: 0,
      }),
    ).toBe("2026-02-26");
  });

  it("bayi cukup bulan punya EDD sama dengan tanggal lahir", () => {
    expect(
      estimatedDueDate({
        dateOfBirth: "2026-01-01",
        gestationalAgeWeeks: 40,
        gestationalAgeDays: 0,
      }),
    ).toBe("2026-01-01");
  });

  it("corrected age dari EDD konsisten dengan correctedAge().days", () => {
    const args = { dateOfBirth: "2026-01-01", gestationalAgeWeeks: 33, gestationalAgeDays: 2 };
    const asOf = "2026-08-15";
    const viaEdd = diffInDays(estimatedDueDate(args), asOf);
    expect(viaEdd).toBe(correctedAge({ ...args, asOf }).days);
  });
});
