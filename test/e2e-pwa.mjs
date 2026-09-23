/**
 * Smoke test PWA di browser sungguhan.
 *
 * Yang diuji adalah perilaku, bukan sekadar keberadaan berkas: service worker
 * benar-benar aktif, aset statis tersaji saat offline, halaman berisi data anak
 * TIDAK tersaji dari cache saat offline, dan cache bersih setelah logout.
 *
 * Jalankan terhadap server produksi yang sudah hidup:
 *   npm run build && npm run start
 *   npm run test:e2e:pwa
 */
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const EMAIL = "demo@tumbuhkembang.local";
const PASS = "Demo1234";

const fail = [];
const check = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
  if (!cond) fail.push(name);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

// ---- Manifest ----
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });

const manifest = await page.evaluate(async () => {
  const link = document.querySelector('link[rel="manifest"]');
  if (!link) return null;
  const res = await fetch(link.getAttribute("href"));
  return res.json();
});

check("manifest tertaut dan terbaca", manifest !== null);
if (manifest) {
  check("punya id agar identitas aplikasi stabil", typeof manifest.id === "string");
  check("display standalone", manifest.display === "standalone");
  check("start_url mengarah ke dashboard", manifest.start_url === "/dashboard");
  check("nama dan nama pendek ada", !!manifest.name && !!manifest.short_name);

  const sizes = (manifest.icons ?? []).map((i) => i.sizes);
  check("ikon 192 dan 512 tersedia", sizes.includes("192x192") && sizes.includes("512x512"));
  check(
    "ikon maskable tersedia",
    (manifest.icons ?? []).some((i) => (i.purpose ?? "").includes("maskable")),
  );
}

// Ikon benar-benar dapat diambil, bukan hanya terdaftar di manifest.
for (const path of ["/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable-512.png"]) {
  const ok = await page.evaluate(
    (p) => fetch(p).then((r) => r.ok && r.headers.get("content-type")?.includes("png")),
    path,
  );
  check(`ikon tersaji: ${path}`, !!ok);
}

// ---- Meta tag pemasangan ----
const meta = await page.evaluate(() => ({
  themeColor: document.querySelector('meta[name="theme-color"]')?.content,
  capable: document.querySelector('meta[name="mobile-web-app-capable"]')?.content,
  appleTitle: document.querySelector('meta[name="apple-mobile-web-app-title"]')?.content,
  appleIcon: !!document.querySelector('link[rel="apple-touch-icon"]'),
  lang: document.documentElement.lang,
}));
check("theme-color diset", !!meta.themeColor);
check("mobile-web-app-capable diset", meta.capable === "yes");
check("judul aplikasi iOS diset", !!meta.appleTitle);
check("apple-touch-icon tertaut", meta.appleIcon);
check("bahasa halaman Indonesia", meta.lang === "id");

// ---- Service worker ----
await page.waitForTimeout(2500);
const swState = await page.evaluate(async () => {
  const r = await navigator.serviceWorker.getRegistration();
  return r?.active?.state ?? r?.installing?.state ?? "tidak terdaftar";
});
check("service worker aktif", swState === "activated", swState);

// ---- Login lalu uji perilaku offline ----
await page.fill("#email", EMAIL);
await page.fill("#password", PASS);
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard", { timeout: 15000 });
await page.waitForTimeout(2000);

const dashboardOnline = await page.locator("body").textContent();
check("dashboard memuat data saat online", /Halo,/.test(dashboardOnline));

await ctx.setOffline(true);

// Aset statis harus tetap tersaji dari cache.
const iconOffline = await page.evaluate(() =>
  fetch("/icons/icon-192.png").then(
    (r) => r.ok,
    () => false,
  ),
);
check("aset statis tersaji saat offline", iconOffline);

// Navigasi saat offline harus menampilkan shell offline, BUKAN data anak.
await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" }).catch(() => {});
await page.waitForTimeout(1500);
const offlineBody = await page.locator("body").textContent();

check("shell offline tampil", /Anda sedang offline/i.test(offlineBody), offlineBody.slice(0, 60));
check(
  "data anak TIDAK tersaji dari cache saat offline",
  !/Aisyah/.test(offlineBody) && !/Halo,/.test(offlineBody),
);

await ctx.setOffline(false);

// ---- Cache dibersihkan saat logout ----
await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

/** Daftar URL yang tersimpan di seluruh cache. */
const cachedUrls = () =>
  page.evaluate(async () => {
    const names = await caches.keys();
    const all = await Promise.all(
      names.map(async (n) => (await (await caches.open(n)).keys()).map((r) => r.url)),
    );
    return all.flat();
  });

const before = await cachedUrls();
check("ada aset ter-cache sebelum keluar", before.length > 0, `${before.length} entri`);

await page.click('button:has-text("Keluar")');
await page.waitForURL("**/login", { timeout: 15000 });
await page.waitForTimeout(2500);

const after = await cachedUrls();

// Setelah navigasi ke halaman login, service worker memasang ulang precache-nya
// dan meng-cache aset build halaman itu. Keduanya publik dan tidak memuat data
// pengguna, jadi yang diperiksa adalah ISI cache, bukan jumlahnya: tidak boleh
// ada satu pun yang di luar daftar aset statis yang memang boleh di-cache.
const STATIC_ALLOWED = /\/(offline\.html|icons\/|_next\/static\/|manifest\.webmanifest|apple-icon\.png|icon\.png)/;
const sisaNonStatic = after.filter((u) => !STATIC_ALLOWED.test(u));

check(
  "tidak ada jejak sesi tersisa setelah keluar",
  sisaNonStatic.length === 0,
  sisaNonStatic.slice(0, 2).join(" | "),
);
check(
  "cache mengecil setelah keluar",
  after.length < before.length,
  `${before.length} -> ${after.length} entri`,
);
check(
  "tidak ada respons halaman ter-cache",
  !after.some((u) => /\/(dashboard|children|settings|growth)/.test(u)),
);

check("tanpa error JavaScript", errors.length === 0, errors.slice(0, 2).join(" | "));

await browser.close();

console.log(fail.length ? `\n${fail.length} GAGAL: ${fail.join(", ")}` : "\nSEMUA LULUS");
process.exit(fail.length ? 1 : 0);
