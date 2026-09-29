import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getUserPhoto } from "@/lib/storage";

/** Menyajikan foto profil user dari penyimpanan privat. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 404 });

  const [row] = await db
    .select({ photoKey: users.photoKey })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!row?.photoKey) return new Response(null, { status: 404 });

  const object = await getUserPhoto(row.photoKey);
  if (!object) return new Response(null, { status: 404 });

  return new Response(object.body, {
    headers: {
      "Content-Type": object.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
