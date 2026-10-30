import { describe, expect, it } from "vitest";
import { BLOG_CATEGORIES, BLOG_VIDEO_TOPIC, blogPostSchema, slugify } from "./blog";
import { TOPIC_QUERIES } from "@/lib/video/youtube";
import { VIDEO_TOPICS } from "./video";

const base = {
  title: "Kapan Bayi Mulai MPASI",
  excerpt: "Ringkasan singkat artikel.",
  contentHtml: "<p>Isi artikel.</p>",
  category: "NUTRISI",
};

describe("slugify", () => {
  it("menurunkan slug dari judul", () => {
    expect(slugify("Kapan Bayi Mulai MPASI?")).toBe("kapan-bayi-mulai-mpasi");
    expect(slugify("  Gizi & Nutrisi  ")).toBe("gizi-nutrisi");
    expect(slugify("Café Anak")).toBe("cafe-anak");
  });

  it("memangkas 80 karakter tanpa menyisakan tanda hubung di ujung", () => {
    const slug = slugify("a".repeat(100));
    expect(slug).toHaveLength(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});

/**
 * Peta ini menghubungkan DUA enum di modul berbeda. Tanpa tes ini, menambah
 * kategori artikel atau mengganti nama topik video lolos typecheck di satu sisi
 * tapi membuat rak videonya diam-diam salah topik — atau meledak saat dirender.
 */
describe("BLOG_VIDEO_TOPIC", () => {
  it("memetakan setiap kategori artikel ke topik video yang benar-benar ada", () => {
    for (const c of BLOG_CATEGORIES) {
      const topic = BLOG_VIDEO_TOPIC[c];
      expect(VIDEO_TOPICS).toContain(topic);
      // Kata kuncinya harus ada juga — itu yang dikirim ke YouTube.
      expect(TOPIC_QUERIES[topic]).toBeTruthy();
    }
  });
});

describe("blogPostSchema", () => {
  it("membersihkan HTML di jalur simpannya, bukan di komponen render", () => {
    // Inti aturannya: tidak ada jalur tulis yang bisa melewatkan sanitizer.
    const r = blogPostSchema.parse({
      ...base,
      contentHtml: '<p>Aman</p><script>alert(1)</script><p onclick="x">Dua</p>',
    });
    expect(r.contentHtml).toBe("<p>Aman</p><p>Dua</p>");
  });

  it("menolak artikel yang isinya habis setelah dibersihkan", () => {
    // Bukan lolos sebagai artikel kosong diam-diam.
    const r = blogPostSchema.safeParse({ ...base, contentHtml: "<script>alert(1)</script>" });
    expect(r.success).toBe(false);
  });

  it("membuat slug dari judul bila dikosongkan, dan merapikan yang diisi", () => {
    expect(blogPostSchema.parse(base).slug).toBe("kapan-bayi-mulai-mpasi");
    expect(blogPostSchema.parse({ ...base, slug: "Slug Saya!" }).slug).toBe("slug-saya");
  });

  it("menolak judul yang tidak bisa jadi slug, pada field yang benar", () => {
    const r = blogPostSchema.safeParse({ ...base, title: "日本語" });
    expect(r.success).toBe(false);
    // Path harus sama dengan atribut name input, kalau tidak pesannya tidak muncul.
    expect(r.success === false && r.error.issues[0].path[0]).toBe("slug");
  });

  it("tautan sumber di dalam isi tetap lolos dan dapat rel pengaman", () => {
    // Sumber tidak punya kolom sendiri lagi — ia ditulis sebagai tautan di isinya.
    const r = blogPostSchema.parse({
      ...base,
      contentHtml: '<p>Sumber: <a href="https://www.who.int/x">WHO</a>.</p>',
    });
    expect(r.contentHtml).toContain('href="https://www.who.int/x"');
    expect(r.contentHtml).toContain('rel="noopener noreferrer nofollow"');
  });

  it("membatasi panjang judul dan ringkasan", () => {
    expect(blogPostSchema.safeParse({ ...base, title: "" }).success).toBe(false);
    expect(blogPostSchema.safeParse({ ...base, title: "x".repeat(161) }).success).toBe(false);
    expect(blogPostSchema.safeParse({ ...base, excerpt: "x".repeat(301) }).success).toBe(false);
  });

  it("checkbox yang tidak dikirim berarti draf, bukan terbit", () => {
    expect(blogPostSchema.parse(base).isPublished).toBe(false);
    expect(blogPostSchema.parse({ ...base, isPublished: true }).isPublished).toBe(true);
  });

  it("menolak kategori di luar daftar", () => {
    expect(blogPostSchema.safeParse({ ...base, category: "TIDAK_ADA" }).success).toBe(false);
  });
});
