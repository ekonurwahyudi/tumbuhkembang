import type { MetadataRoute } from "next";

/**
 * Seluruh aplikasi dilarang diindeks.
 *
 * Isinya adalah catatan kesehatan anak di balik autentikasi; tidak ada halaman
 * publik yang perlu muncul di mesin pencari. Ini pelengkap, bukan pengganti
 * autentikasi — robots.txt hanya permintaan, bukan kontrol akses.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
