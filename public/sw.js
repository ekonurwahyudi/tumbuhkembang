/**
 * Service worker minimal.
 *
 * Strategi sengaja konservatif: HANYA aset statis yang di-cache. Halaman dan
 * respons Server Action tidak pernah masuk cache karena berisi data anak —
 * data sensitif tidak boleh tertinggal di disk perangkat bersama, dan tidak
 * boleh tampil ke akun lain yang login setelahnya.
 *
 * Mutasi offline (antrean tulis) belum diaktifkan: strategi konflik/sync-nya
 * harus ditentukan lebih dulu.
 */
const CACHE = "tk-static-v1";
const OFFLINE_URL = "/offline.html";

const PRECACHE = [OFFLINE_URL, "/icons/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** Aset build Next & ikon — immutable, aman di-cache. */
const isStaticAsset = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/icons/") ||
  url.pathname === "/manifest.webmanifest";

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isStaticAsset(url)) {
    // Cache-first: nama file build sudah ber-hash.
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Navigasi: selalu ke jaringan. Bila offline, tampilkan shell offline —
  // bukan halaman berisi data anak dari cache.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
  }
});
