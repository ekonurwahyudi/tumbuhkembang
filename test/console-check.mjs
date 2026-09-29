/** Telusuri semua rute sambil merekam error konsol. node test/console-check.mjs */
import { chromium } from "playwright";
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
p.on("console", (m) => m.type() === "error" && errs.push("console: " + m.text()));
p.on("pageerror", (e) => errs.push("pageerror: " + e.message));

await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await p.fill("#email", "demo@tumbuhkembang.local");
await p.fill("#password", "Demo1234");
await Promise.all([p.waitForURL("**/dashboard"), p.click("button[type=submit]")]);

await p.goto(`${BASE}/children`, { waitUntil: "networkidle" });
const href = await p.getAttribute('a[href^="/children/"]:not([href$="/new"])', "href");
for (const r of [href, `${href}/growth`, `${href}/measurements`, `${href}/feeding`, `${href}/edit`,
                 "/settings", "/growth", "/children/new", "/dashboard"]) {
  await p.goto(BASE + r, { waitUntil: "networkidle" });
}
await p.click('button[aria-label="Menu akun"]');
await p.waitForTimeout(400);
console.log("menu akun terbuka:", await p.isVisible("text=Keluar"));
console.log(errs.length ? "ERRORS:\n" + errs.join("\n") : "TIDAK ADA ERROR KONSOL");
await b.close();
