import { auth } from "@/lib/auth";
import { findClaimPhotoKey } from "@/lib/data/registry";
import { getRegistryPhoto } from "@/lib/storage";

/**
 * Foto bukti kirim dari pengklaim, dilihat orang tua. Bersesi: yang boleh
 * melihatnya hanya pemilik barang yang diklaim, dan kepemilikan itu diuji di dalam
 * `findClaimPhotoKey`, bukan di sini.
 *
 * Klaim atas barang orang lain dijawab 404 — bukan 403 — supaya keberadaan sebuah
 * id klaim tidak bisa diraba dari beda kode status.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ claimId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 404 });

  const { claimId } = await params;
  const key = await findClaimPhotoKey(session.user.id, claimId);
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
