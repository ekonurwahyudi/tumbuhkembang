import { describe, expect, it } from "vitest";
import { embedUrl, parseVideoUrl } from "./video";

/**
 * Parsing URL video. Diuji karena bentuk URL yang ditempel orang beragam — bentuk
 * bagikan, bentuk mobile, bentuk shorts — dan satu pola yang meleset membuat video
 * tersimpan dengan id salah yang baru ketahuan saat penyematnya kosong di halaman.
 */
describe("parseVideoUrl", () => {
  it("mengenali bentuk-bentuk URL YouTube", () => {
    const id = "dQw4w9WgXcQ";
    for (const url of [
      `https://www.youtube.com/watch?v=${id}`,
      `https://youtube.com/watch?v=${id}&t=30s`,
      `https://youtu.be/${id}`,
      `https://www.youtube.com/shorts/${id}`,
      `https://m.youtube.com/watch?v=${id}`,
    ]) {
      expect(parseVideoUrl(url), url).toEqual({ source: "YOUTUBE", sourceId: id });
    }
  });

  it("mengenali URL TikTok beserta bentuk mobile-nya", () => {
    expect(parseVideoUrl("https://www.tiktok.com/@bunda/video/7212345678901234567")).toEqual({
      source: "TIKTOK",
      sourceId: "7212345678901234567",
    });
  });

  it("mengenali Reel, post, dan IGTV Instagram", () => {
    for (const [path, id] of [
      ["reel/Cx1y2z3AbCd", "Cx1y2z3AbCd"],
      ["p/Cx1y2z3AbCd", "Cx1y2z3AbCd"],
      ["tv/Cx1y2z3AbCd", "Cx1y2z3AbCd"],
    ] as const) {
      expect(parseVideoUrl(`https://www.instagram.com/${path}/`), path).toEqual({
        source: "INSTAGRAM",
        sourceId: id,
      });
    }
  });

  it("menolak yang bukan URL video", () => {
    for (const bad of [
      "",
      "bukan url",
      "https://example.com/video/123",
      "https://www.youtube.com/", // tanpa id
      "https://www.tiktok.com/@bunda", // profil, bukan video
      "https://www.instagram.com/bunda/", // profil, bukan reel
    ]) {
      expect(parseVideoUrl(bad), bad).toBeNull();
    }
  });

  it("menyemat dari domain nocookie supaya tidak menanam cookie pelacak", () => {
    // Halaman ini dibuka orang tua; penyemat biasa memasang cookie YouTube sebelum
    // videonya bahkan diputar.
    expect(embedUrl("YOUTUBE", "abc123")).toContain("youtube-nocookie.com");
  });
});
