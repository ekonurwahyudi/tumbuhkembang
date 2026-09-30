import "server-only";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  notifications,
  pushSubscriptions,
  type Notification,
  type NotificationKind,
} from "@/db/schema";

/**
 * Pemberitahuan selalu di-query dengan `userId` di WHERE, sama seperti keluarga
 * data lain di aplikasi ini — tidak pernah `WHERE id = ?` sendirian. Satu baris
 * memuat nama pengklaim dan nama anak, jadi baris milik orang lain tidak boleh
 * terbaca hanya karena id-nya ditebak.
 */

export type NewNotification = {
  kind: NotificationKind;
  title: string;
  body: string;
  url: string | null;
  /** Kunci kejadian; baris dengan kunci sama untuk user yang sama tidak diulang. */
  dedupeKey?: string;
};

export async function listNotifications(userId: string, limit = 30): Promise<Notification[]> {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function unreadCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row?.n ?? 0;
}

/**
 * Menyimpan satu pemberitahuan. Mengembalikan `undefined` bila `dedupeKey`-nya
 * sudah pernah masuk — pemanggil memakai itu untuk memutuskan kirim push atau
 * tidak, sehingga jadwal vaksin yang sama tidak membunyikan HP tiap muat halaman.
 *
 * Baris tanpa `dedupeKey` selalu masuk: klaim kado memang boleh berulang, tiap
 * klaim adalah kejadian yang berbeda.
 */
export async function addNotification(
  userId: string,
  n: NewNotification,
): Promise<Notification | undefined> {
  const [row] = await db
    .insert(notifications)
    .values({ ...n, userId, dedupeKey: n.dedupeKey ?? null })
    .onConflictDoNothing({ target: [notifications.userId, notifications.dedupeKey] })
    .returning();
  return row;
}

/** Menandai semua terbaca sekaligus — lonceng dibuka sebagai satu daftar, bukan satu per satu. */
export async function markAllRead(userId: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}

export async function deleteNotification(userId: string, id: string) {
  const [row] = await db
    .delete(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .returning({ id: notifications.id });
  return row;
}

/* ---------- Langganan push ---------- */

export type PushKeys = { endpoint: string; p256dh: string; auth: string };

/**
 * Endpoint unik global per browser, jadi konflik berarti perangkat yang sama
 * mendaftar ulang — kuncinya diperbarui dan kepemilikannya dipindah ke akun yang
 * sedang login. Itu memang yang benar di HP bersama: langganan mengikuti orang
 * yang terakhir memasangnya, bukan menumpuk untuk akun sebelumnya.
 */
export async function saveSubscription(userId: string, keys: PushKeys) {
  await db
    .insert(pushSubscriptions)
    .values({ ...keys, userId })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId, p256dh: keys.p256dh, auth: keys.auth },
    });
}

export async function deleteSubscription(userId: string, endpoint: string) {
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, userId)));
}

export async function listSubscriptions(userId: string) {
  return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
}

/**
 * Dipanggil saat push service menjawab 404/410: langganannya mati dan tidak akan
 * hidup lagi. Tanpa `userId` — pengirimnya adalah server sendiri, bukan sesi, dan
 * endpoint sudah unik global.
 */
export async function deleteDeadSubscription(endpoint: string) {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

export async function hasSubscription(userId: string): Promise<boolean> {
  const rows = await listSubscriptions(userId);
  return rows.length > 0;
}
