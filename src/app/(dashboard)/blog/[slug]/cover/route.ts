import { getBlogCoverKey } from "@/lib/data/blog";
import { getBlogCover } from "@/lib/storage";

/**
 * Sampul artikel.
 *
 * Tanpa cek sesi DI SINI karena `middleware.ts` sudah menuntutnya: path ini tidak
 * ada di `PUBLIC_PATHS`, jadi permintaan tanpa sesi dialihkan ke /login sebelum
 * sampai ke berkas ini. Menambahkan cek kedua hanya menduakan aturan yang sama.
 *
 * Penjaga yang benar-benar milik berkas ini ada di query: `getBlogCoverKey` hanya
 * mengembalikan key artikel yang `is_published`, jadi sampul draf tidak bisa diraba
 * lewat slug. Slug asing dan artikel draf sama-sama 404 — tidak bisa dibedakan.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const key = await getBlogCoverKey(slug);
  if (!key) return new Response(null, { status: 404 });

  const object = await getBlogCover(key);
  if (!object) return new Response(null, { status: 404 });

  return new Response(object.body, {
    headers: {
      "Content-Type": object.contentType,
      // `private`: route ini ada di balik middleware bersesi, dan `public` akan
      // mengizinkan proxy bersama menyimpan lalu menyajikannya ke permintaan lain
      // tanpa sesi. Sama dengan route foto lain di aplikasi ini.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
