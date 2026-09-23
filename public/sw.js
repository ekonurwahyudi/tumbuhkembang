/**
 * Service worker.
 *
 * Strategi sengaja konservatif: HANYA aset statis yang di-cache. Halaman,
 * respons Server Action, dan seluruh permintaan yang membawa data anak tidak
 * pernah masuk cache. Data kesehatan anak tidak boleh tertinggal di disk
 * perangkat bersama, dan tidak boleh tampil ke akun lain yang login setelahnya.
 *
 * Mutasi offline (antrean tulis) belum diaktifkan: strategi konflik/sync-nya
 * harus ditentukan lebih dulu sebelum catatan medis boleh ditulis tanpa jaringan.
 */
const VERSION = "v2";
const CACHE = `tk-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE = [
  OFFLINE_URL,
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // Satu aset gagal tidak boleh menggagalkan seluruh instalasi.
      .then((c) => Promise.allSettled(PRECACHE.map((url) => c.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/**
 * Aset yang aman di-cache: berkas build Next (nama ber-hash, immutable),
 * ikon, dan manifest. Semuanya publik dan tidak memuat data pengguna.
 */
function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/apple-icon.png" ||
    url.pathname === "/icon.png"
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Hanya GET. Mutasi selalu ke jaringan.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Endpoint autentikasi tidak pernah disentuh service worker.
  if (url.pathname.startsWith("/api/")) return;

  if (isStaticAsset(url)) {
    // Cache-first: nama berkas build sudah ber-hash, jadi isinya tidak berubah.
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((res) => {
            if (res.ok && res.type === "basic") {
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
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(OFFLINE_URL);
        return (
          cached ??
          new Response("Anda sedang offline.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      }),
    );
  }
});

/**
 * Bersihkan seluruh cache saat logout. Halaman mengirim pesan ini sebelum
 * sesi diakhiri, sehingga tidak ada jejak yang tertinggal di perangkat bersama.
 *
 * Balasan dikirim lewat MessageChannel agar halaman dapat MENUNGGU sampai
 * pembersihan benar-benar selesai. Tanpa itu, navigasi logout memutus halaman
 * sebelum service worker sempat menghapus cache.
 */
self.addEventListener("message", (event) => {
  if (event.data?.type !== "CLEAR_CACHES") return;

  const done = caches
    .keys()
    .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
    .then(() => event.ports[0]?.postMessage({ type: "CACHES_CLEARED" }))
    .catch(() => event.ports[0]?.postMessage({ type: "CACHES_CLEAR_FAILED" }));

  event.waitUntil(done);
});
