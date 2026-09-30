import "server-only";
import { notify } from "@/lib/push";
import type { ScheduleEntry } from "@/lib/immunization/schedule";

/**
 * Pemberitahuan jadwal vaksin.
 *
 * Tidak ada cron di aplikasi ini, jadi jadwalnya diperiksa saat beranda dibuka —
 * satu-satunya saat kita tahu server sedang berjalan untuk akun ini. Konsekuensinya
 * jujur: HP baru berbunyi setelah aplikasinya dibuka sekali hari itu, bukan tepat
 * pukul tujuh pagi. Untuk pengingat vaksin yang jendelanya berminggu-minggu, itu
 * cukup — dan jauh lebih sederhana daripada penjadwal yang harus dijaga hidup.
 *
 * `dedupeKey` memuat tanggal target, bukan tanggal hari ini: satu dosis melahirkan
 * tepat satu pemberitahuan sepanjang hidupnya, tidak peduli berapa kali berandanya
 * dibuka. Itu sebabnya `notify` mengembalikan false untuk yang sudah pernah masuk,
 * dan tidak ada push kedua untuk jadwal yang sama.
 *
 * ponytail: dipicu dari muat halaman; pindahkan ke cron bila jam pastinya penting.
 */

/** Ambang "sudah dekat": dua minggu sebelum tanggal target, plus yang sudah lewat. */
const SOON_DAYS = 14;

export async function syncVaccineNotifications(
  userId: string,
  childName: string,
  childId: string,
  schedule: ScheduleEntry[],
) {
  const due = schedule.filter(
    (e) => (e.status === "due" || e.status === "upcoming") && e.daysUntil <= SOON_DAYS,
  );
  if (due.length === 0) return;

  await Promise.all(
    due.map((e) =>
      notify(userId, {
        kind: "VACCINE_DUE",
        title: e.daysUntil < 0 ? "Vaksin terlewat 💉" : "Jadwal vaksin mendekat 💉",
        body:
          e.daysUntil < 0
            ? `${e.vaccine.name} untuk ${childName} sudah lewat ${Math.abs(e.daysUntil)} hari dari jadwal.`
            : e.daysUntil === 0
              ? `${e.vaccine.name} untuk ${childName} dijadwalkan hari ini.`
              : `${e.vaccine.name} untuk ${childName} dijadwalkan ${e.daysUntil} hari lagi.`,
        url: `/children/${childId}`,
        // Tanggal target, bukan hari ini — satu dosis, satu pemberitahuan.
        dedupeKey: `vaccine:${childId}:${e.vaccine.key}:${e.targetDate}`,
      }).catch(() => false),
    ),
  );
}
