"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

/**
 * Tombol keluar yang membersihkan cache service worker sebelum sesi diakhiri.
 *
 * Tanpa ini, aset yang di-cache tetap tertinggal di perangkat setelah logout.
 * Cache kita hanya berisi aset statis publik, tetapi pada perangkat bersama
 * lebih baik tidak meninggalkan jejak sama sekali.
 */
/** Batas tunggu agar logout tidak pernah tertahan oleh service worker. */
const CLEAR_TIMEOUT_MS = 1500;

/**
 * Minta service worker menghapus cache-nya, lalu tunggu konfirmasi.
 *
 * Menunggu itu penting: tanpa balasan, navigasi logout memutus halaman sebelum
 * service worker sempat menyelesaikan penghapusan. Kegagalan apa pun diabaikan —
 * pembersihan cache tidak boleh menghalangi pengguna keluar.
 */
async function clearServiceWorkerCaches(): Promise<void> {
  try {
    const controller = navigator.serviceWorker?.controller;
    if (!controller) return;

    await new Promise<void>((resolve) => {
      const channel = new MessageChannel();
      const timer = setTimeout(resolve, CLEAR_TIMEOUT_MS);
      channel.port1.onmessage = () => {
        clearTimeout(timer);
        resolve();
      };
      controller.postMessage({ type: "CLEAR_CACHES" }, [channel.port2]);
    });
  } catch {
    // Mode privat atau browser tanpa service worker — abaikan.
  }
}

export function LogoutButton({
  variant = "outline",
  className,
}: {
  variant?: "outline" | "ghost";
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      disabled={pending}
      aria-busy={pending}
      onClick={() =>
        startTransition(async () => {
          await clearServiceWorkerCaches();
          await logoutAction();
        })
      }
    >
      <LogOut className="size-4" aria-hidden />
      {pending ? "Keluar..." : "Keluar"}
    </Button>
  );
}
