import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");

describe("service worker saat development", () => {
  it("menangani push tanpa mengambil alih fetch dan cache Next", () => {
    const handlers: Record<string, (event: { respondWith?: () => void }) => void> = {};
    runInNewContext(source, {
      URL,
      self: {
        location: { href: "https://example.test/sw.js?dev=1" },
        addEventListener: (name: string, handler: (event: { respondWith?: () => void }) => void) => {
          handlers[name] = handler;
        },
      },
    });
    const respondWith = vi.fn();
    handlers.fetch({ respondWith });
    expect(respondWith).not.toHaveBeenCalled();
    expect(handlers.push).toBeTypeOf("function");
  });
});
