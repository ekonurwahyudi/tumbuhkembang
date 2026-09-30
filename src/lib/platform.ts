"use client";

import { useSyncExternalStore } from "react";

/**
 * Deteksi platform sisi klien, untuk dua hal saja: memilih petunjuk pemasangan yang
 * benar, dan tahu apakah Web Push mungkin di perangkat ini.
 *
 * User-agent sniffing memang rapuh, tapi tidak ada penggantinya di sini: cara
 * memasang PWA berbeda per sistem operasi dan tidak ada API yang menanyakannya.
 * Salah tebak hanya berarti petunjuk yang kurang pas — bukan fitur yang rusak,
 * dan bukan keputusan keamanan.
 *
 * Semuanya mengembalikan false di server: `navigator` tidak ada di sana, dan
 * komponen yang memakainya menghitung ulang setelah terpasang di browser.
 */

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ memakai UA Macintosh; layar sentuh yang membedakannya dari Mac.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/.test(navigator.userAgent);
}

/*
  Fungsi-fungsi di atas membaca `navigator`, jadi hasilnya berbeda antara render
  server dan render browser. Membaca langsung saat render akan memicu hydration
  mismatch; menyalinnya ke state di dalam efek dilarang aturan
  react-hooks/set-state-in-effect. `useHydrated` adalah jalan ketiga: satu nilai
  yang false di server dan true setelah terpasang, jadi platform dapat DIHITUNG
  saat render alih-alih disimpan.
*/
const noSubscribe = () => () => {};

/** false selama render server dan render pertama; true sesudah terhidrasi. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
}

/** true bila aplikasi dibuka dari ikon Layar Utama, bukan di dalam tab browser. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari iOS tidak mendukung display-mode; ia punya propertinya sendiri.
    (navigator as { standalone?: boolean }).standalone === true
  );
}
