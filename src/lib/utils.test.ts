import { describe, expect, it } from "vitest";
import { cn } from "./utils";

/**
 * Skala tipografi repo ini kustom, dan `cn` bawaan tidak mengenalinya sebagai ukuran
 * — ia menebaknya warna lalu membuang salah satunya. Gejalanya halus: kelasnya benar
 * di berkas sumber, tapi satu dari keduanya tidak pernah sampai ke browser, jadi
 * harganya tampil tanpa warna atau dengan ukuran yang salah.
 *
 * Uji ini menjaga daftar di `utils.ts` tetap sejalan dengan `@theme inline` di
 * globals.css. Menambah ukuran baru di sana tanpa mendaftarkannya di sini akan
 * menghidupkan lagi bug yang sama, diam-diam.
 */
describe("cn", () => {
  const TONE = "font-bold tabular-nums text-[var(--color-status-normal-text)]";

  it("mempertahankan ukuran kustom DAN warna sekaligus", () => {
    expect(cn(TONE, "text-body-sm")).toContain("text-body-sm");
    expect(cn(TONE, "text-body-sm")).toContain("text-[var(--color-status-normal-text)]");

    expect(cn("text-headline-sm", TONE)).toContain("text-headline-sm");
    expect(cn("text-metric", TONE)).toContain("text-metric");

    // Kelas warna bernama, bukan arbitrary.
    expect(cn("text-body-sm", "text-muted-foreground")).toBe("text-body-sm text-muted-foreground");
  });

  it("masih memperlakukan dua ukuran sebagai bentrok — yang terakhir menang", () => {
    expect(cn("text-body-sm", "text-metric")).toBe("text-metric");
    expect(cn("text-headline-lg", "text-label-sm")).toBe("text-label-sm");
    // Campur dengan skala bawaan Tailwind juga harus bentrok, bukan berdampingan.
    expect(cn("text-sm", "text-body-sm")).toBe("text-body-sm");
  });

  it("masih memperlakukan dua warna sebagai bentrok", () => {
    expect(cn("text-primary", "text-muted-foreground")).toBe("text-muted-foreground");
  });

  it("mengenali seluruh ukuran yang didefinisikan globals.css", () => {
    const SIZES = [
      "text-label-sm",
      "text-body-sm",
      "text-body-md",
      "text-headline-sm",
      "text-headline-md",
      "text-headline-lg",
      "text-metric",
    ];
    for (const size of SIZES) {
      expect(cn(size, "text-primary"), `${size} tidak dikenali sebagai ukuran`).toBe(
        `${size} text-primary`,
      );
    }
  });
});
