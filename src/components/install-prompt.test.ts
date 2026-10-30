import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { isStandalone } = vi.hoisted(() => ({ isStandalone: vi.fn(() => false) }));
vi.mock("@/lib/platform", () => ({
  useHydrated: () => true,
  isIOS: () => false,
  isAndroid: () => true,
  isStandalone,
}));

import { InstallPrompt } from "./install-prompt";

describe("InstallPrompt di pengaturan", () => {
  it("menampilkan tombol pasang tanpa tawaran otomatis browser", () => {
    expect(renderToStaticMarkup(createElement(InstallPrompt, { settings: true }))).toContain("Pasang Aplikasi");
  });

  it("menandai aplikasi yang sudah terpasang", () => {
    isStandalone.mockReturnValueOnce(true);
    const html = renderToStaticMarkup(createElement(InstallPrompt, { settings: true }));
    expect(html).toContain("Sudah Terpasang");
    expect(html).toContain("disabled");
  });
});
