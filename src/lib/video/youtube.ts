import "server-only";
import type { VideoTopicValue } from "@/schemas/video";

/**
 * Penarikan video dari YouTube Data API v3.
 *
 * HANYA YouTube yang ditarik otomatis, dan itu bukan pilihan desain melainkan batas
 * yang dipasang platform lain:
 *
 * - Instagram: Basic Display API sudah dimatikan, dan Graph API hanya menjangkau akun
 *   yang MEMBERI izin. Mencari konten akun orang lain berdasarkan hashtag tidak
 *   tersedia untuk aplikasi pihak ketiga. Jadi Instagram hanya bisa ditempel manual.
 * - TikTok: punya Display API, tapi aksesnya perlu pendaftaran developer yang
 *   ditinjau manusia dan bisa ditolak. Sampai aplikasi ini punya akses itu, TikTok
 *   juga hanya bisa ditempel manual.
 *
 * Apa yang diambil: metadata saja (id, judul, kreator, thumbnail) — videonya tetap
 * diputar dari server YouTube lewat penyemat resmi. Tidak ada berkas video yang
 * diunduh atau disimpan: mengunduhnya melanggar ToS YouTube sekaligus hak cipta
 * kreatornya, dan yang menanggung adalah pemilik aplikasi ini.
 *
 * TIDAK ada tabel di database. Hasilnya di-cache di memori proses (lihat CACHE_MS):
 * tanpa itu, SETIAP pengunjung yang membuka halaman memicu dua panggilan API, dan
 * kuota harian YouTube (10.000 unit; satu `search.list` = 100 unit) habis hanya oleh
 * beberapa ratus kunjungan. Cache-nya per-proses, jadi beberapa instance punya
 * salinan sendiri — cukup untuk skala aplikasi ini; kalau nanti perlu lebih ketat,
 * pindahkan ke cache bersama.
 *
 * Tanpa `YOUTUBE_API_KEY`, fungsi ini mengembalikan alasannya — BUKAN melempar. Satu
 * env var yang belum diisi tidak boleh membuat halaman gagal dirender.
 */

export type FetchedVideo = {
  sourceId: string;
  title: string;
  author: string | null;
  thumbnailUrl: string | null;
  publishedAt: Date | null;
};

export type FetchResult =
  | { ok: true; videos: FetchedVideo[] }
  | { ok: false; reason: string };

/** Durasi maksimal yang dianggap "video pendek" (detik). */
const SHORT_MAX_SECONDS = 180;

/**
 * Umur cache. Enam jam: video edukasi tumbuh kembang bukan kabar yang basi dalam
 * hitungan menit, dan tiap penarikan memakan 100+ unit dari kuota harian 10.000.
 */
const CACHE_MS = 6 * 60 * 60 * 1000;

const cache = new Map<string, { at: number; result: FetchResult }>();

/**
 * Hasil gagal TIDAK ikut disimpan selama `CACHE_MS`: kalau YouTube sedang mati atau
 * kuota habis sesaat, menyimpan kegagalannya enam jam berarti halaman tetap kosong
 * lama setelah layanannya pulih. Kegagalan hanya ditahan sebentar supaya satu
 * gangguan tidak memicu badai permintaan.
 */
const FAIL_CACHE_MS = 60 * 1000;

/**
 * Kata kunci bawaan per topik. Bahasa Indonesia, karena yang membaca aplikasi ini
 * orang tua Indonesia dan hasil berbahasa Inggris jarang terpakai.
 */
export const TOPIC_QUERIES: Record<VideoTopicValue, string> = {
  MPASI: "resep mpasi bayi",
  GROWTH: "tumbuh kembang bayi",
  HEALTH: "imunisasi bayi",
  PARENTING: "tips mengasuh bayi",
  OTHER: "perawatan bayi",
};

