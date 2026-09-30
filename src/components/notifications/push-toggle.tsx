"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { subscribePushAction, unsubscribePushAction } from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { isIOS, isStandalone, useHydrated } from "@/lib/platform";

/**
 * Menyalakan pemberitahuan di HP.
 *
 * Tiga kenyataan platform yang membentuk komponen ini:
 *
 * 1. Izin notifikasi HANYA boleh diminta dari gestur pengguna. Meminta saat halaman
 *    dimuat membuat Chrome menolaknya diam-diam — jadi ini tombol, bukan efek.
 * 2. Di iOS, Web Push baru ada sejak 16.4 DAN hanya setelah aplikasinya dipasang ke
 *    Layar Utama. Di Safari biasa `PushManager` tidak ada sama sekali, jadi yang
 *    ditampilkan bukan tombol mati melainkan petunjuk memasang.
 * 3. Kunci VAPID publik wajib ada. Tanpa env-nya, langganan tidak mungkin dibuat —
 *    komponennya menghilang alih-alih menawarkan tombol yang pasti gagal.
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

type State = "loading" | "unsupported" | "ios-needs-install" | "off" | "on" | "blocked";

export function PushToggle({ subscribed }: { subscribed: boolean }) {
  const hydrated = useHydrated();
  const [busy, setBusy] = useState(false);
  /*
    Hanya dua hal yang benar-benar butuh state: apakah browser ini punya langganan
    (jawabannya async), dan apakah izinnya baru saja ditolak. Sisanya dihitung saat
    render — menyalin fakta sinkron ke state di dalam efek dilarang aturan
    react-hooks/set-state-in-effect, dan memang tidak perlu.
  */
  const [hasSub, setHasSub] = useState<boolean | null>(null);
  const [denied, setDenied] = useState(false);

  const supported =
    hydrated &&
    Boolean(VAPID) &&
    "serviceWorker" in navigator &&
    typeof window !== "undefined" &&
    "PushManager" in window;

  useEffect(() => {
    if (!supported) return;
    // Kebenarannya ada di browser, bukan di DB: langganan bisa dicabut dari setelan
    // sistem tanpa aplikasi ini pernah tahu. `subscribed` hanya nilai awal server.
    void navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setHasSub(sub !== null))
      .catch(() => setHasSub(subscribed));
  }, [supported, subscribed]);

  /*
    iOS tanpa PushManager berarti salah satu dari dua hal: belum dipasang ke Layar
    Utama, atau iOS-nya di bawah 16.4. Keduanya dijawab dengan petunjuk memasang —
    versi lama tidak bisa dibedakan dari sini, dan memasangnya tetap langkah pertama
    yang benar bagi keduanya.
  */
  const state: State = !hydrated
    ? "loading"
    : !supported
      ? isIOS() && !isStandalone()
        ? "ios-needs-install"
        : "unsupported"
      : denied || Notification.permission === "denied"
        ? "blocked"
        : hasSub === null
          ? "loading"
          : hasSub
            ? "on"
            : "off";

  const enable = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        if (permission === "denied") setDenied(true);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          // Wajib true di semua browser modern: push diam-diam tidak diizinkan lagi.
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID!),
        }));

      const res = await subscribePushAction(sub.toJSON());
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      setHasSub(true);
      toast.success("Pemberitahuan aktif di perangkat ini.");
    } catch {
      toast.error("Gagal mengaktifkan pemberitahuan di perangkat ini.");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribePushAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setHasSub(false);
      toast.success("Pemberitahuan dimatikan di perangkat ini.");
    } catch {
      toast.error("Gagal mematikan pemberitahuan.");
    } finally {
      setBusy(false);
    }
  };

  if (state === "loading" || state === "unsupported") return null;

  return (
    <div className="bg-card flex items-start gap-3 rounded-2xl border p-4 shadow-sm">
      <span className="bg-accent text-primary grid size-10 shrink-0 place-items-center rounded-full">
        <Icon name="notifications" filled className="text-[20px]" />
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <p className="text-body-md font-bold">Pemberitahuan di HP</p>
          <p className="text-muted-foreground text-body-sm">
            {state === "ios-needs-install"
              ? "Pasang aplikasi ini ke Layar Utama dulu — iPhone hanya mengizinkan pemberitahuan untuk aplikasi yang sudah terpasang."
              : state === "blocked"
                ? "Pemberitahuan diblokir di setelan browser. Izinkan dari setelan situs, lalu buka halaman ini lagi."
                : state === "on"
                  ? "Aktif di perangkat ini. Kami mengabari saat kado diklaim dan jadwal vaksin mendekat."
                  : "Dapatkan kabar saat kado diklaim dan saat jadwal vaksin si kecil mendekat."}
          </p>
        </div>

        {state === "off" && (
          <Button type="button" size="sm" disabled={busy} onClick={enable}>
            <Icon name="notifications" className="text-[16px]" />
            {busy ? "Menyiapkan..." : "Aktifkan"}
          </Button>
        )}
        {state === "on" && (
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={disable}>
            <Icon name="close" className="text-[16px]" />
            Matikan
          </Button>
        )}
      </div>
    </div>
  );
}
