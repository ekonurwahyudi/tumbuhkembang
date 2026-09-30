"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  deleteNotification,
  deleteSubscription,
  markAllRead,
  saveSubscription,
} from "@/lib/data/notifications";
import { fail, handleUnexpected, ok, type ActionResult } from "@/lib/action-result";

/**
 * Langganan push datang dari `PushSubscription.toJSON()` di browser, jadi bentuknya
 * tetap divalidasi di server — apa pun yang menyeberang dari klien diperlakukan
 * sebagai masukan asing, bukan karena browser-nya nakal melainkan karena batas
 * kepercayaannya ada di sini.
 *
 * Endpoint dibatasi https: push service mana pun memakai https, dan skema lain di
 * kolom ini tidak ada gunanya.
 */
const subscriptionSchema = z.object({
  endpoint: z.string().url().startsWith("https://").max(1000),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(200),
  }),
});

export async function subscribePushAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = subscriptionSchema.safeParse(raw);
    if (!parsed.success) return fail("VALIDATION_ERROR", "Langganan tidak valid.");

    const { endpoint, keys } = parsed.data;
    await saveSubscription(user.id, { endpoint, p256dh: keys.p256dh, auth: keys.auth });
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("subscribePushAction", err);
  }
}

export async function unsubscribePushAction(endpoint: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await deleteSubscription(user.id, endpoint);
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("unsubscribePushAction", err);
  }
}

export async function markAllReadAction(): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await markAllRead(user.id);
    revalidatePath("/notifikasi");
    revalidatePath("/dashboard");
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("markAllReadAction", err);
  }
}

export async function deleteNotificationAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const row = await deleteNotification(user.id, id);
    if (!row) return fail("NOT_FOUND", "Pemberitahuan tidak ditemukan.");
    revalidatePath("/notifikasi");
    revalidatePath("/dashboard");
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("deleteNotificationAction", err);
  }
}
