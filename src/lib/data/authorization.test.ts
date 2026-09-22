/**
 * Integration test lapisan data: memastikan tidak ada jalur yang membocorkan
 * atau mengubah data anak milik user lain. Berjalan di database sungguhan.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  assertChildOwned,
  deleteChild,
  getChild,
  insertChild,
  listChildren,
  listChildrenWithLatestMeasurement,
  updateChild,
} from "@/lib/data/children";
import {
  deleteMeasurement,
  getMeasurement,
  insertMeasurement,
  listMeasurements,
  updateMeasurement,
} from "@/lib/data/measurements";

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let alice: string;
let bob: string;
let aliceChild: string;
let aliceMeasurement: string;

beforeAll(async () => {
  const [a] = await db
    .insert(users)
    .values({ name: "Alice", email: `alice-${suffix}@test.local`, passwordHash: "x" })
    .returning();
  const [b] = await db
    .insert(users)
    .values({ name: "Bob", email: `bob-${suffix}@test.local`, passwordHash: "x" })
    .returning();
  alice = a.id;
  bob = b.id;

  const child = await insertChild(alice, {
    name: "Aisyah",
    sex: "FEMALE",
    dateOfBirth: "2026-01-15",
    birthType: "PRETERM",
    gestationalAgeWeeks: 32,
    gestationalAgeDays: 4,
  });
  aliceChild = child.id;

  const m = await insertMeasurement(aliceChild, {
    measuredAt: "2026-08-22",
    weightKg: "6.800",
    lengthHeightCm: "65.20",
    headCircumferenceCm: "42.00",
    notes: null,
  });
  aliceMeasurement = m.id;
});

afterAll(async () => {
  await db.delete(users).where(eq(users.id, alice));
  await db.delete(users).where(eq(users.id, bob));
});

describe("otorisasi anak", () => {
  it("Bob tidak dapat membaca anak milik Alice", async () => {
    expect(await getChild(bob, aliceChild)).toBeUndefined();
    expect(await assertChildOwned(bob, aliceChild)).toBe(false);
    expect(await assertChildOwned(alice, aliceChild)).toBe(true);
  });

  it("daftar anak Bob kosong meski database berisi anak Alice", async () => {
    expect(await listChildren(bob)).toHaveLength(0);
    expect(await listChildren(alice)).toHaveLength(1);
  });

  it("Bob tidak dapat mengubah anak milik Alice", async () => {
    const result = await updateChild(bob, aliceChild, {
      name: "Diretas",
      sex: "MALE",
      dateOfBirth: "2026-01-15",
      birthType: "TERM",
      gestationalAgeWeeks: null,
      gestationalAgeDays: null,
    });
    expect(result).toBeUndefined();
    expect((await getChild(alice, aliceChild))?.name).toBe("Aisyah");
  });

  it("Bob tidak dapat menghapus anak milik Alice", async () => {
    expect(await deleteChild(bob, aliceChild)).toBeUndefined();
    expect(await getChild(alice, aliceChild)).toBeDefined();
  });
});

describe("otorisasi pengukuran", () => {
  it("Bob tidak dapat membaca pengukuran milik Alice", async () => {
    expect(await getMeasurement(bob, aliceMeasurement)).toBeUndefined();
    expect(await getMeasurement(alice, aliceMeasurement)).toBeDefined();
    expect(await listMeasurements(bob, aliceChild)).toHaveLength(0);
  });

  it("Bob tidak dapat mengubah atau menghapus pengukuran milik Alice", async () => {
    const values = {
      measuredAt: "2026-08-22",
      weightKg: "99.000",
      lengthHeightCm: null,
      headCircumferenceCm: null,
      notes: null,
    };
    expect(await updateMeasurement(bob, aliceMeasurement, values)).toBeUndefined();
    expect(await deleteMeasurement(bob, aliceMeasurement)).toBeUndefined();

    const still = await getMeasurement(alice, aliceMeasurement);
    expect(still?.weightKg).toBe("6.800");
  });
});

describe("integritas data", () => {
  it("menyimpan desimal tanpa kehilangan presisi", async () => {
    const m = await getMeasurement(alice, aliceMeasurement);
    expect(m?.weightKg).toBe("6.800");
    expect(m?.lengthHeightCm).toBe("65.20");
  });

  it("menyimpan minggu dan hari gestasi terpisah", async () => {
    const child = await getChild(alice, aliceChild);
    expect(child?.gestationalAgeWeeks).toBe(32);
    expect(child?.gestationalAgeDays).toBe(4);
  });

  it("pengukuran baru tidak menimpa yang lama", async () => {
    await insertMeasurement(aliceChild, {
      measuredAt: "2026-08-29",
      weightKg: "7.000",
      lengthHeightCm: null,
      headCircumferenceCm: null,
      notes: null,
    });
    const rows = await listMeasurements(alice, aliceChild, "desc");
    expect(rows).toHaveLength(2);
    expect(rows[0].measuredAt).toBe("2026-08-29");
    expect(rows[1].weightKg).toBe("6.800");
  });

  it("kartu dashboard memakai pengukuran terbaru", async () => {
    const [row] = await listChildrenWithLatestMeasurement(alice);
    expect(row.latestMeasuredAt).toBe("2026-08-29");
    expect(row.latestWeightKg).toBe("7.000");
  });

  it("menolak gestational age tidak konsisten di level database", async () => {
    await expect(
      insertChild(alice, {
        name: "Invalid",
        sex: "MALE",
        dateOfBirth: "2026-01-01",
        birthType: "PRETERM",
        gestationalAgeWeeks: null,
        gestationalAgeDays: null,
      }),
    ).rejects.toThrow();
  });

  it("menolak berat nol di level database", async () => {
    await expect(
      insertMeasurement(aliceChild, {
        measuredAt: "2026-09-01",
        weightKg: "0.000",
        lengthHeightCm: null,
        headCircumferenceCm: null,
        notes: null,
      }),
    ).rejects.toThrow();
  });

  it("menghapus anak ikut menghapus pengukurannya (cascade)", async () => {
    const tmp = await insertChild(alice, {
      name: "Sementara",
      sex: "MALE",
      dateOfBirth: "2026-01-01",
      birthType: "TERM",
      gestationalAgeWeeks: null,
      gestationalAgeDays: null,
    });
    const m = await insertMeasurement(tmp.id, {
      measuredAt: "2026-02-01",
      weightKg: "4.000",
      lengthHeightCm: null,
      headCircumferenceCm: null,
      notes: null,
    });
    await deleteChild(alice, tmp.id);
    expect(await getMeasurement(alice, m.id)).toBeUndefined();
  });
});
