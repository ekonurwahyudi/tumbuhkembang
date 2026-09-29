/**
 * Integration test lapisan data: memastikan tidak ada jalur yang membocorkan
 * atau mengubah data anak milik user lain. Berjalan di database sungguhan.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { childShares, users } from "@/db/schema";
import {
  assertChildAccessible,
  assertChildOwned,
  deleteChild,
  acceptShare,
  findShareByToken,
  getChild,
  getChildForViewer,
  insertChild,
  listChildren,
  listChildrenForViewer,
  listChildrenWithLatestMeasurement,
  setChildPhotoKey,
  updateChild,
  upsertShare,
} from "@/lib/data/children";
import {
  deleteMeasurement,
  getMeasurement,
  insertMeasurement,
  listMeasurements,
  updateMeasurement,
} from "@/lib/data/measurements";
import {
  deleteFeedingLog,
  getFeedingLog,
  insertFeedingLog,
  listFeedingLogs,
  updateFeedingLog,
} from "@/lib/data/feeding";
import {
  listSkippedCatalogKeys,
  skipVaccination,
  unskipVaccination,
} from "@/lib/data/vaccination-skips";
import {
  deleteReminder,
  getReminder,
  listReminders,
  upsertReminder,
} from "@/lib/data/vaccine-reminders";

import {
  MAX_ITEM_PHOTOS,
  addRegistryItemPhoto,
  claimItem,
  deleteRegistryItem,
  ensureRegistryToken,
  findClaimByToken,
  findPublicChildPhotoKey,
  findPublicItem,
  findPublicItemPhotoKey,
  findPublicRegistry,
  getRegistryItem,
  getRegistryItemWithClaims,
  insertRegistryItem,
  listPublicChildren,
  listPublicItems,
  listRegistryClaims,
  listRegistryItems,
  registryClaimCount,
  registrySummary,
  remainingQty,
  removeRegistryItemPhoto,
  setRegistryPublic,
  updateClaimTracking,
  updateRegistryItem,
} from "@/lib/data/registry";

import {
  adminDeleteChild,
  adminDeleteParent,
  adminGetChild,
  adminListParents,
  adminStats,
} from "@/lib/data/admin";

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let alice: string;
let bob: string;
let carol: string;
let aliceChild: string;
let aliceMeasurement: string;
let aliceFeeding: string;

beforeAll(async () => {
  const [a] = await db
    .insert(users)
    .values({ name: "Alice", email: `alice-${suffix}@test.local`, passwordHash: "x" })
    .returning();
  const [b] = await db
    .insert(users)
    .values({ name: "Bob", email: `bob-${suffix}@test.local`, passwordHash: "x" })
    .returning();
  const [c] = await db
    .insert(users)
    .values({
      name: "Carol",
      email: `carol-${suffix}@test.local`,
      passwordHash: "x",
      role: "SUPERADMIN",
    })
    .returning();
  alice = a.id;
  bob = b.id;
  carol = c.id;

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

  const f = await insertFeedingLog(aliceChild, {
    feedingType: "FORMULA",
    amountMl: "90.0",
    fedAt: new Date("2026-08-22T09:00:00"),
    notes: null,
  });
  aliceFeeding = f.id;
});

afterAll(async () => {
  await db.delete(users).where(eq(users.id, alice));
  await db.delete(users).where(eq(users.id, bob));
  await db.delete(users).where(eq(users.id, carol));
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

describe("otorisasi catatan asupan", () => {
  it("Bob tidak dapat membaca catatan asupan milik Alice", async () => {
    expect(await getFeedingLog(bob, aliceFeeding)).toBeUndefined();
    expect(await getFeedingLog(alice, aliceFeeding)).toBeDefined();
    expect(await listFeedingLogs(bob, aliceChild)).toHaveLength(0);
    expect((await listFeedingLogs(alice, aliceChild)).length).toBeGreaterThan(0);
  });

  it("Bob tidak dapat mengubah atau menghapus catatan asupan milik Alice", async () => {
    const values = {
      feedingType: "FORMULA" as const,
      amountMl: "999.0",
      fedAt: new Date("2026-08-22T09:00:00"),
      notes: "diretas",
    };
    expect(await updateFeedingLog(bob, aliceFeeding, values)).toBeUndefined();
    expect(await deleteFeedingLog(bob, aliceFeeding)).toBeUndefined();

    const still = await getFeedingLog(alice, aliceFeeding);
    expect(still?.amountMl).toBe("90.0");
    expect(still?.notes).toBeNull();
  });

  it("menyimpan ASI langsung tanpa volume", async () => {
    const row = await insertFeedingLog(aliceChild, {
      feedingType: "BREAST_DIRECT",
      amountMl: null,
      fedAt: new Date("2026-08-22T06:30:00"),
      notes: null,
    });
    expect(row.amountMl).toBeNull();
  });

  it("menolak volume nol di level database", async () => {
    await expect(
      insertFeedingLog(aliceChild, {
        feedingType: "FORMULA",
        amountMl: "0.0",
        fedAt: new Date("2026-08-22T12:00:00"),
        notes: null,
      }),
    ).rejects.toThrow();
  });

  it("menghapus anak ikut menghapus catatan asupannya (cascade)", async () => {
    const tmp = await insertChild(alice, {
      name: "Sementara Asupan",
      sex: "MALE",
      dateOfBirth: "2026-01-01",
      birthType: "TERM",
      gestationalAgeWeeks: null,
      gestationalAgeDays: null,
    });
    const f = await insertFeedingLog(tmp.id, {
      feedingType: "FORMULA",
      amountMl: "80.0",
      fedAt: new Date("2026-02-01T10:00:00"),
      notes: null,
    });
    await deleteChild(alice, tmp.id);
    expect(await getFeedingLog(alice, f.id)).toBeUndefined();
  });
});

describe("otorisasi vaccination_skips", () => {
  it("Bob tidak dapat melihat atau membatalkan skip milik Alice", async () => {
    await skipVaccination(aliceChild, "BCG");
    expect(await listSkippedCatalogKeys(bob, aliceChild)).toHaveLength(0);
    expect(await listSkippedCatalogKeys(alice, aliceChild)).toContain("BCG");

    expect(await unskipVaccination(bob, aliceChild, "BCG")).toBe(false);
    expect(await listSkippedCatalogKeys(alice, aliceChild)).toContain("BCG");

    expect(await unskipVaccination(alice, aliceChild, "BCG")).toBe(true);
    expect(await listSkippedCatalogKeys(alice, aliceChild)).not.toContain("BCG");
  });

  it("menghapus anak ikut menghapus skip-nya (cascade)", async () => {
    const tmp = await insertChild(alice, {
      name: "Sementara Skip",
      sex: "MALE",
      dateOfBirth: "2026-01-01",
      birthType: "TERM",
      gestationalAgeWeeks: null,
      gestationalAgeDays: null,
    });
    await skipVaccination(tmp.id, "OPV1");
    await deleteChild(alice, tmp.id);
    expect(await listSkippedCatalogKeys(alice, tmp.id)).toHaveLength(0);
  });
});

describe("otorisasi vaccine_reminders", () => {
  it("Bob tidak dapat membaca atau menghapus pengingat milik Alice", async () => {
    const r = await upsertReminder(aliceChild, {
      catalogKey: "BCG",
      remindOn: "2026-12-01",
      remindTime: "09:00",
      notes: null,
    });

    expect(await listReminders(bob, aliceChild)).toHaveLength(0);
    expect(await getReminder(bob, r.id)).toBeUndefined();
    expect(await deleteReminder(bob, r.id)).toBeUndefined();

    // Milik sendiri tetap terbaca — bukan sekadar query yang selalu kosong.
    expect(await getReminder(alice, r.id)).toBeDefined();
    expect(await deleteReminder(alice, r.id)).toBeDefined();
  });

  it("partner yang sudah menerima share ikut melihat pengingat", async () => {
    // Email Bob dibaca dari DB, bukan ditimpa: describe share di bawah memakainya.
    const [row] = await db.select({ email: users.email }).from(users).where(eq(users.id, bob));
    const email = row.email;
    const share = await upsertShare({ childId: aliceChild, ownerId: alice, inviteeEmail: email });
    await acceptShare(share.id, bob, email);

    const r = await upsertReminder(aliceChild, {
      catalogKey: "HEPB0",
      remindOn: "2026-12-02",
      remindTime: "10:30",
      notes: null,
    });
    expect((await listReminders(bob, aliceChild)).some((x) => x.id === r.id)).toBe(true);

    // Share dibersihkan: test lain di berkas ini mengandaikan Bob bukan partner.
    await deleteReminder(alice, r.id);
    await db.delete(childShares).where(eq(childShares.id, share.id));
  });

  it("menjadwal ulang vaksin yang sama mengganti, bukan menumpuk", async () => {
    await upsertReminder(aliceChild, {
      catalogKey: "OPV1",
      remindOn: "2026-12-01",
      remindTime: "09:00",
      notes: null,
    });
    const second = await upsertReminder(aliceChild, {
      catalogKey: "OPV1",
      remindOn: "2026-12-10",
      remindTime: "14:00",
      notes: "Posyandu",
    });
    const mine = (await listReminders(alice, aliceChild)).filter((x) => x.catalogKey === "OPV1");
    expect(mine).toHaveLength(1);
    expect(mine[0].id).toBe(second.id);
    expect(mine[0].remindOn).toBe("2026-12-10");
    await deleteReminder(alice, second.id);
  });
});

describe("integritas berat lahir", () => {
  it("menolak berat lahir di luar rentang di level database", async () => {
    await expect(
      insertChild(alice, {
        name: "Berat Invalid",
        sex: "MALE",
        dateOfBirth: "2026-01-01",
        birthType: "TERM",
        gestationalAgeWeeks: null,
        gestationalAgeDays: null,
        birthWeightGrams: 100,
      }),
    ).rejects.toThrow();
  });
});

describe("akses pasangan (share)", () => {
  const bobEmail = `bob-${suffix}@test.local`;

  it("sebelum diterima, Bob tetap tidak punya akses", async () => {
    const share = await upsertShare({
      childId: aliceChild,
      ownerId: alice,
      inviteeEmail: bobEmail,
    });
    expect(share.status).toBe("PENDING");
    expect(await findShareByToken(share.token)).toBeDefined();
    expect(await getChildForViewer(bob, aliceChild)).toBeUndefined();
    expect(await assertChildAccessible(bob, aliceChild)).toBe(false);
    expect(
      (await listChildrenForViewer(bob)).some(({ child }) => child.id === aliceChild),
    ).toBe(false);
  });

  it("setelah diterima, Bob melihat dan mencatat, tapi tetap bukan pemilik", async () => {
    const share = await upsertShare({
      childId: aliceChild,
      ownerId: alice,
      inviteeEmail: bobEmail,
    });
    await acceptShare(share.id, bob, bobEmail);

    const viewer = await getChildForViewer(bob, aliceChild);
    expect(viewer?.role).toBe("PARTNER");
    expect(await assertChildAccessible(bob, aliceChild)).toBe(true);
    expect(await assertChildOwned(bob, aliceChild)).toBe(false);
    expect(
      (await listChildrenForViewer(bob)).some(({ child }) => child.id === aliceChild),
    ).toBe(true);

    // Jalur catat terbuka untuk partner.
    const m = await insertMeasurement(aliceChild, {
      measuredAt: "2026-09-05",
      weightKg: "7.200",
      lengthHeightCm: null,
      headCircumferenceCm: null,
      notes: null,
    });
    expect((await listMeasurements(bob, aliceChild)).some((r) => r.id === m.id)).toBe(true);

    // Mutasi profil anak tetap owner-only.
    expect(await deleteChild(bob, aliceChild)).toBeUndefined();
    expect(await updateChild(bob, aliceChild, {
      name: "Diretas",
      sex: "MALE",
      dateOfBirth: "2026-01-15",
      birthType: "TERM",
      gestationalAgeWeeks: null,
      gestationalAgeDays: null,
    })).toBeUndefined();
  });

  it("undangan kedaluwarsa dan email salah tidak diterima", async () => {
    const share = await upsertShare({
      childId: aliceChild,
      ownerId: alice,
      inviteeEmail: bobEmail,
    });
    // Email tidak cocok: acceptShare tidak mengubah apa pun.
    expect(await acceptShare(share.id, bob, "bukan-bob@test.local")).toBeUndefined();

    // Kedaluwarsa: share dianggap tidak ada oleh findShareByToken.
    await db
      .update(childShares)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(childShares.id, share.id));
    expect(await findShareByToken(share.token)).toBeUndefined();
    expect(await acceptShare(share.id, bob, bobEmail)).toBeUndefined();
  });
});

/**
 * Sisi sebaliknya dari berkas ini: di sini bypass-nya memang diharapkan terjadi. Modul
 * src/lib/data/admin.ts sengaja tak ber-scope — yang diuji adalah bahwa ia memang
 * melihat data user lain, sementara jalur owner-only di blok-blok di atas tetap tertutup.
 */
