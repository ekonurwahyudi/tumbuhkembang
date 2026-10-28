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

/*
  Judul bawaan sengaja berbahasa Indonesia: penarikan menyaring judul asing (lihat
  `looksIndonesian`), jadi "Video x" akan terbuang dan tiap tes mengira penyaring
  durasinya yang rusak.
*/
function videoItem(id: string, duration: string, views = 0, title = `Tips bayi ${id}`) {
  return {
    id,
    snippet: {
      title,
      channelTitle: "Kanal Uji",
      publishedAt: "2026-01-01T00:00:00Z",
      thumbnails: { medium: { url: `https://i.ytimg.com/${id}.jpg` } },
    },
    contentDetails: { duration },
    statistics: { viewCount: String(views) },
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

  it("mengurutkan dari tonton terbanyak, bukan urutan yang dikirim YouTube", async () => {
    // `videos.list` membalas menurut urutan id yang dikirim, BUKAN menurut tonton —
    // jadi tanpa pengurutan ulang di kode kita, "paling populer" tidak pernah terjadi.
    vi.stubGlobal(
      "fetch",
      mockFetch([
        videoItem("sedang", "PT1M", 5_000),
        videoItem("sepi", "PT1M", 12),
        videoItem("ramai", "PT1M", 900_000),
      ]),
    );

    const { fetchYoutubeVideos } = await loadModule();
    const res = await fetchYoutubeVideos("mpasi");

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.videos.map((v) => v.sourceId)).toEqual(["ramai", "sedang", "sepi"]);
    expect(res.videos[0].viewCount).toBe(900_000);
  });

  it("meminta YouTube mengurutkan menurut jumlah tonton", async () => {
    const f = mockFetch([videoItem("a", "PT1M", 10)]);
    vi.stubGlobal("fetch", f);

    const { fetchYoutubeVideos } = await loadModule();
    await fetchYoutubeVideos("mpasi");

    const searchUrl = String(f.mock.calls.find((c) => String(c[0]).includes("/search"))?.[0]);
    expect(searchUrl).toContain("order=viewCount");
  });

  it("video tanpa angka tonton tetap ikut, ditaruh di belakang", async () => {
    // Sebagian kanal menyembunyikan jumlah tontonnya. Membuangnya berarti kehilangan
    // video yang mungkin bagus; menaruhnya di depan berarti berpura-pura ia populer.
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL) => {
        const items = [
          { ...videoItem("ramai", "PT1M", 500), statistics: { viewCount: "500" } },
          { ...videoItem("tanpaAngka", "PT1M"), statistics: undefined },
        ];
        const body = String(input).includes("/search")
          ? { items: items.map((i) => ({ id: { videoId: i.id } })) }
          : { items };
        return { ok: true, status: 200, json: async () => body } as unknown as Response;
      }),
    );

    const { fetchYoutubeVideos } = await loadModule();
    const res = await fetchYoutubeVideos("mpasi");

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.videos.map((v) => v.sourceId)).toEqual(["ramai", "tanpaAngka"]);
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

/**
 * Penyaring bahasa. Diuji dengan judul NYATA dari hasil penarikan — heuristik begini
 * mudah jadi terlalu ketat, dan video Indonesia yang terbuang diam-diam tidak akan
 * pernah terlihat sebagai bug: umpannya cuma terasa lebih sepi.
 */
describe("looksIndonesian", () => {
  it("meloloskan judul berbahasa Indonesia", async () => {
    const { looksIndonesian } = await loadModule();
    for (const t of [
      "MPASI Jepang beda banget sama Indonesia?",
      "Mpasi Perdana (Kemenkes), untuk 1-2×makan #mpasipertama",
      "Tutorial Pijat Supaya ASI Lancar",
      "Pijat Laktasi untuk Memperlancar ASI",
      "Cara Memerah ASI Pakai Tangan",
      "cara ibu memandikan bayi baru lahir",
      "RAHASIA BAYI 3 BULAN SUDAH BISA TENGKURAP MANDIRI",
      "Solusi Anak Bosan Nasi Cuman 2 Bahan",
      "Cara ganti popok yang benar #bayi",
      "Tahapan Perkembangan Bayi 0-12 Bulan",
    ]) {
      expect(looksIndonesian(t), t).toBe(true);
    }
  });

  it("menolak judul asing yang ikut terseret karena tontonnya tinggi", async () => {
    // Semua ini muncul sungguhan di hasil "tummy time bayi" dengan order=viewCount:
    // puluhan juta tonton, tapi tak berguna bagi orang tua Indonesia.
    const { looksIndonesian } = await loadModule();
    for (const t of [
      "Tummy Time in Babies #shorts #youtubeshorts",
      "Baby Zuko's Stunt Compilation!",
      "क्यों जरूरी है Baby का Tummy Time",
      "Babies Extended Sleep Patterns In The Victorian Era",
    ]) {
      expect(looksIndonesian(t), t).toBe(false);
    }
  });
});
