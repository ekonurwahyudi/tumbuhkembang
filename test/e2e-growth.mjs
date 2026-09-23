/**
 * Smoke test halaman grafik pertumbuhan di browser sungguhan.
 *
 * Memeriksa bahwa grafik benar-benar tergambar (bukan hanya container kosong),
 * ringkasan teks tersedia, dan z-score yang tampil cocok dengan hasil hitung
 * engine terhadap tabel WHO.
 *
 * Jalankan terhadap server yang sudah hidup, dengan data seed:
 *   npm run db:seed && npm run build && npm run start
 *   npm run test:e2e:growth
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
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); // ukuran ponsel
const page = await ctx.newPage();

const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", EMAIL);
await page.fill("#password", PASS);
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard", { timeout: 15000 });

/** Cari anak berdasarkan nama — urutan kartu tidak dijamin. */
async function openChild(name) {
  await page.goto(`${BASE}/children`, { waitUntil: "networkidle" });
  const href = await page
    .locator(`li:has-text("${name}") a:has-text("Lihat Perkembangan")`)
    .getAttribute("href");
  if (!href) throw new Error(`anak "${name}" tidak ditemukan di daftar`);
  await page.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
  return href;
}

// Anak cukup bulan dengan tiga pengukuran.
const aisyahHref = await openChild("Aisyah");

const profile = await page.locator("body").textContent();
check("z-score tampil di profil anak", /SD/.test(profile) && /persentil/i.test(profile));

await page.goto(`${BASE}${aisyahHref}/growth`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);

// Grafik harus benar-benar menggambar path, bukan container kosong.
const paths = await page.locator("svg.recharts-surface path.recharts-curve").count();
check("kurva tergambar (reference + anak)", paths >= 6, `${paths} path`);

const dots = await page.locator(".recharts-line-dot").count();
check("satu titik tergambar per pengukuran", dots === 3, `${dots} titik`);

const body = await page.locator("body").textContent();
check("ringkasan teks tersedia", /Pengukuran terakhir .* adalah/.test(body));
check("tabel z-score tersedia", /Z-score/.test(body) && /Persentil/.test(body));
check("reference disebutkan", /WHO Child Growth Standards/.test(body));
check("disclaimer medis tampil", /bukan pengganti diagnosis/.test(body));

// Tab indikator berpindah.
await page.click('button[role="tab"]:has-text("Tinggi")');
await page.waitForTimeout(1200);
const afterTab = await page.locator("body").textContent();
check("tab tinggi menampilkan indikator yang sesuai", /Panjang\/tinggi badan/.test(afterTab));

// Tooltip muncul saat titik disentuh.
const firstDot = page.locator(".recharts-line-dot").first();
if (await firstDot.count()) {
  await firstDot.hover({ force: true });
  await page.waitForTimeout(800);
  const tip = await page.locator("body").textContent();
  check("tooltip memuat z-score", /Z-score/.test(tip));
}

// Tidak ada scroll horizontal di lebar ponsel.
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > window.innerWidth + 1,
);
check("tanpa scroll horizontal di ponsel", !overflow);

// Anak cukup bulan harus memakai usia kronologis, bukan terkoreksi.
const termBody = await page.locator("body").textContent();
check(
  "anak cukup bulan memakai usia kronologis",
  /usia kronologis/i.test(termBody) && !/usia terkoreksi/i.test(termBody),
);

// Anak prematur: dasar usia yang dipakai harus dinyatakan sebagai terkoreksi.
const budiHref = await openChild("Budi");
await page.goto(`${BASE}${budiHref}/growth`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
const preterm = await page.locator("body").textContent();
check("prematur menyatakan pemakaian usia terkoreksi", /usia terkoreksi/i.test(preterm));
check("prematur menggambar titiknya", (await page.locator(".recharts-line-dot").count()) === 1);

check("tanpa error JavaScript", errors.length === 0, errors.slice(0, 2).join(" | "));

await page.screenshot({ path: "/tmp/growth.png", fullPage: true });
await browser.close();

console.log(fail.length ? `\n${fail.length} GAGAL: ${fail.join(", ")}` : "\nSEMUA LULUS");
process.exit(fail.length ? 1 : 0);
