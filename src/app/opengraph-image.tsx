import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Kartu yang muncul saat tautan dibagikan ke WhatsApp, Facebook, X, Telegram.
 *
 * Digambar dari kode, bukan berkas PNG statis: teksnya ikut berubah saat tagline
 * berubah, dan tidak ada aset 1200x630 yang harus diingat untuk diperbarui.
 *
 * Dibuat sekali saat build dan di-cache — tidak ada Request-time API di sini,
 * jadi perayap mana pun mendapat berkas yang sama tanpa membangunkan server.
 */
export const alt = "Kembangku — Pantau tumbuh kembang si kecil lebih tenang";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Logo dibaca dari disk dan ditanam sebagai data URI: ImageResponse berjalan
  // saat build, saat belum ada origin HTTP yang bisa dimintai berkasnya.
  const logo = await readFile(join(process.cwd(), "public/icons/icon-512.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 72,
          padding: "0 104px",
          background: "#fdf3ec",
        }}
      >
        <img src={logoSrc} alt="" width={300} height={300} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 82,
              fontWeight: 800,
              letterSpacing: "-0.035em",
              color: "#005298",
              lineHeight: 1.05,
            }}
          >
            Kembangku
          </div>
          <div
            style={{
              marginTop: 26,
              fontSize: 40,
              fontWeight: 500,
              lineHeight: 1.32,
              color: "#334155",
              maxWidth: 620,
            }}
          >
            Pantau tumbuh kembang si kecil lebih tenang.
          </div>
          <div style={{ marginTop: 38, fontSize: 28, fontWeight: 500, color: "#64748b" }}>
            kembangku.com
          </div>
        </div>
      </div>
    ),
    size,
  );
}
