import { addMonthsClamped, chronologicalAge, diffInDays, formatYMD, parseYMD, todayYMD } from "@/lib/growth/age";
import {
  effectiveMinAgeMonths,
  IMMUNIZATION_CATALOG,
  weightGateSatisfied,
  type CatalogVaccine,
} from "./catalog";

/**
 * Status tiap vaksin katalog untuk seorang anak, plus tanggal targetnya.
 *
 * Satu sumber untuk daftar lengkap (halaman anak) dan slider "vaksin terdekat"
 * (beranda) — status tidak dihitung dua kali dengan aturan yang bisa menyimpang.
 * Tanggal target murni kalender (tanggal lahir + usia minimum efektif); bukan
 * jadwal janji temu, jadi tidak ada jam maupun tempat di sini.
 */

export type VaccineStatus = "given" | "skipped" | "due" | "upcoming";

export type ScheduleEntry = {
  vaccine: CatalogVaccine;
  status: VaccineStatus;
  /** Tanggal lahir + usia minimum efektif, YYYY-MM-DD. */
  targetDate: string;
  /** Selisih hari dari hari ini ke targetDate; negatif berarti sudah terlewat. */
  daysUntil: number;
  givenAt: string | null;
  /** false bila dosis tertahan syarat berat badan terkini. */
  weightOk: boolean;
};

export type ScheduleChild = {
  dateOfBirth: string;
  birthType: "TERM" | "PRETERM";
  birthWeightGrams: number | null;
};

export function vaccineSchedule(params: {
  child: ScheduleChild;
  vaccinations: { catalogKey: string | null; givenAt: string }[];
  skippedKeys: string[];
  /** Berat terkini (gram); null bila belum diketahui. */
  currentWeightGrams: number | null;
  asOf?: string;
}): ScheduleEntry[] {
  const { child, vaccinations, skippedKeys, currentWeightGrams, asOf = todayYMD() } = params;
  const ageMonths = chronologicalAge(child.dateOfBirth, asOf).totalMonths;
  const given = new Map(
    vaccinations.filter((v) => v.catalogKey).map((v) => [v.catalogKey as string, v.givenAt]),
  );
  const skipped = new Set(skippedKeys);
  const birth = parseYMD(child.dateOfBirth);

  return IMMUNIZATION_CATALOG.map((vaccine) => {
    const minAgeMonths = effectiveMinAgeMonths(vaccine, child.birthWeightGrams);
    const weightOk = weightGateSatisfied(vaccine, child, currentWeightGrams);
    const givenAt = given.get(vaccine.key) ?? null;
    const status: VaccineStatus = givenAt
      ? "given"
      : skipped.has(vaccine.key)
        ? "skipped"
        : ageMonths >= minAgeMonths && weightOk
          ? "due"
          : "upcoming";
    const targetDate = formatYMD(addMonthsClamped(birth, minAgeMonths));

    return {
      vaccine,
      status,
      targetDate,
      daysUntil: diffInDays(asOf, targetDate),
      givenAt,
      weightOk,
    };
  });
}

export type ReminderRef = { remindOn: string; remindTime: string };

/**
 * Vaksin yang perlu ditampilkan di beranda: yang belum diberikan/dilewati,
 * paling dekat dulu (yang sudah terlewat otomatis paling depan).
 *
 * Yang sudah dijadwalkan orang tua naik ke depan, apa pun `daysUntil`-nya:
 * itu janji yang sudah dibuat sendiri, bukan lagi perkiraan kalender.
 * Urutannya tetap dihitung di sini supaya halaman anak dan beranda sepakat.
 */
export function upcomingVaccines(
  schedule: ScheduleEntry[],
  reminders?: Map<string, ReminderRef>,
  limit = 3,
): ScheduleEntry[] {
  return schedule
    .filter((e) => e.status === "due" || e.status === "upcoming")
    .sort((a, b) => {
      const ra = reminders?.get(a.vaccine.key);
      const rb = reminders?.get(b.vaccine.key);
      if (ra && rb)
        return `${ra.remindOn}T${ra.remindTime}`.localeCompare(`${rb.remindOn}T${rb.remindTime}`);
      if (ra) return -1;
      if (rb) return 1;
      return a.daysUntil - b.daysUntil;
    })
    .slice(0, limit);
}
