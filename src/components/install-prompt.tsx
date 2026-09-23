"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Ajakan memasang aplikasi.
 *
 * Hanya muncul ketika browser benar-benar menawarkan pemasangan lewat
 * `beforeinstallprompt`. Bila pengguna menutupnya, pilihan itu diingat di
 * localStorage agar tidak mengganggu setiap kali membuka aplikasi.
 *
 * Safari/iOS tidak mendukung event ini; di sana pemasangan dilakukan lewat
 * menu Bagikan, dan petunjuknya ada di halaman Profil.
 */

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "tk-install-dismissed";

export function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      // Mode privat dapat memblokir localStorage; anggap belum pernah ditutup.
    }
    if (dismissed) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setEvent(null));

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!event) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Tidak masalah bila tidak dapat disimpan — ajakan hanya muncul lagi nanti.
    }
    setEvent(null);
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Pasang aplikasi</p>
          <p className="text-muted-foreground text-xs">
            Buka langsung dari layar utama, tanpa membuka browser.
          </p>
        </div>
        <Button
          size="sm"
          onClick={async () => {
            await event.prompt();
            await event.userChoice;
            setEvent(null);
          }}
        >
          <Download className="size-4" aria-hidden />
          Pasang
        </Button>
        <Button variant="ghost" size="icon" onClick={dismiss} aria-label="Tutup ajakan pasang">
          <X className="size-4" aria-hidden />
        </Button>
      </CardContent>
    </Card>
  );
}
