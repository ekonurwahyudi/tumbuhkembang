export const VIDEO_SOURCES = ["YOUTUBE", "TIKTOK", "INSTAGRAM"] as const;
export const VIDEO_TOPICS = ["MPASI", "GROWTH", "HEALTH", "PARENTING", "OTHER"] as const;

export type VideoSourceValue = (typeof VIDEO_SOURCES)[number];
export type VideoTopicValue = (typeof VIDEO_TOPICS)[number];

export const VIDEO_SOURCE_LABEL: Record<VideoSourceValue, string> = {
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
};

export const VIDEO_TOPIC_LABEL: Record<VideoTopicValue, string> = {
  MPASI: "MPASI & Nutrisi",
  GROWTH: "Tumbuh Kembang",
  HEALTH: "Kesehatan & Imunisasi",
  PARENTING: "Pengasuhan",
  OTHER: "Lainnya",
};

export const isVideoTopic = (v: unknown): v is VideoTopicValue =>
  typeof v === "string" && (VIDEO_TOPICS as readonly string[]).includes(v);

/**
 * Mengurai URL video jadi (platform, id). Mengembalikan `null` bila tidak dikenali —
 * pemanggil yang memutuskan pesannya, bukan fungsi ini.
 *
 * Hanya POLA URL yang diuji di sini, bukan keberadaan videonya: memeriksa itu berarti
 * permintaan jaringan ke platformnya, dan form admin tidak boleh menggantung menunggu
 * pihak ketiga yang bisa lambat atau mati.
 *
 * Dipisah dari Zod supaya bisa diuji sendiri — lihat `video.test.ts`.
 */
export function parseVideoUrl(
  raw: string,
): { source: VideoSourceValue; sourceId: string } | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }

  // www./m./vm. dibuang supaya "m.youtube.com" dan "youtube.com" tidak jadi dua cabang.
  const host = u.hostname.replace(/^(www|m|vm|vt)\./, "").toLowerCase();
  const seg = u.pathname.split("/").filter(Boolean);

  if (host === "youtu.be" && seg[0]) return { source: "YOUTUBE", sourceId: seg[0] };
  if (host === "youtube.com") {
    // /watch?v=ID, /shorts/ID, /embed/ID — tiga bentuk yang sama-sama sering ditempel.
    const v = u.searchParams.get("v");
    if (v) return { source: "YOUTUBE", sourceId: v };
    if ((seg[0] === "shorts" || seg[0] === "embed") && seg[1])
      return { source: "YOUTUBE", sourceId: seg[1] };
    return null;
  }

  if (host === "tiktok.com") {
    // /@akun/video/ID — bentuk kanonik; id-nya angka panjang.
    const i = seg.indexOf("video");
    if (i >= 0 && seg[i + 1]) return { source: "TIKTOK", sourceId: seg[i + 1] };
    return null;
  }

  if (host === "instagram.com") {
    // /reel/KODE, /p/KODE, /tv/KODE
    if ((seg[0] === "reel" || seg[0] === "p" || seg[0] === "tv") && seg[1])
      return { source: "INSTAGRAM", sourceId: seg[1] };
    return null;
  }

  return null;
}

/** URL penyemat resmi per platform. Videonya tetap diputar dari server asalnya. */
export function embedUrl(source: VideoSourceValue, sourceId: string): string {
  switch (source) {
    case "YOUTUBE":
      return `https://www.youtube-nocookie.com/embed/${sourceId}`;
    case "TIKTOK":
      return `https://www.tiktok.com/embed/v2/${sourceId}`;
    case "INSTAGRAM":
      return `https://www.instagram.com/reel/${sourceId}/embed`;
  }
}

/** Tautan ke video aslinya — kredit ke kreator, dan jalan keluar bila sematnya gagal. */
export function watchUrl(source: VideoSourceValue, sourceId: string): string {
  switch (source) {
    case "YOUTUBE":
      return `https://www.youtube.com/watch?v=${sourceId}`;
    case "TIKTOK":
      // Bentuk pendek tanpa @akun: TikTok mengalihkannya ke URL kanoniknya sendiri,
      // jadi nama akunnya tidak perlu ikut disimpan hanya demi menyusun tautan ini.
      return `https://www.tiktok.com/video/${sourceId}`;
    case "INSTAGRAM":
      return `https://www.instagram.com/reel/${sourceId}/`;
  }
}
