/**
 * Yang diuji: jendela waktu penyapu pengingat, terhadap Postgres sungguhan.
 *
 * Ini bagian yang bisa gagal diam-diam. `remind_on` DATE + `remind_time` TIME
 * keduanya tanpa zona, jadi salah menafsirkannya berarti pengingat berbunyi 7 jam
 * terlambat di WIB atau tidak berbunyi sama sekali — dan dua-duanya tidak akan
 * terlihat dari kode. `notify()` sendiri tidak dipanggil di sini: mesinnya sudah
 * dipakai jalur klaim kado, yang baru adalah pemilihan barisnya.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, vaccineReminders } from "@/db/schema";
import { insertChild } from "@/lib/data/children";
import { upsertReminder } from "@/lib/data/vaccine-reminders";
import { dueReminders } from "./reminder-sweep";

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let userId: string;
let childId: string;

/** Jam dinding WIB — zona yang sama dengan yang dipakai penyapu. */
const jakartaNow = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));

/**
 * Geser dari "sekarang" di WIB, lalu pisah jadi kolom DATE dan TIME.
 * Dalam menit, bukan jam: `setHours` memotong argumen pecahan jadi integer, jadi
 * setengah jam lewat `setHours(h - 0.5)` akan diam-diam menjadi nol geseran.
 */
function offsetFromNow(minutes: number) {
  const t = jakartaNow();
  t.setMinutes(t.getMinutes() + minutes);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    remindOn: `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`,
    remindTime: `${pad(t.getHours())}:${pad(t.getMinutes())}`,
  };
}

const mine = async () => (await dueReminders()).filter((r) => r.childId === childId);

beforeAll(async () => {
  const [u] = await db
    .insert(users)
    .values({ name: "Sweep", email: `sweep-${suffix}@test.local`, passwordHash: "x" })
    .returning();
  userId = u.id;

  const child = await insertChild(userId, {
    name: "Bayi Sapu",
    sex: "MALE",
    dateOfBirth: "2026-03-01",
    birthType: "TERM",
    gestationalAgeWeeks: null,
    gestationalAgeDays: null,
  });
  childId = child.id;
});

// Anak dan pengingatnya ikut terhapus lewat cascade.
afterAll(async () => {
  await db.delete(users).where(eq(users.id, userId));
});

describe("dueReminders", () => {
  it("mengambil pengingat yang jamnya baru lewat", async () => {
    await upsertReminder(childId, {
      catalogKey: "OPV1",
      ...offsetFromNow(-60),
      notes: null,
    });

    const rows = await mine();
    expect(rows).toHaveLength(1);
    // Nama anak dan pemiliknya ikut terbawa — itu yang dipakai isi pemberitahuan.
    expect(rows[0].childName).toBe("Bayi Sapu");
    expect(rows[0].ownerId).toBe(userId);
  });

  it("tidak mengambil yang jamnya belum tiba", async () => {
    await db.delete(vaccineReminders).where(eq(vaccineReminders.childId, childId));
    await upsertReminder(childId, { catalogKey: "OPV1", ...offsetFromNow(120), notes: null });
    expect(await mine()).toHaveLength(0);
  });

  /*
    Pagar yang paling berguna di sini. Pengingat jam 1 pagi WIB itu "belum tiba" bagi
    server ber-TZ UTC (di sana baru jam 18 hari sebelumnya), dan tanpa `at time zone`
    pengingat pagi akan selalu meleset. Dibandingkan ke jam dinding Jakarta, bukan ke
    jam server: itu yang dilihat orang tuanya.
  */
  it("membandingkan ke jam Jakarta, bukan jam server", async () => {
    await db.delete(vaccineReminders).where(eq(vaccineReminders.childId, childId));
    const wib = jakartaNow();
    // 30 menit lalu menurut WIB — di dalam jendela, berapa pun TZ servernya.
    await upsertReminder(childId, { catalogKey: "BCG", ...offsetFromNow(-30), notes: null });

    const rows = await mine();
    expect(rows).toHaveLength(1);
    expect(rows[0].remindOn).toBe(
      `${wib.getFullYear()}-${String(wib.getMonth() + 1).padStart(2, "0")}-${String(
        wib.getDate(),
      ).padStart(2, "0")}`,
    );
  });

  it("tidak mengambil yang sudah lewat lebih dari dua hari", async () => {
    await db.delete(vaccineReminders).where(eq(vaccineReminders.childId, childId));
    await upsertReminder(childId, {
      catalogKey: "OPV1",
      ...offsetFromNow(-60 * 24 * 3),
      notes: null,
    });
    expect(await mine()).toHaveLength(0);
  });
});
