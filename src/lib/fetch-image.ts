import "server-only";
import { ALLOWED_PHOTO_TYPES, MAX_UPLOAD_BYTES } from "@/lib/storage-limits";

/**
 * Mengunduh satu gambar dari URL untuk dijadikan sampul.
 *
 * BATAS SSRF. URL-nya datang dari isian orang dan `fetch` ini berjalan di server —
 * tanpa penjagaan, isian `http://169.254.169.254/` (metadata cloud) atau
 * `http://localhost:5432` membuat server menembak jaringan internalnya sendiri lalu
 * menyimpan hasilnya sebagai "gambar".
 *
 * Yang dijaga di sini:
 * - HANYA `https:`. `http:` ikut ditolak — bukan soal enkripsi saja, tapi karena
 *   sebagian besar alamat internal diakses lewat http polos.
 * - Alamat IP literal ditolak seluruhnya. Nama host yang resolve ke IP privat masih
 *   bisa lolos (DNS rebinding); itu batas yang diterima karena pemakainya superadmin
 *   dan alternatifnya — resolve DNS sendiri lalu sambung ke IP — jauh lebih berbelit.
 * - `redirect: "manual"`. Pengalihan adalah jalan memutar klasik: URL publik yang
 *   membalas 302 ke `169.254.169.254` melewati semua pemeriksaan di atas.
 * - Tipe dari Content-Type, dibatasi ke daftar yang sama dengan unggahan biasa.
 * - Ukuran dibatasi dua kali: header `content-length` dan byte yang benar-benar
 *   terunduh — header boleh bohong atau absen.
 *
 * Gagal selalu mengembalikan pesan, bukan melempar: pemanggilnya yang memutuskan
 * cara menyampaikannya.
 */

const TIMEOUT_MS = 10_000;

export type FetchedImage = { bytes: Uint8Array; contentType: string };

/** Menolak IP literal — v4 berbentuk angka bertitik, v6 mengandung titik dua. */
function isIpLiteral(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":") || /^\[.*\]$/.test(host);
}

export async function fetchImageFromUrl(
  raw: string,
): Promise<{ ok: true; image: FetchedImage } | { ok: false; reason: string }> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false, reason: "URL tidak valid." };
  }

  if (url.protocol !== "https:")
    return { ok: false, reason: "Gunakan tautan https:// — http dan skema lain ditolak." };

  const host = url.hostname.toLowerCase();
  if (isIpLiteral(host))
    return { ok: false, reason: "Tautan ke alamat IP langsung tidak diizinkan." };
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal"))
    return { ok: false, reason: "Tautan ke alamat internal tidak diizinkan." };

  let res: Response;
  try {
    res = await fetch(url, {
      // Pengalihan TIDAK diikuti: lihat catatan SSRF di kepala berkas.
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "TumbuhKembangBot/1.0" },
    });
  } catch {
    // Timeout, DNS, TLS — semuanya berarti "tidak dapat".
    return { ok: false, reason: "Gambar tidak bisa diunduh dari tautan itu." };
  }

  if (res.status >= 300 && res.status < 400)
    return { ok: false, reason: "Tautannya mengalihkan ke alamat lain. Pakai tautan langsungnya." };
  if (!res.ok) return { ok: false, reason: `Server gambar menjawab ${res.status}.` };

  const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!ALLOWED_PHOTO_TYPES.includes(contentType as (typeof ALLOWED_PHOTO_TYPES)[number]))
    return {
      ok: false,
      reason: `Tautan itu bukan gambar JPG/PNG/WebP (${contentType || "tipe tidak diketahui"}).`,
    };

  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES)
    return { ok: false, reason: "Ukuran gambar melebihi batas." };

  const reader = res.body?.getReader();
  if (!reader) return { ok: false, reason: "Isi gambar kosong." };

  // Dibaca dengan batas: header boleh bohong, jadi yang menentukan adalah byte yang
  // benar-benar terunduh. Melebihi batas = berhenti dan tolak, bukan dipotong —
  // separuh JPEG bukan gambar.
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_UPLOAD_BYTES) {
      await reader.cancel();
      return { ok: false, reason: "Ukuran gambar melebihi batas." };
    }
    chunks.push(value);
  }

  if (size === 0) return { ok: false, reason: "Isi gambar kosong." };

  const bytes = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    bytes.set(c, at);
    at += c.length;
  }

  return { ok: true, image: { bytes, contentType } };
}
