import { auth } from "@/lib/auth";
import { getChildForViewer } from "@/lib/data/children";
import { getChildPhoto } from "@/lib/storage";

/**
 * Menyajikan foto anak dari penyimpanan privat.
 *
 * Kepemilikan dicek di sini, bukan di bucket: tanpa route ini foto harus
 * diletakkan di URL publik yang bisa dibuka siapa pun yang pernah mendapat
 * tautannya. Anak milik orang lain dijawab 404 — bukan 403 — supaya keberadaan
 * sebuah id tidak bisa diraba lewat beda kode status.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 404 });

  const { id } = await params;
  const viewer = await getChildForViewer(session.user.id, id);
  const child = viewer?.child;
  if (!child?.photoKey) return new Response(null, { status: 404 });

  const object = await getChildPhoto(child.photoKey);
  if (!object) return new Response(null, { status: 404 });

  return new Response(object.body, {
    headers: {
      "Content-Type": object.contentType,
      // Privat: boleh disimpan browser pengguna, tidak boleh oleh cache bersama.
      // `immutable` aman karena key berubah setiap foto diganti.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
