"use client";

import { useEffect } from "react";

/** Daftarkan service worker hanya di production — di dev ia mengganggu HMR. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    /*
     * Di dev: cabut pendaftaran yang tertinggal dari build production pada origin
     * yang sama (localhost:3000). Pendaftaran itu bertahan lintas sesi, dan sw.js
     * menyajikan /_next/static cache-first — sedangkan nama chunk dev bisa dipakai
     * ulang dengan isi berbeda, sehingga browser mendapat chunk basi ("module
     * factory is not available") yang tidak hilang dengan hard-reload.
     */
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then(async (registrations) => {
          if (registrations.length === 0) return;
          await Promise.all(registrations.map((r) => r.unregister()));
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
          // Halaman ini sudah terlanjur memuat chunk dari cache lama.
          location.reload();
        })
        .catch(() => {});
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
