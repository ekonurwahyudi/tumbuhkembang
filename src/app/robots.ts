import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Hanya halaman pemasaran yang boleh diindeks.
 *
 * Sisanya berisi catatan kesehatan anak, jadi daftar larangannya ditulis
 * menyeluruh — termasuk /kado dan /invite, yang walau dapat dibuka tanpa akun
 * memuat nama anak dan tidak pantas muncul di hasil pencarian.
 *
 * Ini pelengkap, bukan pengganti autentikasi: robots.txt hanya permintaan,
 * perayap yang tidak sopan mengabaikannya. Penjaga sebenarnya tetap sesi.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/terms", "/privacy"],
        disallow: [
          "/api/",
          "/dashboard",
          "/children",
          "/growth",
          "/reminders",
          "/user",
          "/admin",
          "/kado",
          "/invite",
          "/login",
          "/register",
          "/forgot-password",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
