import { beforeEach, describe, expect, it, vi } from "vitest";

const unsubscribePushAction = vi.fn();
const subscribePushAction = vi.fn();
vi.mock("@/lib/actions/notifications", () => ({
  unsubscribePushAction,
  subscribePushAction,
}));

// Langganan diuji tanpa browser asli.
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


describe("enablePush", () => {
  it("meminta izin browser dari klik sebelum mendaftarkan worker dan langganan", async () => {
    const calls: string[] = [];
    const requestPermission = vi.fn(async () => {
      calls.push("permission");
      return "granted";
    });
    const subscribe = vi.fn(async () => ({ toJSON: () => ({ endpoint: "https://push.example/sub" }) }));
    const registration = { pushManager: { getSubscription: () => null, subscribe } };
    const register = vi.fn(async () => {
      calls.push("register");
      return registration;
    });
    vi.stubGlobal("Notification", { requestPermission });
    vi.stubGlobal("window", { PushManager: {} });
    vi.stubGlobal("navigator", { serviceWorker: { register, ready: Promise.resolve(registration) } });
    subscribePushAction.mockResolvedValue({ success: true });

    const { enablePush } = await import("./push-client");
    expect(await enablePush("AQID")).toEqual({ ok: true });
    expect(calls).toEqual(["permission", "register"]);
    expect(subscribe).toHaveBeenCalledOnce();
    expect(subscribePushAction).toHaveBeenCalledOnce();
  });

  it("tidak mendaftarkan worker jika izin ditolak", async () => {
    const requestPermission = vi.fn().mockResolvedValue("denied");
    const register = vi.fn();
    vi.stubGlobal("Notification", { requestPermission });
    vi.stubGlobal("window", { PushManager: {} });
    vi.stubGlobal("navigator", { serviceWorker: { register } });
    const { enablePush } = await import("./push-client");
    expect(await enablePush("AQID")).toEqual({ ok: false, reason: "denied" });
    expect(register).not.toHaveBeenCalled();
    expect(subscribePushAction).not.toHaveBeenCalled();
  });
});
