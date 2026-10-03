"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { isIOS, isStandalone, useHydrated } from "@/lib/platform";
import { currentSubscription, disablePush, enablePush, pushSupported } from "@/lib/push-client";

/**
 * Menyalakan pemberitahuan di HP — tombol penuh di halaman Pemberitahuan.
 * Ajakan ringkasnya ada di `PushPrompt`; urutan izin + langganannya milik
 * `lib/push-client.ts`, bukan salah satu dari keduanya.
 *
 * Di iOS, Web Push hanya ada setelah aplikasinya dipasang ke Layar Utama — di
 * Safari biasa `PushManager` tidak ada sama sekali, jadi yang ditampilkan bukan
 * tombol mati melainkan petunjuk memasang. Tanpa kunci VAPID komponennya
 * menghilang alih-alih menawarkan tombol yang pasti gagal.
 */

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

  const supported = hydrated && pushSupported();

  useEffect(() => {
    if (!supported) return;
    // Kebenarannya ada di browser, bukan di DB: langganan bisa dicabut dari setelan
    // sistem tanpa aplikasi ini pernah tahu. `subscribed` hanya nilai awal server.
    void currentSubscription()
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
    const res = await enablePush();
    setBusy(false);

    if (res.ok) {
      setHasSub(true);
      toast.success("Pemberitahuan aktif di perangkat ini.");
    } else if (res.reason === "denied") setDenied(true);
    else if (res.reason === "error") toast.error(res.message);
  };

  const disable = async () => {
    setBusy(true);
    const done = await disablePush();
    setBusy(false);

    if (!done) {
      toast.error("Gagal mematikan pemberitahuan.");
      return;
    }
    setHasSub(false);
    toast.success("Pemberitahuan dimatikan di perangkat ini.");
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
