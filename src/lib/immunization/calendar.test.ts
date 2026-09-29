import { describe, expect, it } from "vitest";
import { googleCalendarUrl, icsEvent, type CalendarEvent } from "./calendar";

const base: CalendarEvent = {
  title: "Vaksin DPT-HB-Hib 1",
  date: "2026-11-14",
  time: "09:00",
  durationMinutes: 60,
  uid: "r1@tumbuhkembang",
};

describe("googleCalendarUrl", () => {
  it("menulis rentang waktu floating, tanpa Z", () => {
    const url = new URL(googleCalendarUrl(base));
    expect(url.searchParams.get("dates")).toBe("20261114T090000/20261114T100000");
    expect(url.searchParams.get("text")).toBe("Vaksin DPT-HB-Hib 1");
  });

  it("meng-encode judul dan catatan yang memuat karakter khusus", () => {
    const url = new URL(
      googleCalendarUrl({ ...base, title: "Vaksin & imunisasi", description: "Posyandu RW 03" }),
    );
    // URLSearchParams sudah meng-encode; yang penting nilainya utuh saat dibaca kembali.
    expect(url.searchParams.get("title")).toBeNull();
    expect(url.searchParams.get("text")).toBe("Vaksin & imunisasi");
    expect(url.searchParams.get("details")).toBe("Posyandu RW 03");
  });

  it("melewati details bila catatan kosong", () => {
    expect(googleCalendarUrl({ ...base, description: null })).not.toContain("details=");
  });

  it("melintasi tengah malam dengan benar", () => {
    const url = new URL(googleCalendarUrl({ ...base, time: "23:30", durationMinutes: 60 }));
    expect(url.searchParams.get("dates")).toBe("20261114T233000/20261115T003000");
  });
});

describe("icsEvent", () => {
  const ics = icsEvent(base, new Date(Date.UTC(2026, 8, 28, 5, 4, 3)));

  it("memakai CRLF dan membungkus satu VEVENT", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("\r\nBEGIN:VEVENT\r\n");
  });

  it("menulis DTSTART/DTEND floating dan DTSTAMP UTC", () => {
    expect(ics).toContain("DTSTART:20261114T090000");
    expect(ics).toContain("DTEND:20261114T100000");
    expect(ics).not.toContain("DTSTART:20261114T090000Z");
    expect(ics).toContain("DTSTAMP:20260928T050403Z");
  });

  it("menyertakan alarm 30 menit sebelumnya", () => {
    expect(ics).toContain("BEGIN:VALARM");
    expect(ics).toContain("TRIGGER:-PT30M");
  });

  it("meng-escape koma, titik koma, backslash, dan baris baru", () => {
    const out = icsEvent(
      { ...base, description: "Posyandu, RW 03; bawa KIA\\buku\nJangan telat" },
      new Date(0),
    );
    const line = out.split("\r\n").find((l) => l.startsWith("DESCRIPTION:Posyandu"))!;
    expect(line).toContain("Posyandu\\, RW 03\\; bawa KIA\\\\buku\\nJangan telat");
  });

  it("melipat baris lebih dari 75 oktet dengan awalan spasi", () => {
    const out = icsEvent({ ...base, description: "x".repeat(200) }, new Date(0));
    for (const line of out.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(out).toContain("\r\n x");
  });

  it("tidak memecah karakter multibyte saat melipat", () => {
    const out = icsEvent({ ...base, description: "é".repeat(60) }, new Date(0));
    // Baris terlipat harus tetap terurai jadi teks yang sama.
    const unfolded = out.replace(/\r\n /g, "");
    expect(unfolded).toContain(`DESCRIPTION:${"é".repeat(60)}`);
    for (const line of out.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });
});