describe("otorisasi superadmin", () => {
  it("carol tercatat sebagai SUPERADMIN, alice tidak", async () => {
    const rows = await adminListParents(suffix);
    expect(rows.find((r) => r.id === carol)?.role).toBe("SUPERADMIN");
    expect(rows.find((r) => r.id === alice)?.role).toBe("USER");
  });

  it("menghitung jumlah orang tua dan anak terdaftar", async () => {
    // Angkanya tumbuh seiring data test lain; yang diuji batas bawahnya.
    const stats = await adminStats();
    expect(stats.parents).toBeGreaterThanOrEqual(3);
    expect(stats.children).toBeGreaterThanOrEqual(1);
  });

  it("daftar orang tua memuat semua akun, kotak cari mempersempitnya", async () => {
    const all = await adminListParents(suffix);
    expect(all.map((r) => r.id)).toEqual(expect.arrayContaining([alice, bob, carol]));
    expect(all.find((r) => r.id === alice)?.childCount).toBeGreaterThanOrEqual(1);

    const onlyAlice = await adminListParents(`alice-${suffix}`);
    expect(onlyAlice.map((r) => r.id)).toEqual([alice]);
  });

  it("admin membaca anak milik alice, jalur owner-only tetap menolak", async () => {
    const row = await adminGetChild(aliceChild);
    expect(row?.child.name).toBe("Aisyah");
    expect(row?.ownerName).toBe("Alice");
    // Kontras yang bikin test ini ada artinya.
    expect(await getChild(bob, aliceChild)).toBeUndefined();
  });

  it("admin menghapus anak milik orang lain", async () => {
    const tmp = await insertChild(alice, {
      name: "Sementara Admin",
      sex: "MALE",
      dateOfBirth: "2026-01-01",
      birthType: "TERM",
      gestationalAgeWeeks: null,
      gestationalAgeDays: null,
    });
    expect(await adminDeleteChild(tmp.id)).toMatchObject({ id: tmp.id });
    expect(await adminGetChild(tmp.id)).toBeUndefined();
    expect(await getChild(alice, tmp.id)).toBeUndefined();
  });

  it("akun baru selalu berperan USER — tidak ada jalur eskalasi lewat insert", async () => {
    // adminCreateParentAction tidak pernah menulis kolom role; default kolomnya yang
    // menentukan. Bila default itu berubah, admin bisa terbuat tanpa grant-admin.ts.
    const [row] = await db
      .insert(users)
      .values({ name: "Baru", email: `baru-${suffix}@test.local`, passwordHash: "x" })
      .returning({ id: users.id, role: users.role });
    expect(row.role).toBe("USER");
    await db.delete(users).where(eq(users.id, row.id));
  });

  it("menghapus orang tua ikut menghapus anak dan pengukurannya (cascade)", async () => {
    const [dave] = await db
      .insert(users)
      .values({ name: "Dave", email: `dave-${suffix}@test.local`, passwordHash: "x" })
      .returning();
    const child = await insertChild(dave.id, {
      name: "Anak Dave",
      sex: "FEMALE",
      dateOfBirth: "2026-03-01",
      birthType: "TERM",
      gestationalAgeWeeks: null,
      gestationalAgeDays: null,
    });
    const m = await insertMeasurement(child.id, {
      measuredAt: "2026-04-01",
      weightKg: "5.000",
      lengthHeightCm: null,
      headCircumferenceCm: null,
      notes: null,
    });

    expect(await adminDeleteParent(dave.id)).toMatchObject({ id: dave.id });
    expect(await adminGetChild(child.id)).toBeUndefined();
    expect(await getMeasurement(dave.id, m.id)).toBeUndefined();
    expect((await adminListParents(`dave-${suffix}`)).length).toBe(0);
  });
});

