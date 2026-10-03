"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { isIOS, isStandalone, useHydrated } from "@/lib/platform";
import { currentSubscription, enablePush, pushSupported } from "@/lib/push-client";

/**
 * Ajakan menyalakan pemberitahuan di beranda, sebentuk dengan `InstallPrompt`.
 *
 * Ada karena tombolnya sebelumnya cuma di halaman Pemberitahuan — halaman yang
 * orang tua tidak punya alasan membuka sebelum ada notifikasi pertamanya, yang
 * justru tidak akan pernah datang kalau izinnya belum diberikan. Jadi di beranda,
 * satu kali, bisa ditutup.
 *
 * Yang TIDAK dilakukan: memanggil `Notification.requestPermission()` sendiri saat
 * muncul. Izin hanya boleh diminta dari gestur — dan dialog sistem yang menyembul
 * tanpa diminta adalah cara tercepat orang menekan "Blokir", yang tidak bisa
 * ditarik lagi dari dalam aplikasi.
 *
 * Yang melihatnya: perangkat yang MAMPU push, belum berlangganan, dan belum
 * menolak. Di iPhone sebelum dipasang ke Layar Utama, `PushManager` tidak ada —
 * di sana `InstallPrompt` yang bicara, dan komponen ini diam supaya beranda tidak
 * menampilkan dua ajakan sekaligus.
 */

const DISMISSED_KEY = "tk-push-dismissed";

function storedDismiss(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    // Mode privat dapat memblokir localStorage; anggap belum pernah ditutup.
    return false;
  }
}

export function PushPrompt({ subscribed }: { subscribed: boolean }) {
  const hydrated = useHydrated();
  const [busy, setBusy] = useState(false);
  const [closed, setClosed] = useState(false);
  /*
    Hanya satu hal yang benar-benar butuh state: apakah browser ini sudah punya
    langganan — jawabannya async. Sisanya dihitung saat render; `useHydrated()`
    menahannya sampai `navigator` ada, jadi tidak ada hydration mismatch.
  */
  const [hasSub, setHasSub] = useState<boolean | null>(null);

  const supported = hydrated && pushSupported();

  useEffect(() => {
    if (!supported) return;
    void currentSubscription()
      .then((sub) => setHasSub(sub !== null))
      .catch(() => setHasSub(subscribed));
  }, [supported, subscribed]);

  const show =
    supported &&
    !closed &&
    hasSub === false &&
    // Sudah pernah ditolak: dialognya tidak akan muncul lagi, jadi tombol di sini
    // tidak berguna. Petunjuk membuka blokirnya ada di halaman Pemberitahuan.
    Notification.permission !== "denied" &&
    !storedDismiss() &&
    // iPhone di dalam tab belum bisa push sama sekali — InstallPrompt dulu.
    !(isIOS() && !isStandalone());

  if (!show) return null;

  const close = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Tidak masalah bila tidak dapat disimpan — ajakan hanya muncul lagi nanti.
    }
    setClosed(true);
  };

  const enable = async () => {
    setBusy(true);
    const res = await enablePush();
    setBusy(false);

    if (res.ok) {
      setHasSub(true);
      toast.success("Pemberitahuan aktif di perangkat ini.");
      return;
    }
    // Ditolak permanen: ajakannya tidak perlu muncul lagi, dan menampilkan galat
    // untuk pilihan yang sah ("nanti saja") hanya memarahi orang.
    if (res.reason === "denied") close();
    else if (res.reason === "error") toast.error(res.message);
  };

  return (
    <section
      aria-label="Aktifkan pemberitahuan"
      className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-[var(--color-sky-tint)] to-[var(--color-sky-tint)]/40 p-3.5 text-[var(--color-accent-foreground)] shadow-sm sm:flex-row sm:items-center"
    >
      <span className="bg-card/80 text-primary grid size-11 shrink-0 place-items-center rounded-2xl shadow-sm">
        <Icon name="notifications" filled className="text-[22px]" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-body-md font-bold">Aktifkan pemberitahuan</p>
        <p className="text-body-sm opacity-80">
          Kami mengabari lewat HP saat jadwal vaksin si kecil mendekat dan saat kado diklaim.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Button type="button" size="sm" disabled={busy} onClick={enable} className="shadow-sm">
          <Icon name="notifications" className="text-[16px]" />
          {busy ? "Menyiapkan..." : "Izinkan"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={close}
          aria-label="Tutup ajakan pemberitahuan"
        >
          <Icon name="close" className="text-[18px]" />
        </Button>
      </div>
    </section>
  );
}
