import { z } from "zod";
import { tidyText } from "./registry";
import { sanitizeHtml } from "@/lib/sanitize-html";
import type { VideoTopicValue } from "./video";

/**
 * Validasi artikel blog. Yang menulis hanya superadmin, tapi `contentHtml` tetap
 * diperlakukan sebagai masukan tak tepercaya: ia dirender dengan
 * `dangerouslySetInnerHTML` ke semua pembaca, dan admin pun menempel HTML dari
 * tempat lain.
 *
 * Pembersihannya terjadi DI SINI, di `.transform()` — bukan di komponen yang
 * merender. Dengan begitu kolom `content_html` di basis data sudah berisi HTML
 * bersih, dan tidak ada jalur tulis yang bisa melewatkannya: satu-satunya pintu
 * masuk ke tabel itu adalah schema ini.
 */

export const BLOG_CATEGORIES = [
  "NUTRISI",
  "TUMBUH_KEMBANG",
  "IMUNISASI",
  "KESEHATAN",
  "PERAWATAN",
  "IBU",
] as const;

export type BlogCategoryValue = (typeof BLOG_CATEGORIES)[number];

export const BLOG_CATEGORY_LABEL: Record<BlogCategoryValue, string> = {
  NUTRISI: "Nutrisi & MPASI",
  TUMBUH_KEMBANG: "Tumbuh Kembang",
  IMUNISASI: "Imunisasi",
  KESEHATAN: "Kesehatan Anak",
  PERAWATAN: "Perawatan Bayi",
  IBU: "Kesehatan Ibu",
};

export const isBlogCategory = (v: unknown): v is BlogCategoryValue =>
  typeof v === "string" && (BLOG_CATEGORIES as readonly string[]).includes(v);

/**
 * Topik video yang sepadan dengan tiap kategori artikel, dipakai menyaring rak
 * video saat orang memilih kategori.
 *
 * Peta ke topik TETAP, bukan kata kunci bebas: tiap kata kunci unik berarti satu
 * `search.list` (100 unit) dengan entri cache sendiri, dan kuota YouTube cuma
 * 10.000 unit/hari. Enam kategori = enam kata kunci yang berulang terus, jadi
 * cache-nya benar-benar kena. Lihat catatan kuota di `schemas/video.ts`.
 *
 * Dua kategori boleh menunjuk topik yang sama — "Imunisasi" dan "Kesehatan Anak"
 * sama-sama dilayani video kesehatan, dan memaksakan topik terpisah hanya menambah
 * satu kata kunci tanpa menambah video yang relevan.
 */
export const BLOG_VIDEO_TOPIC: Record<BlogCategoryValue, VideoTopicValue> = {
  NUTRISI: "MPASI",
  TUMBUH_KEMBANG: "GROWTH",
  IMUNISASI: "HEALTH",
  KESEHATAN: "HEALTH",
  PERAWATAN: "SLEEP",
  IBU: "ASI",
};

/**
 * Slug URL: huruf kecil, angka, dan tanda hubung. Dibuat dari judul bila admin
 * mengosongkannya — mengetik slug adalah pekerjaan yang bisa dihindari.
 */
export function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    // Diakritik dibuang, bukan dibiarkan: "é" di URL jadi persen-encoding panjang.
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    // Pemotongan 80 karakter bisa menyisakan tanda hubung di ujung.
    .replace(/-+$/g, "");
}

export const MAX_BLOG_TITLE = 160;
export const MAX_BLOG_EXCERPT = 300;
/** ~15 ribu kata; di atas ini hampir pasti tempelan yang tidak disengaja. */
export const MAX_BLOG_CONTENT = 100_000;

export const blogPostSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Judul wajib diisi")
      .max(MAX_BLOG_TITLE, `Judul maksimal ${MAX_BLOG_TITLE} karakter`),
    /** Kosong = diturunkan dari judul di `.transform()` bawah. */
    slug: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v) => (typeof v === "string" ? slugify(v) : "")),
    excerpt: z
      .string()
      .trim()
      .min(1, "Ringkasan wajib diisi")
      .max(MAX_BLOG_EXCERPT, `Ringkasan maksimal ${MAX_BLOG_EXCERPT} karakter`)
      .transform(tidyText),
    contentHtml: z
      .string()
      .max(MAX_BLOG_CONTENT, "Isi artikel terlalu panjang")
      // Dibersihkan SEBELUM diuji kosong: masukan yang seluruhnya tag terlarang
      // ("<script>…</script>") harus ditolak sebagai artikel kosong, bukan lolos
      // sebagai artikel yang isinya hilang diam-diam.
      .transform(sanitizeHtml)
      .refine((v) => v.length > 0, "Isi artikel wajib diisi"),
    category: z.enum(BLOG_CATEGORIES, { message: "Kategori wajib dipilih" }),
    isPublished: z.coerce
      .boolean()
      .optional()
      .transform((v) => v === true),
  })
  .transform((d) => ({ ...d, slug: d.slug || slugify(d.title) }))
  // Judul yang seluruhnya non-ASCII (mis. hanja) menghasilkan slug kosong, dan
  // slug kosong berarti URL `/blog/` yang menabrak halaman daftarnya.
  .refine((d) => d.slug.length > 0, {
    path: ["slug"],
    message: "Slug tidak bisa dibuat dari judul ini — isi manual",
  });

export type BlogPostInput = z.infer<typeof blogPostSchema>;
