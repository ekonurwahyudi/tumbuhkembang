import { beforeEach, describe, expect, it, vi } from "vitest";

const unsubscribePushAction = vi.fn();
vi.mock("@/lib/actions/notifications", () => ({
  unsubscribePushAction,
  subscribePushAction: vi.fn(),
}));

// `currentSubscription` menunggu service worker; uji kedua hasil server tanpa browser asli.
const unsubscribe = vi.fn();
const subscription = { endpoint: "https://push.example/sub", unsubscribe };
const getRegistration = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  getRegistration.mockResolvedValue({ pushManager: { getSubscription: () => subscription } });
  vi.stubGlobal("navigator", { serviceWorker: { getRegistration } });
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


describe("currentSubscription", () => {
  it("mengembalikan null bila worker belum terdaftar tanpa menunggu selamanya", async () => {
    getRegistration.mockResolvedValue(null);
    const { currentSubscription } = await import("./push-client");
    expect(await currentSubscription()).toBeNull();
  });
});
