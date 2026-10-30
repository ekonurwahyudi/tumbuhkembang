import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/platform", () => ({
  useHydrated: () => true,
  isIOS: () => false,
  isStandalone: () => false,
}));
vi.mock("@/lib/push-client", () => ({
  pushSupported: () => false,
  currentSubscription: vi.fn(),
  enablePush: vi.fn(),
  disablePush: vi.fn(),
}));

import { PushToggle } from "./push-toggle";

describe("PushToggle", () => {
  it("tetap menampilkan sakelar off dan alasan ketika push tidak tersedia", () => {
    const html = renderToStaticMarkup(createElement(PushToggle));
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="false"');
    expect(html).toContain("disabled");
    expect(html).toContain("belum tersedia");
  });
});
