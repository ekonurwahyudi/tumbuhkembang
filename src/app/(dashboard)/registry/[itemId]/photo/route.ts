import { auth } from "@/lib/auth";
import { getRegistryItem } from "@/lib/data/registry";
import { getRegistryPhoto } from "@/lib/storage";

/**
 * Foto barang untuk halaman privat pemilik. Ada di samping route publik
 * `/kado/[token]/foto/[itemId]` karena daftar privat harus tetap menampilkan foto
 * barang yang belum (atau tidak pernah) dibagikan ke publik.
 *
 * Barang milik orang lain dijawab 404 — bukan 403 — supaya keberadaan sebuah id
 * tidak bisa diraba lewat beda kode status. Berlaku juga untuk `?i=` di luar
 * rentang: jumlah foto sebuah barang tidak bocor dari kode status.
 */
export async function GET(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 404 });

  const { itemId } = await params;
  const item = await getRegistryItem(session.user.id, itemId);
  if (!item) return new Response(null, { status: 404 });

  const index = Number(new URL(req.url).searchParams.get("i") ?? 0);
  const key = Number.isInteger(index) && index >= 0 ? item.photoKeys[index] : undefined;
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