describe("registry publik", () => {
  const baseItem = {
    name: "Stroller kabin",
    description: null,
    priority: "NORMAL" as const,
    category: "TRANSPORT" as const,
    priceMinIdr: null,
    priceMaxIdr: null,
    desiredQty: 1,
    allowGroup: false,
    isPublic: true,
    note: null,
    urlShopee: null,
    urlTokopedia: null,
    urlTiktok: null,
    childId: null,
  };

  it("barang Alice tidak terbaca oleh Bob, terbaca oleh Alice", async () => {
    const item = await insertRegistryItem(alice, baseItem);
    expect(await getRegistryItem(bob, item.id)).toBeUndefined();
    expect(await getRegistryItem(alice, item.id)).toMatchObject({ id: item.id });
    expect(await listRegistryItems(bob)).toHaveLength(0);

    // Jalur tulis juga, bukan hanya baca.
    expect(await updateRegistryItem(bob, item.id, { ...baseItem, name: "Dibajak" })).toBeUndefined();
    expect(await deleteRegistryItem(bob, item.id)).toBeUndefined();
    expect(await addRegistryItemPhoto(bob, item.id, "registry/x/1.webp")).toBeUndefined();
    expect(await removeRegistryItemPhoto(bob, item.id, null)).toBeUndefined();
    expect(await getRegistryItem(alice, item.id)).toMatchObject({ name: "Stroller kabin" });

    expect(await deleteRegistryItem(alice, item.id)).toMatchObject({ id: item.id });
  });

  it("tautan publik mati sebelum dibagikan dan setelah dimatikan lagi", async () => {
    const token = await ensureRegistryToken(alice);
    expect(token).toBeTruthy();
    expect(await findPublicRegistry(token!)).toBeUndefined();

    await setRegistryPublic(alice, true);
    expect(await findPublicRegistry(token!)).toMatchObject({ userId: alice, ownerName: "Alice" });

    await setRegistryPublic(alice, false);
    expect(await findPublicRegistry(token!)).toBeUndefined();

    // Idempoten: token lama dipakai ulang supaya tautan yang sudah disebar tetap hidup.
    expect(await ensureRegistryToken(alice)).toBe(token);
  });

  it("listPublicItems menyembunyikan barang privat, listRegistryItems memuatnya", async () => {
    const open = await insertRegistryItem(alice, baseItem);
    const hidden = await insertRegistryItem(alice, { ...baseItem, name: "Rahasia", isPublic: false });

    const mine = await listRegistryItems(alice);
    expect(mine.map((r) => r.item.id)).toEqual(expect.arrayContaining([open.id, hidden.id]));

    const publicRows = await listPublicItems(alice);
    expect(publicRows.map((r) => r.item.id)).toContain(open.id);
    expect(publicRows.map((r) => r.item.id)).not.toContain(hidden.id);

    await deleteRegistryItem(alice, open.id);
    await deleteRegistryItem(alice, hidden.id);
  });

  it("foto barang privat tidak terjangkau lewat token publik", async () => {
    const token = await ensureRegistryToken(alice);
    await setRegistryPublic(alice, true);

    const open = await insertRegistryItem(alice, baseItem);
    const hidden = await insertRegistryItem(alice, { ...baseItem, isPublic: false });
    await addRegistryItemPhoto(alice, open.id, "registry/open/1.webp");
    await addRegistryItemPhoto(alice, open.id, "registry/open/2.webp");
    await addRegistryItemPhoto(alice, hidden.id, "registry/hidden/1.webp");

    expect(await findPublicItemPhotoKey(token!, open.id)).toBe("registry/open/1.webp");
    expect(await findPublicItemPhotoKey(token!, open.id, 1)).toBe("registry/open/2.webp");
    // Indeks di luar rentang ikut undefined, jadi jumlah foto tidak bisa diraba.
    expect(await findPublicItemPhotoKey(token!, open.id, 2)).toBeUndefined();
    expect(await findPublicItemPhotoKey(token!, hidden.id)).toBeUndefined();
    expect(await findPublicItemPhotoKey("token-asing", open.id)).toBeUndefined();

    await setRegistryPublic(alice, false);
    expect(await findPublicItemPhotoKey(token!, open.id)).toBeUndefined();

    await deleteRegistryItem(alice, open.id);
    await deleteRegistryItem(alice, hidden.id);
  });

  it("kuota foto per barang ditegakkan, hapus bisa per key atau semuanya", async () => {
    const item = await insertRegistryItem(alice, baseItem);

    for (let i = 0; i < MAX_ITEM_PHOTOS; i++)
      expect(await addRegistryItemPhoto(alice, item.id, `registry/a/${i}.webp`)).toMatchObject({
        keys: expect.objectContaining({ length: i + 1 }),
      });

    expect(await addRegistryItemPhoto(alice, item.id, "registry/a/lebih.webp")).toEqual({
      full: true,
    });

    // Satu key saja: yang lain tetap ada, urutannya tidak berubah.
    expect(await removeRegistryItemPhoto(alice, item.id, "registry/a/0.webp")).toEqual({
      removed: ["registry/a/0.webp"],
    });
    expect((await getRegistryItem(alice, item.id))?.photoKeys).toEqual([
      "registry/a/1.webp",
      "registry/a/2.webp",
      "registry/a/3.webp",
      "registry/a/4.webp",
    ]);

    // Kuota kosong lagi setelah satu dihapus.
    expect(await addRegistryItemPhoto(alice, item.id, "registry/a/baru.webp")).toMatchObject({
      keys: expect.objectContaining({ length: MAX_ITEM_PHOTOS }),
    });

    // null = semuanya, dan key R2-nya dikembalikan supaya objeknya ikut dihapus.
    const all = await removeRegistryItemPhoto(alice, item.id, null);
    expect(all?.removed).toHaveLength(MAX_ITEM_PHOTOS);
    expect((await getRegistryItem(alice, item.id))?.photoKeys).toEqual([]);

    await deleteRegistryItem(alice, item.id);
  });

  it("klaim menolak token asing, barang privat, dan jumlah melebihi kuota", async () => {
    const token = await ensureRegistryToken(alice);
    await setRegistryPublic(alice, true);

    const item = await insertRegistryItem(alice, {
      ...baseItem,
      name: "Pack diapers",
      desiredQty: 3,
      allowGroup: true,
    });
    const hidden = await insertRegistryItem(alice, { ...baseItem, isPublic: false });

    const values = { claimerName: "Tante Rina", qty: 1, message: null, trackingNumber: null };
    expect(await claimItem("token-asing", item.id, values)).toBeUndefined();
    expect(await claimItem(token!, hidden.id, values)).toBeUndefined();
    expect(await claimItem(token!, item.id, { ...values, qty: 4 })).toEqual({ over: 3 });

    const first = await claimItem(token!, item.id, values);
    expect(first).toHaveProperty("claim");

    // Inti guard transaksional: dua klaim berurutan yang totalnya melebihi kuota.
    expect(await claimItem(token!, item.id, { ...values, qty: 3 })).toEqual({ over: 2 });
    expect(await claimItem(token!, item.id, { ...values, qty: 2 })).toHaveProperty("claim");
    expect(await claimItem(token!, item.id, values)).toEqual({ over: 0 });

    const [row] = await listPublicItems(alice).then((r) => r.filter((x) => x.item.id === item.id));
    expect(row.claimedQty).toBe(3);
    expect(remainingQty(row)).toBe(0);

    await deleteRegistryItem(alice, item.id);
    await deleteRegistryItem(alice, hidden.id);
    await setRegistryPublic(alice, false);
  });

  it("tanpa patungan, klaim kedua ditolak walau jumlah diinginkan lebih dari satu", async () => {
    const token = await ensureRegistryToken(alice);
    await setRegistryPublic(alice, true);

    const item = await insertRegistryItem(alice, { ...baseItem, desiredQty: 2, allowGroup: false });
    const values = { claimerName: "Om Budi", qty: 1, message: null, trackingNumber: null };

    const first = await claimItem(token!, item.id, values);
    expect(first).toHaveProperty("claim");
    // Pengklaim tunggal mengambil seluruh kuota, bukan sebagian.
    if (first && "claim" in first) expect(first.claim.qty).toBe(2);
    expect(await claimItem(token!, item.id, values)).toEqual({ over: 0 });

    await deleteRegistryItem(alice, item.id);
    await setRegistryPublic(alice, false);
  });

  it("nomor resi hanya bisa diubah dengan claim_token yang benar", async () => {
    const token = await ensureRegistryToken(alice);
    await setRegistryPublic(alice, true);

    const item = await insertRegistryItem(alice, baseItem);
    const res = await claimItem(token!, item.id, {
      claimerName: "Nenek",
      qty: 1,
      message: "Semoga bermanfaat",
      trackingNumber: null,
    });
    if (!res || !("claim" in res)) throw new Error("klaim gagal dibuat");
    const claimToken = res.claim.claimToken;

    expect(await updateClaimTracking("token-asing", "JNE 1")).toBeUndefined();
    expect(await updateClaimTracking(claimToken, "JNE 123")).toMatchObject({
      trackingNumber: "JNE 123",
    });

    const ctx = await findClaimByToken(claimToken);
    expect(ctx).toMatchObject({ itemName: baseItem.name, registryToken: token });
    expect(await findClaimByToken("token-asing")).toBeUndefined();

    // Orang tua melihat klaimnya; Bob tidak.
    expect((await listRegistryClaims(alice)).map((c) => c.id)).toContain(res.claim.id);
    expect(await listRegistryClaims(bob)).toHaveLength(0);
    expect(await registryClaimCount(bob)).toBe(0);

    // Menghapus barang ikut menghapus klaimnya (cascade).
    await deleteRegistryItem(alice, item.id);
    expect(await findClaimByToken(claimToken)).toBeUndefined();
    expect((await listRegistryClaims(alice)).map((c) => c.id)).not.toContain(res.claim.id);

    await setRegistryPublic(alice, false);
  });

  it("menghapus anak hanya meng-NULL-kan child_id, barangnya tetap ada", async () => {
    const child = await insertChild(alice, {
      name: "Anak Registry",
      sex: "MALE",
      dateOfBirth: "2026-02-01",
      birthType: "TERM",
      gestationalAgeWeeks: null,
      gestationalAgeDays: null,
    });
    const item = await insertRegistryItem(alice, { ...baseItem, childId: child.id });
    expect(await getRegistryItem(alice, item.id)).toMatchObject({ childId: child.id });

    await deleteChild(alice, child.id);
    expect(await getRegistryItem(alice, item.id)).toMatchObject({ id: item.id, childId: null });

    await deleteRegistryItem(alice, item.id);
  });

  it("ringkasan memisahkan yang sudah dihadiahi dari yang masih menunggu", async () => {
    const token = await ensureRegistryToken(alice);
    await setRegistryPublic(alice, true);

    const done = await insertRegistryItem(alice, { ...baseItem, name: "Sudah" });
    const waiting = await insertRegistryItem(alice, { ...baseItem, name: "Menunggu" });
    await claimItem(token!, done.id, {
      claimerName: "Tetangga",
      qty: 1,
      message: null,
      trackingNumber: null,
    });

    const summary = registrySummary(await listRegistryItems(alice));
    expect(summary.listed).toBe(2);
    expect(summary.gifted).toBe(1);
    expect(summary.waiting).toBe(1);

    await deleteRegistryItem(alice, done.id);
    await deleteRegistryItem(alice, waiting.id);
    await setRegistryPublic(alice, false);
  });

  it("detail berklaim milik Alice tidak terbaca oleh Bob", async () => {
    const token = await ensureRegistryToken(alice);
    await setRegistryPublic(alice, true);

    const item = await insertRegistryItem(alice, baseItem);
    await claimItem(token!, item.id, {
      claimerName: "Bude Sri",
      qty: 1,
      message: "Titip ya",
      trackingNumber: null,
    });

    expect(await getRegistryItemWithClaims(bob, item.id)).toBeUndefined();
    const mine = await getRegistryItemWithClaims(alice, item.id);
    expect(mine?.item.id).toBe(item.id);
    expect(mine?.claims.map((c) => c.claimerName)).toEqual(["Bude Sri"]);

    await deleteRegistryItem(alice, item.id);
    await setRegistryPublic(alice, false);
  });

  it("findPublicItem menolak barang privat, registry privat, dan token asing", async () => {
    const token = await ensureRegistryToken(alice);

    const open = await insertRegistryItem(alice, baseItem);
    const hidden = await insertRegistryItem(alice, { ...baseItem, isPublic: false });

    // Registry belum dibagikan: bahkan barang publik belum terbaca.
    expect(await findPublicItem(token!, open.id)).toBeUndefined();

    await setRegistryPublic(alice, true);
    expect((await findPublicItem(token!, open.id))?.row.item.id).toBe(open.id);
    expect(await findPublicItem(token!, hidden.id)).toBeUndefined();
    expect(await findPublicItem("token-asing", open.id)).toBeUndefined();

    await setRegistryPublic(alice, false);
    expect(await findPublicItem(token!, open.id)).toBeUndefined();

    await deleteRegistryItem(alice, open.id);
    await deleteRegistryItem(alice, hidden.id);
  });

  it("anak hanya tampil di sisi publik bila punya barang publik", async () => {
    const token = await ensureRegistryToken(alice);
    const child = await insertChild(alice, {
      name: "Rafa",
      sex: "MALE",
      dateOfBirth: "2026-03-10",
      birthType: "TERM",
      gestationalAgeWeeks: null,
      gestationalAgeDays: null,
    });
    await setChildPhotoKey(alice, child.id, "children/rafa/1.webp");

    const hidden = await insertRegistryItem(alice, {
      ...baseItem,
      isPublic: false,
      childId: child.id,
    });

    // Registry belum dibagikan.
    expect(await listPublicChildren(token!)).toHaveLength(0);
    expect(await findPublicChildPhotoKey(token!, child.id)).toBeUndefined();

    await setRegistryPublic(alice, true);
    // Dibagikan, tapi satu-satunya barang anak ini privat: tetap tak terlihat.
    expect(await listPublicChildren(token!)).toHaveLength(0);
    expect(await findPublicChildPhotoKey(token!, child.id)).toBeUndefined();

    const open = await insertRegistryItem(alice, { ...baseItem, childId: child.id });
    expect((await listPublicChildren(token!)).map((c) => c.id)).toEqual([child.id]);
    expect(await findPublicChildPhotoKey(token!, child.id)).toBe("children/rafa/1.webp");

    // Anak Bob tidak bisa diraih dengan token Alice.
    const bobChild = await insertChild(bob, {
      name: "Anak Bob",
      sex: "MALE",
      dateOfBirth: "2026-03-10",
      birthType: "TERM",
      gestationalAgeWeeks: null,
      gestationalAgeDays: null,
    });
    expect(await findPublicChildPhotoKey(token!, bobChild.id)).toBeUndefined();

    await setRegistryPublic(alice, false);
    expect(await listPublicChildren(token!)).toHaveLength(0);
    expect(await findPublicChildPhotoKey(token!, child.id)).toBeUndefined();

    await deleteRegistryItem(alice, open.id);
    await deleteRegistryItem(alice, hidden.id);
    await deleteChild(alice, child.id);
    await deleteChild(bob, bobChild.id);
  });
});
