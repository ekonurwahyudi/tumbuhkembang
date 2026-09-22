/**
 * Smoke test alur utama di browser sungguhan.
 *
 * Server action React tidak dapat dipanggil dengan benar lewat curl, sehingga
 * alur register/login hanya dapat diverifikasi jujur lewat browser. Test ini
 * menangkap dua bug yang lolos dari unit test: UntrustedHost pada Auth.js dan
 * form yang terkosongkan setelah submit gagal.
 *
 * Jalankan terhadap server yang sudah hidup:
 *   npm run build && npm run start
 *   npm run test:e2e
 */
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const email = `neg-${Date.now()}@test.local`;
const PASS = "Rahasia123";

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const fail = [];
const check = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
  if (!cond) fail.push(name);
};

// 1. Password lemah ditolak
await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
await page.fill("#name", "Neg User");
await page.fill("#email", email);
await page.fill("#password", "lemah");
await page.fill("#confirmPassword", "lemah");
await page.click('button[type="submit"]');
await page.waitForTimeout(2500);
check("password lemah ditolak", page.url().includes("/register"), page.url());

// 2. Konfirmasi tidak sama ditolak
await page.fill("#password", PASS);
await page.fill("#confirmPassword", "Berbeda123");
await page.click('button[type="submit"]');
await page.waitForTimeout(2500);
const mismatch = await page.locator('p[role="alert"]').allTextContents();
check("konfirmasi beda ditolak", page.url().includes("/register"), mismatch.join(" | "));

// 3. Register valid berhasil (password harus diisi ulang — sengaja tidak dikembalikan)
check("nama bertahan setelah gagal", (await page.inputValue("#name")) === "Neg User");
check("email bertahan setelah gagal", (await page.inputValue("#email")) === email);
await page.fill("#password", PASS);
await page.fill("#confirmPassword", PASS);
await page.click('button[type="submit"]');
await page.waitForTimeout(4000);
check("register valid", page.url().includes("/dashboard"), page.url());

// 4. Email duplikat ditolak
await ctx.clearCookies();
await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
await page.fill("#name", "Dup");
await page.fill("#email", email);
await page.fill("#password", PASS);
await page.fill("#confirmPassword", PASS);
await page.click('button[type="submit"]');
await page.waitForTimeout(3000);
const dup = await page.locator('p[role="alert"], [role="alert"]').allTextContents();
check("email duplikat ditolak", page.url().includes("/register"), dup.join(" | "));

// 5. Password salah ditolak
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", email);
await page.fill("#password", "SalahSekali9");
await page.click('button[type="submit"]');
await page.waitForTimeout(3000);
const bad = await page.locator('[role="alert"]').allTextContents();
check("password salah ditolak", page.url().includes("/login"), bad.join(" | "));

// 6. Login benar berhasil
await page.fill("#password", PASS);
await page.click('button[type="submit"]');
await page.waitForTimeout(4000);
check("login benar", page.url().includes("/dashboard"), page.url());

// 7. Tambah anak preterm
await page.goto(`${BASE}/children/new`, { waitUntil: "networkidle" });
await page.fill("#name", "Budi Preterm");
await page.click("#sex-male");
await page.fill("#dateOfBirth", "2026-05-10");
await page.click("#birth-preterm");
await page.waitForTimeout(500);
const gaVisible = await page.locator("#gestationalAgeWeeks").isVisible();
check("input gestational age muncul saat PRETERM", gaVisible);
await page.fill("#gestationalAgeWeeks", "32");
await page.fill("#gestationalAgeDays", "4");
await page.click('button[type="submit"]');
await page.waitForTimeout(4000);
check("tambah anak preterm", /\/children\/[0-9a-f-]{36}$/.test(page.url()), page.url());

const body = await page.locator("body").textContent();
check("corrected age tampil", body.includes("Corrected age"));
check("gestational age tampil", body.includes("32 minggu 4 hari"));

// 8. Tambah pengukuran
await page.click('button:has-text("Pengukuran")');
await page.waitForTimeout(1200);
await page.fill("#weightKg", "3.25");
await page.fill("#lengthHeightCm", "49.5");
await page.fill("#headCircumferenceCm", "34.5");
await page.click('button[type="submit"]:has-text("Simpan Pengukuran")');
await page.waitForTimeout(4000);
const after = await page.locator("body").textContent();
check("pengukuran tersimpan", after.includes("3,25 kg"), after.includes("3,25 kg") ? "" : "tidak menemukan 3,25 kg");

// 9. Logout lalu akses dashboard ditolak
await ctx.clearCookies();
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
check("dashboard terproteksi", page.url().includes("/login"), page.url());

await page.screenshot({ path: "/tmp/final.png", fullPage: true });
await browser.close();
console.log(fail.length ? `\n${fail.length} GAGAL: ${fail.join(", ")}` : "\nSEMUA LULUS");
process.exit(fail.length ? 1 : 0);
