import "server-only";
import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { membershipLimits, registryItems, type MembershipTier } from "@/db/schema";

/**
 * Batas per tingkat keanggotaan. Angkanya dari DB supaya admin bisa mengubahnya
 * tanpa deploy; FALLBACK hanya dipakai bila barisnya hilang — tier tanpa baris
 * tidak boleh berarti "bebas tanpa batas".
 */
const FALLBACK: Record<MembershipTier, number | null> = {
  FREEMIUM: 5,
  VIP: null,
  VVIP: null,
};

export async function listMembershipLimits() {
  return db.select().from(membershipLimits).orderBy(asc(membershipLimits.tier));
}

/** `null` = tanpa batas. */
export async function registryMaxFor(tier: MembershipTier): Promise<number | null> {
  const [row] = await db
    .select({ registryMax: membershipLimits.registryMax })
    .from(membershipLimits)
    .where(eq(membershipLimits.tier, tier))
    .limit(1);
  return row ? row.registryMax : FALLBACK[tier];
}

export async function setRegistryMax(tier: MembershipTier, registryMax: number | null) {
  const [row] = await db
    .insert(membershipLimits)
    .values({ tier, registryMax })
    .onConflictDoUpdate({
      target: membershipLimits.tier,
      set: { registryMax, updatedAt: new Date() },
    })
    .returning({ tier: membershipLimits.tier });
  return row;
}

/**
 * Sisa jatah kado. Dipanggil dua kali: sekali di server action sebagai penjaga,
 * sekali di halaman untuk menampilkan sisa kuota — hitungannya harus satu sumber,
 * bukan diulang di masing-masing pemanggil.
 */
export async function registryQuota(userId: string, tier: MembershipTier) {
  const max = await registryMaxFor(tier);
  if (max === null) return { max: null, used: 0, canAdd: true } as const;

  const [row] = await db
    .select({ used: count() })
    .from(registryItems)
    .where(eq(registryItems.userId, userId));
  const used = row?.used ?? 0;
  return { max, used, canAdd: used < max } as const;
}
