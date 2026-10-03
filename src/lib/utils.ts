import { createCn } from "cn/config";

/**
 * `cn` bawaan hanya tahu skala teks Tailwind (`text-sm`, `text-lg`, …). Skala
 * tipografi repo ini kustom — `--text-body-sm`, `--text-headline-sm`, `--text-metric`
 * dan kawan-kawannya didefinisikan di `globals.css` `@theme inline` — jadi `cn` tidak
 * mengenali `text-body-sm` sebagai UKURAN. Ia menebaknya warna, lalu membuangnya
 * karena bentrok dengan warna di argumen lain:
 *
 *     cn("text-body-sm", "text-primary")  →  "text-primary"   ← ukurannya hilang
 *     cn(PRICE_TONE, "text-body-sm")      →  "... text-body-sm" ← warnanya hilang
 *
 * Itu sebabnya harga di kartu tampil tanpa warna hijau sementara di tempat lain
 * tampil hijau tapi salah ukuran: bukan kelasnya yang salah tulis, melainkan yang
 * satu dibuang sebelum sampai ke browser.
 *
 * Mendaftarkan nama-nama ini ke grup `font-size` menyelesaikannya untuk SELURUH repo
 * sekaligus — ada 60+ tempat yang memanggil `cn` dengan salah satu kelas ini, dan
 * semuanya menanggung bug yang sama.
 */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["label-sm", "body-sm", "body-md", "headline-sm", "headline-md", "headline-lg"] },
        "text-metric",
      ],
    },
  },
});
