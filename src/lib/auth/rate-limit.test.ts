import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, pruneRateLimit, resetRateLimit } from "./rate-limit";

const KEY = "1.2.3.4:user@example.com";

beforeEach(() => {
  vi.useRealTimers();
  resetRateLimit(KEY);
});

describe("rate limit login", () => {
  it("mengizinkan 5 percobaan lalu memblokir", () => {
    for (let i = 1; i <= 5; i++) expect(checkRateLimit(KEY).allowed, `percobaan ${i}`).toBe(true);

    const blocked = checkRateLimit(KEY);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("menghitung tiap kunci secara terpisah", () => {
    for (let i = 0; i < 6; i++) checkRateLimit(KEY);
    expect(checkRateLimit(KEY).allowed).toBe(false);
    expect(checkRateLimit("5.6.7.8:lain@example.com").allowed).toBe(true);
    resetRateLimit("5.6.7.8:lain@example.com");
  });

  it("reset membuka blokir setelah login berhasil", () => {
    for (let i = 0; i < 6; i++) checkRateLimit(KEY);
    expect(checkRateLimit(KEY).allowed).toBe(false);
    resetRateLimit(KEY);
    expect(checkRateLimit(KEY).allowed).toBe(true);
  });

  it("jendela terbuka kembali setelah 15 menit", () => {
    vi.useFakeTimers();
    for (let i = 0; i < 6; i++) checkRateLimit(KEY);
    expect(checkRateLimit(KEY).allowed).toBe(false);

    vi.advanceTimersByTime(15 * 60 * 1000 + 1);
    expect(checkRateLimit(KEY).allowed).toBe(true);
    vi.useRealTimers();
  });

  it("prune membuang entry kedaluwarsa", () => {
    checkRateLimit("prune-me");
    pruneRateLimit(Date.now() + 16 * 60 * 1000);
    // Entry sudah dibuang, jadi hitungan mulai dari nol lagi.
    for (let i = 1; i <= 5; i++) expect(checkRateLimit("prune-me").allowed).toBe(true);
    resetRateLimit("prune-me");
  });
});
