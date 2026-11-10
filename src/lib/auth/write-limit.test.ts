import { beforeEach, describe, expect, it, vi } from "vitest";

const header = vi.fn(() => "9.9.9.9");
vi.mock("next/headers", () => ({ headers: async () => ({ get: header }) }));

const { limitByIp, limitWrite } = await import("./write-limit");
const { resetRateLimit } = await import("./rate-limit");

beforeEach(() => {
  vi.useRealTimers();
  for (const k of ["w:child:u1", "w:child:u2", "ip:register:9.9.9.9"]) resetRateLimit(k);
});

describe("laju tulis per akun", () => {
  it("melewatkan sampai batas lalu menolak", async () => {
    for (let i = 1; i <= 3; i++) expect(await limitWrite("child", "u1", 3), `ke-${i}`).toBeNull();

    const blocked = await limitWrite("child", "u1", 3);
    expect(blocked?.success).toBe(false);
    if (blocked?.success === false) expect(blocked.error.code).toBe("RATE_LIMITED");
  });

  it("satu akun kehabisan jatah tidak memblokir akun lain", async () => {
    for (let i = 0; i < 4; i++) await limitWrite("child", "u1", 3);
    expect(await limitWrite("child", "u1", 3)).not.toBeNull();
    expect(await limitWrite("child", "u2", 3)).toBeNull();
    resetRateLimit("w:child:u2");
  });

  it("jendela terbuka lagi setelah 15 menit", async () => {
    for (let i = 0; i < 4; i++) await limitWrite("child", "u1", 3);
    expect(await limitWrite("child", "u1", 3)).not.toBeNull();

    vi.useFakeTimers();
    vi.advanceTimersByTime(15 * 60 * 1000 + 1);
    expect(await limitWrite("child", "u1", 3)).toBeNull();
    vi.useRealTimers();
  });
});

describe("laju pendaftaran per IP", () => {
  it("menolak setelah batas tercapai", async () => {
    for (let i = 1; i <= 3; i++) expect(await limitByIp("register", 3), `ke-${i}`).toBeNull();
    expect(await limitByIp("register", 3)).not.toBeNull();
  });
});
