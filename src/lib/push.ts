import "server-only";
import webpush from "web-push";
import {
  addNotification,
  deleteDeadSubscription,
  listSubscriptions,
  type NewNotification,
} from "@/lib/data/notifications";

/**
 * Pengiriman Web Push.
 *
 * VAPID adalah identitas server di mata push service (FCM, Mozilla, Apple). Kunci
 * publiknya ikut ke browser saat berlangganan; yang privat tidak pernah keluar dari
 * server. Bila env-nya belum diisi, fitur push dianggap nonaktif — pemberitahuan
 * tetap tersimpan dan tetap terlihat di lonceng, hanya tidak sampai ke HP.
 * Pola yang sama dipakai `photoStorageReady()` untuk R2.
 *
 * Kunci dibuat sekali dengan:
 *   npx web-push generate-vapid-keys
 * lalu diisikan ke NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.
 */

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
// Apple menolak push tanpa subject yang sah; mailto: milik pengelola sudah cukup.
const SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@tumbuhkembang.app";

let configured = false;

export function pushReady(): boolean {
  if (!PUBLIC_KEY || !PRIVATE_KEY) return false;
  if (!configured) {
    webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
    configured = true;
  }
  return true;
}

/**
 * Simpan pemberitahuan lalu kirimkan ke setiap perangkat pemiliknya.
 *
 * Push-nya sengaja tidak pernah menggagalkan pemanggilnya: klaim kado yang sudah
 * tersimpan tidak boleh dibatalkan hanya karena HP orang tuanya sedang mati. Bila
 * `dedupeKey`-nya sudah pernah masuk, tidak ada baris baru dan tidak ada push —
 * itulah yang menahan pengingat vaksin berbunyi berulang kali.
 */
export async function notify(userId: string, n: NewNotification): Promise<boolean> {
  const row = await addNotification(userId, n);
  if (!row) return false;

  if (!pushReady()) return true;

  const subs = await listSubscriptions(userId);
  if (subs.length === 0) return true;

  /*
    Payload sengaja ringkas dan sudah jadi: service worker tidak boleh mengambil
    data anak dari jaringan untuk menampilkannya, dan isinya juga muncul di layar
    kunci — jadi hanya yang memang perlu dibaca di sana yang dikirim.
  */
  const payload = JSON.stringify({
    title: n.title,
    body: n.body,
    url: n.url ?? "/dashboard",
    tag: n.dedupeKey ?? row.id,
  });

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
      } catch (err) {
        // 404/410 = langganan mati (aplikasi dicopot, izin dicabut). Dibersihkan.
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await deleteDeadSubscription(s.endpoint);
        else console.error("[push]", code ?? err);
      }
    }),
  );

  return true;
}
