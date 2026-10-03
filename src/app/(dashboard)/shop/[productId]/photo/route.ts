import { auth } from "@/lib/auth";
import { getShopProductPhotoKey } from "@/lib/data/shop";
import { getShopPhoto } from "@/lib/storage";

/**
 * Foto produk katalog Shop.
 *
 * Yang diperiksa cuma ADA SESI, bukan kepemilikan — katalognya memang milik bersama,
 * tidak ada pemiliknya untuk dibandingkan. Ini SENGAJA beda dari
 * `/registry/[itemId]/photo` yang ber-scope pemilik; jangan disalin bolak-balik antara
 * keduanya.
 *
 * Produk draf dijawab 404 lewat `getShopProductPhotoKey` — filter `is_published` ada
 * di dalam query itu, bukan di cabang `if` di sini. Dan 404 untuk SEMUA kegagalan,
 * bukan 403: beda kode status membuat keberadaan sebuah id, dan jumlah fotonya, bisa
 * diraba dari luar. Berlaku juga untuk `?i=` di luar rentang.
 *
 * `Cache-Control: private` walau isinya sama untuk setiap orang tua — katalognya bukan
 * untuk tamu, dan `private` menahan proxy bersama menyimpannya.
 */
export async function GET(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 404 });

  const { productId } = await params;
  const index = Number(new URL(req.url).searchParams.get("i") ?? 0);
  if (!Number.isInteger(index) || index < 0) return new Response(null, { status: 404 });

  const key = await getShopProductPhotoKey(productId, index);
  if (!key) return new Response(null, { status: 404 });

  const object = await getShopPhoto(key);
  if (!object) return new Response(null, { status: 404 });

  return new Response(object.body, {
    headers: {
      "Content-Type": object.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
