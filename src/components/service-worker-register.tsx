"use client";

import { useEffect } from "react";

/** Daftarkan worker push di dev tanpa cache aset agar HMR tetap bekerja. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    /*
     * Di dev: ganti worker production lama dengan varian tanpa fetch/cache.
     * Worker lama dapat menyajikan chunk basi; bersihkan cache sebelum mendaftar.
     */
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistration().then(async (registration) => {
        if (registration && !registration.active?.scriptURL.includes("?dev")) {
          await registration.unregister();
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
          // Halaman ini mungkin sudah memuat chunk basi dari worker sebelumnya.
          location.reload();
          return;
        }
        await navigator.serviceWorker.register("/sw.js?dev=1");
      }).catch((err) => console.error("Service worker push gagal didaftarkan", err));
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker gagal didaftarkan", err);
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
