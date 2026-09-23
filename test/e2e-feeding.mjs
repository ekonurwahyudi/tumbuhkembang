/**
 * Smoke test modul asupan di browser sungguhan.
 *
 * Fokusnya pada aturan yang paling mudah salah: sesi menyusui langsung tanpa
 * volume tidak boleh ikut ke total ml, dan estimasi tidak boleh muncul ketika
 * reference-nya tidak berlaku.
 *
 * Jalankan terhadap server yang sudah hidup, dengan data seed:
 *   npm run db:seed && npm run build && npm run start
 *   npm run test:e2e:feeding
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

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", EMAIL);
await page.fill("#password", PASS);
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard", { timeout: 15000 });

async function childHref(name) {
  await page.goto(`${BASE}/children`, { waitUntil: "networkidle" });
  const href = await page
    .locator(`li:has-text("${name}") a:has-text("Lihat Perkembangan")`)
    .getAttribute("href");
  if (!href) throw new Error(`anak "${name}" tidak ditemukan`);
  return href;
}

// ---- Anak cukup bulan: ringkasan harian ----
const aisyah = await childHref("Aisyah");
await page.goto(`${BASE}${aisyah}/feeding`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

let body = await page.locator("body").textContent();

check("sesi hari ini tampil", /Hari ini/.test(body));
check("jenis asupan tampil", /ASI langsung/.test(body) && /ASI perah/.test(body));

/**
 * Seed hari ini: 2 sesi ASI langsung tanpa volume, 2x90 ml perah, 2x100 ml sufor.
 * Total terukur HARUS 380 ml — sesi tanpa volume tidak boleh ikut.
 */
check("ASI perah dijumlahkan benar", /180 ml/.test(body));
check("susu formula dijumlahkan benar", /200 ml/.test(body));
check("total terukur mengecualikan sesi tanpa volume", /380 ml/.test(body));
check("jumlah sesi ASI langsung dihitung", /2 sesi/.test(body));
check(
  "menjelaskan total tidak mencakup semua sesi",
  /tidak ikut dijumlahkan|hanya mencakup sesi yang volumenya tercatat/i.test(body),
);

// ---- Estimasi asupan ----
check("estimasi memakai kata kisaran, bukan perintah", /Estimasi kisaran asupan/.test(body));
check("tidak memerintah jumlah minum", !/harus minum/i.test(body));
check("menyebut reference AAP", /American Academy of Pediatrics/.test(body));
check(
  "menjelaskan menyusui responsif untuk ASI langsung",
  /responsif|sesering yang diinginkan bayi/i.test(body),
);

// Aisyah lahir 22 Jan 2026, usianya sudah lewat 6 bulan -> estimasi tidak berlaku.
check(
  "estimasi dinyatakan tidak berlaku di atas 6 bulan",
  /hanya berlaku sampai usia sekitar 6 bulan/i.test(body),
);

// ---- Bayi prematur: estimasi harus menolak memberi angka ----
const budi = await childHref("Budi");
await page.goto(`${BASE}${budi}/feeding`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
body = await page.locator("body").textContent();
check(
  "prematur tidak diberi estimasi angka",
  /guideline neonatal tersendiri/i.test(body) && !/Kisaran per hari/.test(body),
);

// ---- Mencatat asupan baru ----
await page.click('button:has-text("Catat Minum")');
await page.waitForTimeout(1000);
await page.click("#feeding-FORMULA");
await page.fill("#amountMl", "120");
await page.fill("#fedTime", "10:15");
await page.click('button[type="submit"]:has-text("Simpan")');
await page.waitForTimeout(3000);
body = await page.locator("body").textContent();
check("catatan baru tersimpan", /120 ml/.test(body), body.includes("120 ml") ? "" : "tidak tampil");

// ---- Validasi: ASI perah tanpa volume ditolak ----
await page.click('button:has-text("Catat Minum")');
await page.waitForTimeout(1000);
await page.click("#feeding-EXPRESSED_BREAST_MILK");
await page.fill("#amountMl", "");
await page.click('button[type="submit"]:has-text("Simpan")');
await page.waitForTimeout(2000);
const dialogText = await page.locator('[role="dialog"]').textContent();
check(
  "ASI perah tanpa volume ditolak",
  /Jumlah wajib diisi/.test(dialogText ?? ""),
  (dialogText ?? "").slice(0, 60),
);

// ---- ASI langsung tanpa volume diterima ----
await page.click("#feeding-BREAST_DIRECT");
await page.fill("#fedTime", "11:45");
await page.click('button[type="submit"]:has-text("Simpan")');
await page.waitForTimeout(3000);
const stillOpen = await page.locator('[role="dialog"]').count();
check("ASI langsung tanpa volume diterima", stillOpen === 0);

// Tidak ada scroll horizontal di lebar ponsel.
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > window.innerWidth + 1,
);
check("tanpa scroll horizontal di ponsel", !overflow);

check("tanpa error JavaScript", errors.length === 0, errors.slice(0, 2).join(" | "));

await page.screenshot({ path: "/tmp/feeding.png", fullPage: true });
await browser.close();

console.log(fail.length ? `\n${fail.length} GAGAL: ${fail.join(", ")}` : "\nSEMUA LULUS");
process.exit(fail.length ? 1 : 0);
