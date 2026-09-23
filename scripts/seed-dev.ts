/**
 * Seed data pengembangan. Tidak untuk production.
 * Jalankan: npm run db:seed
 */
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { children, feedingLogs, growthMeasurements, users } from "../src/db/schema";

const EMAIL = "demo@tumbuhkembang.local";
const PASSWORD = "Demo1234";

async function main() {
  await db.delete(users).where(eq(users.email, EMAIL));

  const [user] = await db
    .insert(users)
    .values({ name: "Ayah Demo", email: EMAIL, passwordHash: await hash(PASSWORD, 12) })
    .returning();

  const [term] = await db
    .insert(children)
    .values({
      userId: user.id,
      name: "Aisyah",
      sex: "FEMALE",
      dateOfBirth: "2026-01-22",
      birthType: "TERM",
    })
    .returning();

  const [preterm] = await db
    .insert(children)
    .values({
      userId: user.id,
      name: "Budi",
      sex: "MALE",
      dateOfBirth: "2026-05-10",
      birthType: "PRETERM",
      gestationalAgeWeeks: 32,
      gestationalAgeDays: 4,
    })
    .returning();

  await db.insert(growthMeasurements).values([
    { childId: term.id, measuredAt: "2026-08-22", weightKg: "6.800", lengthHeightCm: "65.20", headCircumferenceCm: "42.00" },
    { childId: term.id, measuredAt: "2026-08-29", weightKg: "7.000", lengthHeightCm: "65.80", headCircumferenceCm: "42.40" },
    { childId: term.id, measuredAt: "2026-09-05", weightKg: "7.100", lengthHeightCm: "66.30", headCircumferenceCm: "42.70" },
    { childId: preterm.id, measuredAt: "2026-09-05", weightKg: "3.200", lengthHeightCm: "49.50", headCircumferenceCm: "34.50" },
  ]);

  // Catatan asupan hari ini — mengikuti contoh pada spesifikasi.
  const at = (hour: number, minute: number) => {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d;
  };
  await db.insert(feedingLogs).values([
    { childId: term.id, feedingType: "BREAST_DIRECT", amountMl: null, fedAt: at(6, 30) },
    { childId: term.id, feedingType: "EXPRESSED_BREAST_MILK", amountMl: "90.0", fedAt: at(9, 0) },
    { childId: term.id, feedingType: "BREAST_DIRECT", amountMl: null, fedAt: at(11, 30) },
    { childId: term.id, feedingType: "FORMULA", amountMl: "100.0", fedAt: at(14, 0) },
    { childId: term.id, feedingType: "EXPRESSED_BREAST_MILK", amountMl: "90.0", fedAt: at(17, 0) },
    { childId: term.id, feedingType: "FORMULA", amountMl: "100.0", fedAt: at(20, 0) },
    { childId: preterm.id, feedingType: "BREAST_DIRECT", amountMl: null, fedAt: at(8, 0) },
    { childId: preterm.id, feedingType: "EXPRESSED_BREAST_MILK", amountMl: "60.0", fedAt: at(12, 0) },
  ]);

  console.log(`Seed selesai. Login: ${EMAIL} / ${PASSWORD}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
