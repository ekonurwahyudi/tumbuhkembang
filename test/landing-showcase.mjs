import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto("http://localhost:3000/");
  const mockup = page.getByRole("img", { name: /Mockup ponsel Tumbuh Kembang/ });
  await mockup.evaluate((image) => image.decode());
  assert.equal(await mockup.evaluate((image) => image.naturalWidth > 0), true);
  const growthCard = page.getByRole("img", { name: /Kartu pertumbuhan data contoh/ });
  const heroChart = page.getByRole("img", { name: /Grafik WHO data contoh/ });
  for (const image of [growthCard, heroChart]) {
    await image.evaluate((node) => node.decode());
    assert.equal(await image.evaluate((node) => node.naturalWidth > 0), true);
    assert.notEqual(await image.evaluate((node) => getComputedStyle(node).borderRadius), "0px");
  }
  const first = page.getByRole("tab", { name: "Grafik WHO & Fenton" });
  await first.focus();
  await page.keyboard.press("ArrowDown");
  assert.equal(await page.getByRole("tab", { name: "Usia kronologis & koreksi" }).getAttribute("aria-selected"), "true");
  assert.equal(await page.getByRole("tabpanel").getByRole("heading").innerText(), "Usia kronologis & koreksi");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.getByRole("tab", { name: "Grafik WHO & Fenton" }).click();
  const screenshot = page.getByRole("tabpanel").getByRole("img", { name: /grafik WHO dengan titik pengukuran/ });
  await screenshot.scrollIntoViewIfNeeded();
  await screenshot.evaluate((image) => image.decode());
  assert.equal(await screenshot.evaluate((image) => image.naturalWidth > 0), true);
  await page.getByRole("tab", { name: "Shop katalog" }).click();
  assert.equal(await page.getByRole("tabpanel").getByRole("img", { name: /grafik WHO dengan titik pengukuran/ }).count(), 0);
} finally {
  await browser.close();
}
