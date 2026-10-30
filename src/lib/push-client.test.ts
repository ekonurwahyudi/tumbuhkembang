import { beforeEach, describe, expect, it, vi } from "vitest";

const unsubscribePushAction = vi.fn();
vi.mock("@/lib/actions/notifications", () => ({
  unsubscribePushAction,
  subscribePushAction: vi.fn(),
}));

// `currentSubscription` menunggu service worker; uji kedua hasil server tanpa browser asli.
const unsubscribe = vi.fn();
const subscription = { endpoint: "https://push.example/sub", unsubscribe };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("navigator", {
    serviceWorker: { ready: Promise.resolve({ pushManager: { getSubscription: () => subscription } }) },
  });
});

describe("disablePush", () => {
  it("tidak mencabut langganan browser bila penghapusan di server gagal", async () => {
    unsubscribePushAction.mockResolvedValue({ success: false });
    const { disablePush } = await import("./push-client");
    expect(await disablePush()).toBe(false);
    expect(unsubscribe).not.toHaveBeenCalled();
  });

  it("mencabut langganan browser setelah penghapusan di server berhasil", async () => {
    unsubscribePushAction.mockResolvedValue({ success: true });
    unsubscribe.mockResolvedValue(true);
    const { disablePush } = await import("./push-client");
    expect(await disablePush()).toBe(true);
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
