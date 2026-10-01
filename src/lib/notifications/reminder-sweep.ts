import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { childShares, children, vaccineReminders } from "@/db/schema";
import { catalogVaccine } from "@/lib/immunization/catalog";
import { notify } from "@/lib/push";

/**
 * Pemicu waktu untuk pengingat vaksin yang disetel sendiri orang tua.
 *
 * Sebelum ini tidak ada apa pun di server yang membaca `remind_on`/`remind_time`:
 * keduanya hanya dipakai untuk berkas .ics dan tautan Google Calendar, jadi jam yang
 * dipilih orang tua memang tidak pernah membunyikan apa pun dari aplikasi ini. Itu
 * bug yang dilaporkan, dan ini pemicunya.
 *
 * Bedanya dengan `vaccine-sync.ts`: di sana pemberitahuan lahir dari JADWAL yang
 * dihitung saat beranda dibuka (jendelanya berminggu-minggu, jadi jam tidak penting).
 * Di sini yang dibaca adalah jam yang DISETEL orang, dan itu harus tepat waktu tanpa
 * menunggu aplikasinya dibuka.
 *
 * ponytail: timer di dalam proses server, bukan cron eksternal — nol perubahan
 * infrastruktur di VPS. Ceiling-nya: satu instance. Kalau app di-scale jadi beberapa
 * replika, tiap replika akan menyapu dan push jadi ganda — pindahkan ke satu cron
 * yang memanggil `sweepDueReminders()` lewat route terproteksi saat itu terjadi.
 * (`notifications.dedupeKey` unik, jadi barisnya tetap satu; yang ganda push-nya.)
 */

/**
 * `remind_on` DATE dan `remind_time` TIME keduanya tanpa zona waktu: "09:00" berarti
 * jam sembilan di jam dinding orang tuanya, bukan UTC. Container ini jalan dengan TZ
 * bawaan (UTC), jadi membandingkannya ke waktu server membuat pengingat berbunyi 7
 * jam terlambat. Zonanya karena itu disebut eksplisit di SQL.
 *
 * ponytail: satu zona untuk semua — Indonesia punya tiga (WIB/WITA/WIT), jadi
 * pengguna WIT meleset 2 jam. Untuk pengingat vaksin itu masih berguna; tambahkan
 * kolom zona di `users` kalau ada yang mengeluh.
 */
const ZONE = "Asia/Jakarta";

/**
 * Pengingat yang jamnya sudah tiba dan belum lewat terlalu jauh.
 *
 * Batas bawahnya ada supaya dua hal tidak terjadi: pengingat lama tidak membanjiri HP
 * sekaligus saat fitur ini pertama kali naik, tapi pengingat yang jatuh saat server
 * sedang mati tetap tersusul begitu ia hidup lagi.
 */
export async function dueReminders() {
  return db
    .select({
      id: vaccineReminders.id,
      catalogKey: vaccineReminders.catalogKey,
      remindOn: vaccineReminders.remindOn,
      remindTime: vaccineReminders.remindTime,
      childId: children.id,
      childName: children.name,
      ownerId: children.userId,
    })
    .from(vaccineReminders)
    .innerJoin(children, eq(children.id, vaccineReminders.childId))
    .where(
      sql`(${vaccineReminders.remindOn} + ${vaccineReminders.remindTime}) at time zone ${ZONE}
          between now() - interval '2 days' and now()`,
    );
}

/**
 * Kirim pemberitahuan untuk setiap pengingat yang jamnya tiba.
 *
 * Penerimanya pemilik anak DAN pasangan yang undangannya diterima: kalau pengingat
 * disetel pasangan tapi hanya pemilik yang dapat push, orang yang memintanya justru
 * tidak dapat apa-apa — bug yang sama dalam bentuk lain.
 *
 * `dedupeKey` memuat tanggal dan jam targetnya, jadi penyapuan tiap menit tidak
 * melahirkan baris kedua; menjadwalkan ulang ke jam lain menghasilkan kunci baru dan
 * memang berbunyi lagi. Mengembalikan jumlah pemberitahuan baru yang benar-benar
 * masuk — nol berarti semuanya sudah pernah terkirim.
 */
export async function sweepDueReminders(): Promise<number> {
  const due = await dueReminders();
  if (due.length === 0) return 0;

  // Satu query untuk semua pasangan, bukan satu per pengingat.
  const partners = await db
    .select({ childId: childShares.childId, userId: childShares.inviteeUserId })
    .from(childShares)
    .where(
      and(
        inArray(
          childShares.childId,
          due.map((d) => d.childId),
        ),
        eq(childShares.status, "ACCEPTED"),
        sql`${childShares.inviteeUserId} is not null`,
        sql`${childShares.expiresAt} > now()`,
      ),
    );

  const sent = await Promise.all(
    due.flatMap((r) => {
      const vaccine = catalogVaccine(r.catalogKey)?.name ?? r.catalogKey;
      const recipients = new Set([
        r.ownerId,
        ...partners.filter((p) => p.childId === r.childId).map((p) => p.userId!),
      ]);

      return [...recipients].map((userId) =>
        notify(userId, {
          kind: "VACCINE_DUE",
          title: "Waktunya vaksin 💉",
          body: `Pengingat: ${vaccine} untuk ${r.childName}.`,
          url: `/children/${r.childId}`,
          dedupeKey: `reminder:${r.id}:${r.remindOn}T${r.remindTime}`,
        }).catch(() => false),
      );
    }),
  );

  return sent.filter(Boolean).length;
}

/** Satu menit: `remind_time` bergranularitas menit, jadi lebih sering tidak berguna. */
const EVERY_MS = 60_000;

let timer: ReturnType<typeof setInterval> | null = null;

/**
 * Dipanggil sekali dari `src/instrumentation.ts` saat server hidup.
 *
 * Galatnya ditelan dan dicatat, tidak dilempar: database yang belum siap saat
 * container baru naik tidak boleh menjatuhkan server, dan penyapuan berikutnya 60
 * detik kemudian akan mencoba lagi. `unref()` supaya timer ini tidak pernah menahan
 * proses tetap hidup saat shutdown.
 */
export function startReminderSweep() {
  if (timer) return;

  const tick = () =>
    void sweepDueReminders().catch((err) => console.error("[reminder-sweep]", err));

  timer = setInterval(tick, EVERY_MS);
  timer.unref?.();
  // Langsung sekali: menyusul pengingat yang jatuh saat server sedang mati.
  tick();
}
