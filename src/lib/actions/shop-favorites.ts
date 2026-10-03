"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getShopProduct } from "@/lib/data/shop";
import { addFavorite, removeFavorite } from "@/lib/data/shop-favorites";
import { fail, handleUnexpected, ok, type ActionResult } from "@/lib/action-result";
import { isDuplicateKey } from "@/lib/pg-error";

/**
 * Satu aksi, dua arah — tombolnya sendiri yang tahu arah berikutnya.
 *
 * `getShopProduct` lebih dulu, bukan langsung insert: filter `is_published` ada di
 * dalam query-nya, jadi id draf dan id asing sama-sama NOT_FOUND. Tanpa itu, FK yang
 * gagal akan membedakan "produk draf" dari "produk tidak ada" — katalog drafnya bisa
 * diraba satu id per satu id.
 */
export async function toggleFavoriteAction(
  productId: string,
  next: boolean,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    if (!(await getShopProduct(productId))) return fail("NOT_FOUND", "Produk tidak ditemukan.");

    if (next) await addFavorite(user.id, productId);
    else await removeFavorite(user.id, productId);

    revalidatePath("/shop");
    revalidatePath("/dashboard");
    return ok(undefined);
  } catch (err) {
    if (isDuplicateKey(err)) return ok(undefined); // sudah difavoritkan — idempoten
    return handleUnexpected("toggleFavoriteAction", err);
  }
}