/** ISO-8601 durasi ("PT1M30S") → detik. */
function isoDurationToSeconds(iso: string): number {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

type SearchItem = { id?: { videoId?: string } };
type DetailItem = {
  id?: string;
  snippet?: {
    title?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: Record<string, { url?: string } | undefined>;
  };
  contentDetails?: { duration?: string };
};

/**
 * Mencari video pendek berbahasa Indonesia untuk satu kata kunci.
 *
 * Dua permintaan, bukan satu: `search.list` tidak mengembalikan durasi, sementara
 * durasi itulah yang memisahkan video pendek dari webinar satu jam. Jadi id-nya
 * dikumpulkan dulu, lalu `videos.list` menambahkan durasi + metadata dalam SATU
 * panggilan untuk semuanya (bukan satu per video).
 */
export async function fetchYoutubeVideos(
  query: string,
  max = 10,
): Promise<FetchResult> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    return {
      ok: false,
      reason: "YOUTUBE_API_KEY belum diisi di environment.",
    };
  }

  const cacheKey = `${query}::${max}`;
  const hit = cache.get(cacheKey);
  if (hit) {
    const ttl = hit.result.ok ? CACHE_MS : FAIL_CACHE_MS;
    if (Date.now() - hit.at < ttl) return hit.result;
  }

  const remember = (result: FetchResult) => {
    cache.set(cacheKey, { at: Date.now(), result });
    return result;
  };

  try {
    const search = new URL("https://www.googleapis.com/youtube/v3/search");
    search.searchParams.set("key", key);
    search.searchParams.set("part", "id");
    search.searchParams.set("q", query);
    search.searchParams.set("type", "video");
    // `short` = di bawah 4 menit menurut YouTube; durasi persisnya disaring lagi di bawah.
    search.searchParams.set("videoDuration", "short");
    search.searchParams.set("videoEmbeddable", "true");
    search.searchParams.set("relevanceLanguage", "id");
    search.searchParams.set("regionCode", "ID");
    search.searchParams.set("safeSearch", "strict");
    search.searchParams.set("maxResults", String(Math.min(max * 2, 50)));

    const sRes = await fetch(search, { cache: "no-store" });
    if (!sRes.ok) {
      return remember({ ok: false, reason: `YouTube menolak permintaan (HTTP ${sRes.status}).` });
    }
    const sJson = (await sRes.json()) as { items?: SearchItem[] };
    const ids = (sJson.items ?? [])
      .map((i) => i.id?.videoId)
      .filter((v): v is string => Boolean(v));

    if (ids.length === 0) return remember({ ok: true, videos: [] });

    const details = new URL("https://www.googleapis.com/youtube/v3/videos");
    details.searchParams.set("key", key);
    details.searchParams.set("part", "snippet,contentDetails");
    details.searchParams.set("id", ids.join(","));

    const dRes = await fetch(details, { cache: "no-store" });
    if (!dRes.ok) {
      return remember({ ok: false, reason: `YouTube menolak permintaan (HTTP ${dRes.status}).` });
    }
    const dJson = (await dRes.json()) as { items?: DetailItem[] };

    const out: FetchedVideo[] = [];
    for (const it of dJson.items ?? []) {
      const id = it.id;
      const title = it.snippet?.title;
      if (!id || !title) continue;

      const secs = isoDurationToSeconds(it.contentDetails?.duration ?? "");
      if (secs === 0 || secs > SHORT_MAX_SECONDS) continue;

      const th = it.snippet?.thumbnails;
      out.push({
        sourceId: id,
        title,
        author: it.snippet?.channelTitle ?? null,
        thumbnailUrl: th?.medium?.url ?? th?.default?.url ?? null,
        publishedAt: it.snippet?.publishedAt ? new Date(it.snippet.publishedAt) : null,
      });
      if (out.length >= max) break;
    }

    return remember({ ok: true, videos: out });
  } catch (e) {
    // Jaringan mati atau JSON tak terduga — halaman admin tetap harus bisa dirender.
    return remember({ ok: false, reason: `Gagal menghubungi YouTube: ${(e as Error).message}` });
  }
}
