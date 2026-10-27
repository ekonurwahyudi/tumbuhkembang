import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Penarikan YouTube diuji dengan `fetch` palsu — bukan memanggil API sungguhan.
 *
 * Yang dijaga di sini dua hal yang paling mahal bila salah dan paling sulit terlihat
 * dari layar: penyaringan durasi (video satu jam tidak boleh lolos ke daftar "video
 * pendek") dan cache (tiap pengunjung memicu panggilan baru = kuota harian habis).
 *
 * Modulnya diimpor ulang di tiap tes: cache-nya hidup di tingkat modul, jadi tanpa
 * reset satu tes akan membaca hasil tes sebelumnya.
 */

const KEY = "kunci-uji";

function videoItem(id: string, duration: string, title = `Video ${id}`) {
  return {
    id,
    snippet: {
      title,
      channelTitle: "Kanal Uji",
      publishedAt: "2026-01-01T00:00:00Z",
      thumbnails: { medium: { url: `https://i.ytimg.com/${id}.jpg` } },
    },
    contentDetails: { duration },
  };
}

/** Satu `fetch` palsu untuk dua panggilan: search.list lalu videos.list. */
function mockFetch(items: ReturnType<typeof videoItem>[]) {
  return vi.fn(async (input: string | URL) => {
    const url = String(input);
    const body = url.includes("/search")
      ? { items: items.map((i) => ({ id: { videoId: i.id } })) }
      : { items };
    return { ok: true, status: 200, json: async () => body } as unknown as Response;
  });
}

async function loadModule() {
  vi.resetModules();
  return import("./youtube");
}

beforeEach(() => {
  process.env.YOUTUBE_API_KEY = KEY;
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.YOUTUBE_API_KEY;
});

describe("fetchYoutubeVideos", () => {
  it("membuang video yang lebih panjang dari batas video pendek", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch([
        videoItem("pendek1", "PT1M30S"),
        videoItem("panjang", "PT42M10S"), // webinar — harus dibuang
        videoItem("pendek2", "PT2M59S"),
        videoItem("takUtuh", ""), // durasi tak terbaca — dibuang, bukan dianggap 0 detik
      ]),
    );

    const { fetchYoutubeVideos } = await loadModule();
    const res = await fetchYoutubeVideos("mpasi");

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.videos.map((v) => v.sourceId)).toEqual(["pendek1", "pendek2"]);
  });

  it("memakai cache: kata kunci sama tidak memanggil API dua kali", async () => {
    const f = mockFetch([videoItem("a", "PT1M")]);
    vi.stubGlobal("fetch", f);

    const { fetchYoutubeVideos } = await loadModule();
    await fetchYoutubeVideos("mpasi");
    const afterFirst = f.mock.calls.length;
    await fetchYoutubeVideos("mpasi");

    // Dua panggilan (search + videos) untuk penarikan pertama, nol untuk yang kedua.
    expect(afterFirst).toBe(2);
    expect(f.mock.calls.length).toBe(2);
  });

  it("kata kunci berbeda tetap memicu penarikan sendiri", async () => {
    const f = mockFetch([videoItem("a", "PT1M")]);
    vi.stubGlobal("fetch", f);

    const { fetchYoutubeVideos } = await loadModule();
    await fetchYoutubeVideos("mpasi");
    await fetchYoutubeVideos("imunisasi");

    expect(f.mock.calls.length).toBe(4);
  });

  it("mengembalikan alasan, bukan melempar, saat API key kosong", async () => {
    delete process.env.YOUTUBE_API_KEY;
    const { fetchYoutubeVideos } = await loadModule();

    const res = await fetchYoutubeVideos("mpasi");
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.reason).toMatch(/YOUTUBE_API_KEY/);
  });

  it("mengembalikan alasan saat YouTube menolak permintaan", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 403 }) as unknown as Response),
    );

    const { fetchYoutubeVideos } = await loadModule();
    const res = await fetchYoutubeVideos("mpasi");

    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.reason).toContain("403");
  });

  it("tidak menyimpan kegagalan selama cache sukses — gangguan sesaat tidak mengunci halaman", async () => {
    // Gagal dulu, lalu pulih. Kalau kegagalan ikut di-cache 6 jam, panggilan kedua
    // tidak akan pernah menyentuh jaringan dan halaman tetap kosong.
    const f = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 } as unknown as Response);
    vi.stubGlobal("fetch", f);

    const { fetchYoutubeVideos } = await loadModule();
    const first = await fetchYoutubeVideos("mpasi");
    expect(first.ok).toBe(false);

    // Jendela cache-gagal pendek, jadi percobaan berikutnya memang menembak ulang.
    const ok = mockFetch([videoItem("a", "PT1M")]);
    vi.stubGlobal("fetch", ok);
    vi.useFakeTimers();
    vi.advanceTimersByTime(61_000);
    const second = await fetchYoutubeVideos("mpasi");
    vi.useRealTimers();

    expect(second.ok).toBe(true);
  });
});
