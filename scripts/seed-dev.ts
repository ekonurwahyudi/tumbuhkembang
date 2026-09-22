/**
 * Seed data pengembangan. Tidak untuk production.
 * Jalankan: npm run db:seed
 */
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { children, growthMeasurements, users } from "../src/db/schema";

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

  console.log(`Seed selesai. Login: ${EMAIL} / ${PASSWORD}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
