import { findPublicItemPhotoKey } from "@/lib/data/registry";
import { getRegistryPhoto } from "@/lib/storage";

/**
 * Foto barang wishlist untuk halaman publik.
 *
 * Route terpisah dari `/children/[id]/photo` karena otorisasinya beda jenis: di sini
 * tidak ada sesi sama sekali, yang jadi kunci adalah token registry di URL. Memakai
 * ulang route sesi-gated akan memberi gambar rusak ke setiap orang yang membuka
 * tautan bagikan.
 *
 * Bucket R2 tetap privat — token yang dicabut membuat foto ikut tak terjangkau.
 * Semua kegagalan dijawab 404, jadi keberadaan sebuah id tidak bisa diraba.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string; itemId: string }> },
) {
  const { token, itemId } = await params;
  // `?i=` memilih foto ke berapa; di luar rentang ikut 404, jadi jumlah foto
  // sebuah barang tidak bisa diraba dari kode status.
  const index = Number(new URL(req.url).searchParams.get("i") ?? 0);
  if (!Number.isInteger(index) || index < 0) return new Response(null, { status: 404 });

  const key = await findPublicItemPhotoKey(token, itemId, index);
  if (!key) return new Response(null, { status: 404 });

  const object = await getRegistryPhoto(key);
  if (!object) return new Response(null, { status: 404 });

  return new Response(object.body, {
    headers: {
      "Content-Type": object.contentType,
      // Publik: halaman ini memang untuk orang banyak, dan key berubah tiap unggah
      // sehingga `immutable` tidak pernah menyajikan foto usang.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
