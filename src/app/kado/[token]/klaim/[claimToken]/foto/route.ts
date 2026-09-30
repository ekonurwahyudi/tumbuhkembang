import { findClaimByToken } from "@/lib/data/registry";
import { getRegistryPhoto } from "@/lib/storage";

/**
 * Foto bukti kirim, dilihat pengklaim sendiri di halaman tautan pribadinya.
 *
 * Tanpa sesi — pengklaim tidak punya akun di sini; `claimToken` di URL adalah
 * otorisasinya, sama seperti halaman yang memuatnya. Token klaim juga harus
 * benar-benar milik registry di URL, bukan hanya ada.
 *
 * `private` di Cache-Control, bukan `public`: tautannya rahasia milik satu orang.
 * Semua kegagalan dijawab 404.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string; claimToken: string }> },
) {
  const { token, claimToken } = await params;

  const ctx = await findClaimByToken(claimToken);
  if (!ctx || ctx.registryToken !== token) return new Response(null, { status: 404 });

  const key = ctx.claim.photoKey;
  if (!key) return new Response(null, { status: 404 });

  const object = await getRegistryPhoto(key);
  if (!object) return new Response(null, { status: 404 });

  return new Response(object.body, {
    headers: {
      "Content-Type": object.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
