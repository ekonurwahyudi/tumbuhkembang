"use client";

import { subscribePushAction, unsubscribePushAction } from "@/lib/actions/notifications";

/**
 * Sisi browser dari Web Push: meminta izin dan mendaftarkan langganan. Pasangannya
 * `lib/push.ts` yang `server-only` dan mengirimkan notifikasinya — dua berkas
 * karena dua lingkungan, bukan karena dua fitur.
 *
 * Ada di sini supaya urutannya tidak disalin dua kali: `requestPermission()` lalu
 * `pushManager.subscribe()` lalu simpan ke server. Satu saja yang terlewat berarti
 * langganan yang tidak pernah dikirimi apa pun.
 *
 * Tiga kenyataan platform yang membentuk berkas ini:
 *
 * 1. Izin notifikasi HANYA boleh diminta dari gestur pengguna. Memanggil
 *    `enablePush()` saat halaman dimuat membuat Chrome menolaknya diam-diam —
 *    jadi pemanggilnya wajib sebuah tombol, bukan efek.
 * 2. Di iOS, Web Push baru ada sejak 16.4 DAN hanya setelah aplikasinya dipasang
 *    ke Layar Utama. Di Safari biasa `PushManager` tidak ada sama sekali.
 * 3. Kunci VAPID publik wajib ada. Tanpa env-nya, langganan tidak mungkin dibuat.
 */

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * base64url → Uint8Array; bentuk yang diminta `applicationServerKey`.
 *
 * Tipe `Uint8Array<ArrayBuffer>` ditulis eksplisit: `Uint8Array.from` menghasilkan
 * `ArrayBufferLike`, yang tidak diterima `BufferSource`.
 */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Perangkat ini bisa berlangganan push sama sekali. Panggil setelah terhidrasi. */
export function pushSupported(): boolean {
  return (
    Boolean(VAPID) &&
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    typeof window !== "undefined" &&
    "PushManager" in window
  );
}

/** Langganan di browser ini. Kebenarannya di browser, bukan di DB. */
export async function currentSubscription(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export type EnableResult =
  | { ok: true }
  /** Izinnya ditolak — tidak bisa diminta lagi, harus lewat setelan situs. */
  | { ok: false; reason: "denied" }
  /** Ditutup tanpa memilih; menanyakan lagi nanti masih boleh. */
  | { ok: false; reason: "dismissed" }
  | { ok: false; reason: "error"; message: string };

/**
 * Minta izin lalu daftarkan langganannya. WAJIB dipanggil dari penangan klik.
 *
 * Langganan yang sudah ada dipakai ulang alih-alih dibuat baru: `subscribe()`
 * dua kali dengan kunci yang sama akan melempar, dan endpoint lama tetap sah.
 */
export async function enablePush(): Promise<EnableResult> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted")
      return { ok: false, reason: permission === "denied" ? "denied" : "dismissed" };

    const reg = await navigator.serviceWorker.ready;
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        // Wajib true di semua browser modern: push diam-diam tidak diizinkan lagi.
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID!),
      }));

    const res = await subscribePushAction(sub.toJSON());
    if (!res.success) return { ok: false, reason: "error", message: res.error.message };
    return { ok: true };
  } catch {
    return {
      ok: false,
      reason: "error",
      message: "Gagal mengaktifkan pemberitahuan di perangkat ini.",
    };
  }
}

/** Cabut langganan browser ini. Baris servernya dihapus dulu, lalu langganannya. */
export async function disablePush(): Promise<boolean> {
  try {
    const sub = await currentSubscription();
    if (sub) {
      await unsubscribePushAction(sub.endpoint);
      await sub.unsubscribe();
    }
    return true;
  } catch {
    return false;
  }
}
