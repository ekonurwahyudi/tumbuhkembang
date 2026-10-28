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
  /** Jumlah tonton; dipakai mengurutkan dan ditampilkan di umpan. */
  viewCount: number;
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
  ASI: "asi eksklusif menyusui",
  // "pijat laktasi" saja terlalu sempit dan banyak menarik iklan klinik; ditambah
  // "perah" supaya hasilnya condong ke video praktik, bukan promosi jasa.
  LACTATION_MASSAGE: "pijat laktasi perah asi",
  // Istilah Inggrisnya dipakai apa adanya — itu yang dituliskan kreator Indonesia
  // di judulnya, dan "waktu tengkurap" nyaris tidak dipakai siapa pun.
  TUMMY_TIME: "tummy time bayi",
  GROWTH: "tumbuh kembang bayi",
  HEALTH: "imunisasi bayi",
  SLEEP: "pola tidur bayi",
  // "tips mengasuh bayi" / "perawatan bayi" terlalu longgar: dengan order=viewCount,
  // hiburan bertonton jutaan ikut terseret ("10 tipe anak sekolah", "anjing menjaga
  // bayi"). Kata kunci dipersempit ke kalimat yang hampir hanya dipakai kreator
  // edukasi — penyaring judul tidak bisa membedakan ini, karena keduanya sama-sama
  // berbahasa Indonesia dan memang memuat kata "bayi".
  PARENTING: "panduan pengasuhan bayi menurut dokter anak",
  TIPS: "tips merawat bayi baru lahir untuk ibu",
  OTHER: "edukasi perawatan bayi dokter",
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
  statistics?: { viewCount?: string };
};

/**
 * Menduga video berbahasa Indonesia dari judulnya.
 *
 * Perlu karena `relevanceLanguage=id` hanya memberi BOBOT, bukan menyaring — dan
 * bobot itu kalah telak begitu urutannya diganti ke `viewCount`: kata kunci serapan
 * seperti "tummy time" menarik video global bertonton puluhan juta, sehingga umpan
 * untuk orang tua Indonesia berisi video berbahasa Inggris dan Hindi.
 *
 * `defaultAudioLanguage` dari API tidak dipakai sebagai syarat: banyak kanal
 * Indonesia mengosongkannya, jadi menuntutnya justru membuang video yang benar.
 * Dugaan dari judul lebih longgar dan, untuk keperluan ini, lebih tepat.
 */
export function looksIndonesian(title: string): boolean {
  // Aksara non-Latin (Hindi, Arab, Thai, CJK, dst.) — pasti bukan.
  if (/[\u0600-\u06FF\u0900-\u097F\u0E00-\u0E7F\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/.test(title))
    return false;

  const t = ` ${title.toLowerCase()} `;
  // Kata fungsi yang nyaris selalu muncul di judul berbahasa Indonesia, dan jarang
  // di judul Inggris. Satu kecocokan sudah cukup — judul pendek sering hanya punya satu.
  return /[ ](bayi|anak|ibu|bunda|asi|mpasi|cara|tips|resep|yang|untuk|dengan|agar|biar|jangan|kenapa|supaya|si kecil|newborn bayi)[ ,.!?#]/.test(
    t,
  );
}

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
    // Yang paling banyak ditonton lebih dulu, bukan yang paling relevan (bawaan API).
    // Untuk topik kesehatan anak, jumlah tonton adalah penyaring kasar yang berguna:
    // video dengan ratusan ribu tonton umumnya sudah lewat banyak mata, sementara
    // hasil "paling relevan" bisa saja unggahan baru tanpa penonton sama sekali.
    //
    // CATATAN: ini BUKAN jaminan mutu medis. Populer tidak sama dengan benar, dan
    // mitos pengasuhan justru sering yang paling tersebar. Itulah kenapa halaman
    // videonya membawa penafian "bukan nasihat medis".
    search.searchParams.set("order", "viewCount");
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
    details.searchParams.set("part", "snippet,contentDetails,statistics");
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
      if (!looksIndonesian(title)) continue;

      const th = it.snippet?.thumbnails;
      out.push({
        sourceId: id,
        title,
        author: it.snippet?.channelTitle ?? null,
        thumbnailUrl: th?.medium?.url ?? th?.default?.url ?? null,
        publishedAt: it.snippet?.publishedAt ? new Date(it.snippet.publishedAt) : null,
        // Kanal yang menyembunyikan jumlah tontonnya tetap ikut, dianggap 0 — jadi
        // ia turun ke belakang, bukan hilang dari umpan.
        viewCount: Number(it.statistics?.viewCount ?? 0) || 0,
      });
    }

    /*
      Diurutkan ulang di sini walau `order=viewCount` sudah dipasang di pencarian:
      urutan itu hilang setelah penyaringan durasi membuang sebagiannya, dan
      `videos.list` mengembalikan hasil menurut urutan id yang dikirim — bukan
      menurut jumlah tonton.
    */
    out.sort((a, b) => b.viewCount - a.viewCount);

    return remember({ ok: true, videos: out.slice(0, max) });
  } catch (e) {
    // Jaringan mati atau JSON tak terduga — halaman admin tetap harus bisa dirender.
    return remember({ ok: false, reason: `Gagal menghubungi YouTube: ${(e as Error).message}` });
  }
}
