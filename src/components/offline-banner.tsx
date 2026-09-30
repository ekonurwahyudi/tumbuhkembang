"use client";

import { useOffline } from "next/offline";
import { Icon } from "@/components/ui/icon";

/**
 * Pita "tanpa koneksi" untuk seluruh halaman dashboard.
 *
 * useOffline lebih dapat dipercaya daripada navigator.onLine: ia juga menyala
 * ketika fetch kerangka gagal, jadi WiFi yang tersambung tapi tanpa internet
 * (captive portal, DNS mati) ikut terdeteksi. Ia mengembalikan false saat render
 * server dan sebelum hidrasi selesai, jadi tidak ada ketidakcocokan hidrasi dan
 * useHydrated() tidak diperlukan di sini.
 *
 * Kalimatnya menjanjikan apa yang benar-benar terjadi: experimental.useOffline
 * di next.config.ts menahan server action yang gagal lalu menjalankannya sendiri
 * saat koneksi kembali. Yang tidak dijanjikan: bertahan setelah aplikasi ditutup.
 */
export function OfflineBanner() {
  if (!useOffline()) return null;

  return (
    <div
      role="status"
      className="bg-accent text-accent-foreground text-body-sm flex items-start gap-2 px-4 py-2.5"
    >
      {/* Ikonnya hiasan — teksnya yang membawa maknanya, jadi warna bukan
          satu-satunya penanda. cloud_off tidak ada di subset font ikon. */}
      <Icon name="sync" aria-hidden className="mt-0.5 shrink-0 text-[18px]" />
      <span>
        <span className="font-bold">Tanpa koneksi.</span> Catatan yang kamu simpan akan terkirim
        otomatis begitu internet kembali — biarkan halaman ini tetap terbuka.
      </span>
    </div>
  );
}
