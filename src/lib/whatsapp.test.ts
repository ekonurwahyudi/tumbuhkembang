import { describe, expect, it } from "vitest";
import { SUPPORT_WA, greeting, greetingNow, waLink } from "./whatsapp";

describe("greeting", () => {
  it("memilih sapaan menurut batas jamnya", () => {
    expect(greeting(0)).toBe("Selamat pagi");
    expect(greeting(10)).toBe("Selamat pagi");
    expect(greeting(11)).toBe("Selamat siang");
    expect(greeting(14)).toBe("Selamat siang");
    expect(greeting(15)).toBe("Selamat sore");
    expect(greeting(18)).toBe("Selamat sore");
    expect(greeting(19)).toBe("Selamat malam");
    expect(greeting(23)).toBe("Selamat malam");
  });
});

describe("greetingNow", () => {
  it("memakai jam WIB, bukan jam UTC", () => {
    // 23:00 UTC = 06:00 WIB keesokan harinya: pagi, bukan malam. Inilah yang
    // membuat sapaan di server (yang bisa UTC) sama dengan di layar penggunanya.
    expect(greetingNow(new Date("2026-10-03T23:00:00Z"))).toBe("Selamat pagi");
    // 06:00 UTC = 13:00 WIB.
    expect(greetingNow(new Date("2026-10-03T06:00:00Z"))).toBe("Selamat siang");
  });
});

describe("waLink", () => {
  it("menyusun tautan wa.me dengan pesan yang sudah dikodekan", () => {
    expect(waLink("saya mau request fitur baru, yaitu ", "Selamat siang")).toBe(
      `https://wa.me/${SUPPORT_WA}?text=Selamat%20siang%2C%20saya%20mau%20request%20fitur%20baru%2C%20yaitu%20`,
    );
  });

  it("memakai nomor dukungan dalam bentuk internasional tanpa tanda", () => {
    // wa.me menolak "0812…" dan "+62 812…"; yang tertulis di layar tetap 0812…
    expect(SUPPORT_WA).toBe("628121555423");
    expect(`0${SUPPORT_WA.slice(2)}`).toBe("08121555423");
  });
});
