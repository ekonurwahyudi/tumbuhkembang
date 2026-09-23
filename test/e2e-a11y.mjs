/**
 * Audit aksesibilitas seluruh halaman, termasuk yang di balik login.
 *
 * Memakai axe-core — mesin yang sama dipakai Lighthouse untuk kategori
 * accessibility — sehingga halaman terproteksi ikut terperiksa, bukan hanya
 * halaman login.
 *
 * Jalankan terhadap server yang sudah hidup, dengan data seed:
 *   npm run db:seed && npm run build && npm run start
 *   npm run test:e2e:a11y
 */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const EMAIL = "demo@tumbuhkembang.local";
const PASS = "Demo1234";

const fail = [];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

/** WCAG 2 A/AA — standar yang dipakai Lighthouse. */
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function audit(label, url, prepare) {
  await page.goto(url, { waitUntil: "networkidle" });
  if (prepare) await prepare();
  await page.waitForTimeout(800);

  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();

  if (violations.length === 0) {
    console.log(`PASS  ${label}`);
    return;
  }

  console.log(`FAIL  ${label} — ${violations.length} pelanggaran`);
  for (const v of violations.slice(0, 5)) {
    console.log(`        [${v.impact}] ${v.id}: ${v.help}`);
    console.log(`        ${v.nodes[0]?.html?.slice(0, 100) ?? ""}`);
  }
  fail.push(label);
}

// Halaman publik.
await audit("login", `${BASE}/login`);
await audit("register", `${BASE}/register`);
await audit("lupa password", `${BASE}/forgot-password`);

// Login untuk halaman terproteksi.
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", EMAIL);
await page.fill("#password", PASS);
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard", { timeout: 15000 });

await page.goto(`${BASE}/children`, { waitUntil: "networkidle" });
const href = await page
  .locator('li:has-text("Aisyah") a:has-text("Lihat Perkembangan")')
  .getAttribute("href");

await audit("dashboard", `${BASE}/dashboard`);
await audit("daftar anak", `${BASE}/children`);
await audit("tambah anak", `${BASE}/children/new`);
await audit("profil anak", `${BASE}${href}`);
await audit("grafik pertumbuhan", `${BASE}${href}/growth`);
await audit("riwayat pengukuran", `${BASE}${href}/measurements`);
await audit("asupan", `${BASE}${href}/feeding`);
await audit("pengaturan", `${BASE}/settings`);

// Dialog juga harus diperiksa — isinya form dan sering luput dari audit halaman.
await audit("dialog pengukuran", `${BASE}${href}`, async () => {
  await page.click('button:has-text("Pengukuran")');
  await page.waitForTimeout(1000);
});
await audit("dialog asupan", `${BASE}${href}`, async () => {
  await page.click('button:has-text("Catat Minum")');
  await page.waitForTimeout(1000);
});

// Form prematur menampilkan input tambahan yang hanya muncul setelah dipilih.
await audit("form anak prematur", `${BASE}/children/new`, async () => {
  await page.click("#birth-preterm");
  await page.waitForTimeout(600);
});

await browser.close();

console.log(fail.length ? `\n${fail.length} GAGAL: ${fail.join(", ")}` : "\nSEMUA LULUS");
process.exit(fail.length ? 1 : 0);
