"use client";

import { useTransition } from "react";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";

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
      <Icon name="logout" className="text-[18px]" />
      {pending ? "Keluar..." : "Keluar"}
    </Button>
  );
}

/**
 * Versi untuk dropdown. `onSelect` harus dipasang di sini, bukan di pemanggil:
 * AppHeader adalah server component dan tidak boleh mengoper event handler.
 * preventDefault menahan menu agar tidak tertutup sebelum aksi keluar berjalan.
 */
export function LogoutMenuItem() {
  return (
    <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
      <LogoutButton variant="ghost" className="h-auto w-full justify-start px-2 py-1.5 font-normal" />
    </DropdownMenuItem>
  );
}
