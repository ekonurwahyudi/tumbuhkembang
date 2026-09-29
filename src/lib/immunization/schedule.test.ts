import { describe, expect, it } from "vitest";
import { upcomingVaccines, vaccineSchedule } from "./schedule";

const term = { dateOfBirth: "2026-01-15", birthType: "TERM" as const, birthWeightGrams: 3200 };

const entry = (key: string, opts: Parameters<typeof vaccineSchedule>[0]) =>
  vaccineSchedule(opts).find((e) => e.vaccine.key === key)!;

describe("vaccineSchedule", () => {
  const base = {
    child: term,
    vaccinations: [],
    skippedKeys: [],
    currentWeightGrams: 7000,
    asOf: "2026-04-20",
  };

  it("tanggal target = lahir + usia minimum, dengan clamp kalender", () => {
    // 15 Jan + 2 bulan = 15 Mar; usia 3 bulan (DPT-HB-Hib 2) = 15 Apr.
    expect(entry("DPT_HB_HIB_1", base).targetDate).toBe("2026-03-15");
    expect(entry("DPT_HB_HIB_2", base).targetDate).toBe("2026-04-15");
    // 31 Jan + 1 bulan tidak meluber ke 3 Mar.
    const endOfMonth = { ...term, dateOfBirth: "2026-01-31" };
    expect(entry("BCG", { ...base, child: endOfMonth }).targetDate).toBe("2026-02-28");
  });

  it("status: given > skipped > due > upcoming", () => {
    const opts = {
      ...base,
      vaccinations: [{ catalogKey: "BCG", givenAt: "2026-02-20" }],
      skippedKeys: ["RV1"],
    };
    expect(entry("BCG", opts).status).toBe("given");
    expect(entry("RV1", opts).status).toBe("skipped");
    // Usia 3 bulan pada 20 Apr → 3 bulan sudah jalan, 4 bulan belum.
    expect(entry("PCV2", opts).status).toBe("due");
    expect(entry("IPV1", opts).status).toBe("upcoming");
  });

  it("syarat berat terkini menahan dosis bayi prematur", () => {
    const preterm = { dateOfBirth: "2026-01-15", birthType: "PRETERM" as const, birthWeightGrams: 1800 };
    const opts = { ...base, child: preterm, currentWeightGrams: 1900 };
    const e = entry("OPV2", opts);
    expect(e.weightOk).toBe(false);
    expect(e.status).toBe("upcoming");
    expect(entry("OPV2", { ...opts, currentWeightGrams: 2100 }).status).toBe("due");
  });

  it("upcomingVaccines: yang belum diberikan, terdekat dulu, dibatasi jumlahnya", () => {
    const list = upcomingVaccines(vaccineSchedule(base), undefined, 2);
    expect(list).toHaveLength(2);
    expect(list.every((e) => e.status === "due" || e.status === "upcoming")).toBe(true);
    expect(list[0].daysUntil).toBeLessThanOrEqual(list[1].daysUntil);
  });

  it("upcomingVaccines: yang punya pengingat naik ke depan walau lebih jauh", () => {
    const schedule = vaccineSchedule(base);
    const pending = schedule.filter((e) => e.status === "due" || e.status === "upcoming");
    // Yang paling jauh dari daftar tertunda — tanpa pengingat, ia paling belakang.
    const farthest = pending.reduce((a, b) => (b.daysUntil > a.daysUntil ? b : a));
    expect(upcomingVaccines(schedule, undefined, 3)[0].vaccine.key).not.toBe(farthest.vaccine.key);

    const reminders = new Map([
      [farthest.vaccine.key, { remindOn: "2026-12-01", remindTime: "09:00" }],
    ]);
    const list = upcomingVaccines(schedule, reminders, 3);
    expect(list[0].vaccine.key).toBe(farthest.vaccine.key);
    // Sisanya tetap menurut daysUntil seperti sebelumnya.
    expect(list[1].daysUntil).toBeLessThanOrEqual(list[2].daysUntil);
  });
});
