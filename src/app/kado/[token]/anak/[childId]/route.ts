import { findPublicChildPhotoKey } from "@/lib/data/registry";
import { getChildPhoto } from "@/lib/storage";

/**
 * Foto anak untuk halaman publik wishlist — supaya pemberi hadiah tahu kadonya
 * untuk siapa, dan bisa membedakan wishlist untuk satu anak dari dua anak.
 *
 * Route terpisah dari `/children/[id]/photo` karena otorisasinya beda jenis: yang
 * itu bersesi dan owner-only, di sini tidak ada sesi sama sekali dan kuncinya
 * token registry di URL. Route sesi-gated dipakai ulang di sini akan memberi
 * gambar rusak ke setiap orang yang membuka tautan bagikan.
 *
 * Tiga syarat diuji di dalam query `findPublicChildPhotoKey`: registry terbuka,
 * anak milik pemilik registry, dan anak itu dirujuk setidaknya satu barang publik.
 * Anak yang tidak jadi tujuan kado apa pun karena itu tetap tak terjangkau, jadi
 * tautan wishlist tidak berubah jadi daftar seluruh anak di akun itu.
 *
 * Semua kegagalan dijawab 404, jadi keberadaan sebuah id tidak bisa diraba.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string; childId: string }> },
) {
  const { token, childId } = await params;

  const key = await findPublicChildPhotoKey(token, childId);
  if (!key) return new Response(null, { status: 404 });

  const object = await getChildPhoto(key);
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
