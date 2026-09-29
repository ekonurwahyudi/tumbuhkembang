import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    // `id` mengunci identitas aplikasi terpasang. Tanpa ini, perubahan start_url
    // di masa depan membuat browser menganggapnya aplikasi yang berbeda.
    id: "/",
    name: "Tumbuh Kembang Anak",
    short_name: "Tumbuh Kembang",
    description:
      "Catat dan pantau pertumbuhan anak — berat, tinggi, lingkar kepala, dan asupan.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#006194",
    lang: "id",
    dir: "ltr",
    categories: ["health", "medical", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Anak Saya",
        short_name: "Anak",
        url: "/children",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Pertumbuhan",
        short_name: "Growth",
        url: "/growth",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
