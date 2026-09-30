"use client";

import { useEffect, useState } from "react";
import { AndroidGlyph, AppleGlyph } from "@/components/brand-glyphs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { isAndroid, isIOS, isStandalone, useHydrated } from "@/lib/platform";

/**
 * Ajakan memasang aplikasi.
 *
 * Dua jalur, karena platformnya memang berbeda — bukan karena tampilannya dibedakan:
 *
 * - Android/Chrome memberi `beforeinstallprompt`, jadi pemasangannya satu ketukan.
 * - Safari/iOS tidak punya event itu sama sekali. Di sana pemasangan selalu lewat
 *   menu Bagikan, dan satu-satunya yang bisa dilakukan aplikasi adalah menunjukkan
 *   caranya. Karena itu cabang iOS hidup di LUAR penjaga `event` — kalau tidak, ia
 *   tidak akan pernah muncul di perangkat yang paling butuh petunjuknya.
 *
 * Yang sudah terpasang tidak melihat apa pun: `isStandalone()` menutup keduanya.
 * Pilihan menutup diingat di localStorage supaya tidak mengganggu tiap buka.
 */

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "tk-install-dismissed";

function storedDismiss(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    // Mode privat dapat memblokir localStorage; anggap belum pernah ditutup.
    return false;
  }
}

export function InstallPrompt() {
  const hydrated = useHydrated();
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [closed, setClosed] = useState(false);
  const [howTo, setHowTo] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    const onInstalled = () => setEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  /*
    Platform dan pilihan menutup DIHITUNG saat render, bukan disalin ke state di
    dalam efek: `useHydrated()` menahannya sampai `navigator` ada, jadi tidak ada
    hydration mismatch dan tidak ada setState di dalam efek.

    Yang layak ditampilkan: browser menawarkan pemasangan, ATAU ini iPhone/iPad yang
    memang tidak pernah menawarkan tapi tetap bisa dipasang manual. Desktop tanpa
    tawaran tidak melihat apa-apa — di sana aplikasi ini sudah nyaman di dalam tab.
  */
  const ios = hydrated && isIOS();
  const android = hydrated && isAndroid();
  const show =
    hydrated && !closed && !isStandalone() && !storedDismiss() && (event !== null || ios);
  if (!show) return null;

  const close = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Tidak masalah bila tidak dapat disimpan — ajakan hanya muncul lagi nanti.
    }
    setClosed(true);
  };

  const install = async () => {
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    setEvent(null);
  };

  return (
    <>
      {/*
        Bergradien seperti AgeBand di beranda, supaya terbaca sebagai ajakan dan
        bukan peringatan. Di HP tombolnya turun ke baris sendiri: "Pasang" beserta
        logonya tidak boleh terpotong di layar 360px.
      */}
      <section
        aria-label="Pasang aplikasi"
        className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-[var(--color-sky-tint)] to-[var(--color-sky-tint)]/40 p-3.5 text-[var(--color-accent-foreground)] shadow-sm sm:flex-row sm:items-center"
      >
        <span className="bg-card/80 grid size-11 shrink-0 place-items-center rounded-2xl shadow-sm">
          {ios ? <AppleGlyph className="size-6" /> : <AndroidGlyph className="size-6" />}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-body-md font-bold">
            Pasang di {ios ? "iPhone" : android ? "Android" : "perangkat ini"}
          </p>
          <p className="text-body-sm opacity-80">
            {ios
              ? "Lewat menu Bagikan → Tambahkan ke Layar Utama. Perlu juga agar notifikasi bisa aktif."
              : "Buka langsung dari layar utama, tanpa membuka browser."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            onClick={ios ? () => setHowTo(true) : install}
            className="shadow-sm"
          >
            {ios ? <AppleGlyph className="size-4" /> : <AndroidGlyph className="size-4" />}
            Pasang
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={close}
            aria-label="Tutup ajakan pasang"
          >
            <Icon name="close" className="text-[18px]" />
          </Button>
        </div>
      </section>

      {ios && <IosHowTo open={howTo} onClose={() => setHowTo(false)} />}
    </>
  );
}

/**
 * Petunjuk pemasangan iOS. Dialog, bukan halaman: langkahnya dilakukan DI browser
 * yang sedang terbuka, jadi berpindah halaman justru menjauhkan orang dari tombol
 * Bagikan yang harus ia tekan.
 */
function IosHowTo({ open, onClose }: { open: boolean; onClose: () => void }) {
  const steps = [
    "Ketuk tombol Bagikan di bilah bawah Safari (kotak dengan panah ke atas).",
    "Gulir ke bawah, pilih “Tambahkan ke Layar Utama”.",
    "Ketuk “Tambah” di pojok kanan atas.",
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <span className="bg-accent text-primary grid size-12 place-items-center rounded-2xl">
            <AppleGlyph className="size-6" />
          </span>
          <DialogTitle className="mt-2">Pasang di iPhone atau iPad</DialogTitle>
          <DialogDescription>
            Safari tidak punya tombol pasang otomatis, jadi langkahnya tiga ketukan lewat menu
            Bagikan.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-2.5">
          {steps.map((s, i) => (
            <li key={s} className="flex items-start gap-2.5">
              <span className="bg-accent text-primary text-label-sm grid size-6 shrink-0 place-items-center rounded-full font-bold tabular-nums">
                {i + 1}
              </span>
              <span className="text-body-sm">{s}</span>
            </li>
          ))}
        </ol>

        <p className="text-muted-foreground text-label-sm">
          Setelah terpasang, buka aplikasinya dari Layar Utama untuk mengaktifkan pemberitahuan.
        </p>

        <Button type="button" variant="outline" onClick={onClose}>
          Mengerti
        </Button>
      </DialogContent>
    </Dialog>
  );
}
