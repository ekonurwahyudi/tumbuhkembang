import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Hanya tiga halaman publik: sisanya di balik login dan sudah dilarang di
 * robots.ts. Daftarnya ditulis tangan, bukan dibaca dari DB — tidak ada konten
 * publik yang bertambah sendiri, jadi query tiap crawl hanya beban sia-sia.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
