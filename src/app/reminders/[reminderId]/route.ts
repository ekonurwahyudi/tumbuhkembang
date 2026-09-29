import { auth } from "@/lib/auth";
import { getReminder } from "@/lib/data/vaccine-reminders";
import { catalogVaccine } from "@/lib/immunization/catalog";
import { icsEvent } from "@/lib/immunization/calendar";

/** Sepanjang kunjungan imunisasi pada umumnya; hanya penanda di kalender. */
const DURATION_MINUTES = 60;

/**
 * Berkas .ics untuk satu pengingat, agar dapat dibuka aplikasi kalender di HP.
 *
 * Berkas nyata, bukan `data:` URL: iOS menolak unduhan `data:`, dan berkas
 * inilah yang dikenali Kalender bawaan. Pengingat milik orang lain dijawab 404 —
 * bukan 403 — supaya keberadaan sebuah id tidak bisa diraba lewat kode status.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ reminderId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 404 });

  const { reminderId } = await params;
  const reminder = await getReminder(session.user.id, reminderId);
  if (!reminder) return new Response(null, { status: 404 });

  const vaccine = catalogVaccine(reminder.catalogKey);
  if (!vaccine) return new Response(null, { status: 404 });

  const body = icsEvent({
    title: `Vaksin ${vaccine.name}`,
    date: reminder.remindOn,
    // Kolom TIME Postgres kembali sebagai "HH:MM:SS"; .ics hanya butuh jam-menit.
    time: reminder.remindTime.slice(0, 5),
    durationMinutes: DURATION_MINUTES,
    description: reminder.notes,
    uid: `${reminder.id}@tumbuhkembang`,
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="vaksin-${reminder.catalogKey.toLowerCase()}.ics"`,
      // Data anak: boleh di cache browser pengguna, tidak boleh cache bersama.
      "Cache-Control": "private, no-store",
    },
  });
}
