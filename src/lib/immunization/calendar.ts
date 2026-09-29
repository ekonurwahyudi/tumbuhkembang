/**
 * Pengingat vaksin dibawa ke kalender pengguna, bukan dikirim sebagai notifikasi
 * oleh aplikasi ini: aplikasi kalender di HP membunyikan alarmnya walau aplikasi
 * ini tertutup, tanpa penjadwal di server maupun izin push.
 *
 * Waktu ditulis sebagai *floating time* — tanpa `Z` dan tanpa TZID. "Kamis 09:00"
 * berarti jam 09:00 di zona waktu perangkat yang membukanya. Itu persis maksud
 * pengingat ini; mengubahnya jadi UTC akan menggeser jam bagi pengguna yang
 * bepergian, dan container production yang berjalan UTC tidak tahu zona waktu
 * orang tuanya.
 */

export type CalendarEvent = {
  title: string;
  /** YYYY-MM-DD, kalender lokal. */
  date: string;
  /** HH:MM, jam lokal. */
  time: string;
  durationMinutes: number;
  description?: string | null;
  /** Pengenal stabil agar kalender memperbarui event yang sama, bukan menduplikasi. */
  uid: string;
};

/**
 * Jam-menit saja. Kolom TIME Postgres kembali sebagai "HH:MM:SS", sedangkan
 * <input type="time"> menolak detik. Tinggal di modul murni ini supaya server
 * component (slider beranda) dan client component sama-sama boleh memanggilnya.
 */
export const hhmm = (time: string) => time.slice(0, 5);

/** YYYYMMDDTHHMMSS — bentuk floating yang dipakai Google maupun .ics. */
function stamp(date: string, time: string, addMinutes = 0): string {
  const [y, mo, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const at = new Date(y, mo - 1, d, hh, mm + addMinutes);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${at.getFullYear()}${p(at.getMonth() + 1)}${p(at.getDate())}` +
    `T${p(at.getHours())}${p(at.getMinutes())}00`
  );
}

/**
 * URL template Google Calendar. Sengaja bukan Google Calendar API: API menuntut
 * scope calendar.events dan penyimpanan refresh token Google di database kita —
 * data pihak ketiga yang sensitif, demi hasil yang sama persis bagi pengguna.
 */
export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${stamp(event.date, event.time)}/${stamp(event.date, event.time, event.durationMinutes)}`,
  });
  if (event.description) params.set("details", event.description);
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** Escape nilai teks .ics sesuai RFC 5545 §3.3.11. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Lipat baris pada 75 oktet (RFC 5545 §3.1). Batasnya oktet, bukan karakter —
 * nama vaksin dan catatan boleh memuat huruf non-ASCII yang memakan >1 byte.
 */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;

  const out: string[] = [];
  let chunk = "";
  let used = 0;
  // Batas pertama 75 oktet; lanjutannya 74 karena diawali satu spasi.
  let limit = 75;
  for (const ch of line) {
    const size = new TextEncoder().encode(ch).length;
    if (used + size > limit) {
      out.push(chunk);
      chunk = "";
      used = 0;
      limit = 74;
    }
    chunk += ch;
    used += size;
  }
  if (chunk) out.push(chunk);
  return out.join("\r\n ");
}

/**
 * Satu berkas VCALENDAR berisi satu event dengan alarm 30 menit sebelumnya —
 * VALARM inilah yang membuat HP berbunyi saat waktunya tiba.
 */
export function icsEvent(event: CalendarEvent, now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const dtstamp =
    `${now.getUTCFullYear()}${p(now.getUTCMonth() + 1)}${p(now.getUTCDate())}` +
    `T${p(now.getUTCHours())}${p(now.getUTCMinutes())}${p(now.getUTCSeconds())}Z`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tumbuh Kembang//Pengingat Vaksin//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${stamp(event.date, event.time)}`,
    `DTEND:${stamp(event.date, event.time, event.durationMinutes)}`,
    `SUMMARY:${escapeText(event.title)}`,
    ...(event.description ? [`DESCRIPTION:${escapeText(event.description)}`] : []),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:-PT30M",
    `DESCRIPTION:${escapeText(event.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(fold).join("\r\n") + "\r\n";
}
