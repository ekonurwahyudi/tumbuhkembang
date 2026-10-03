import { shopProductSchema } from "@/schemas/shop";
import type { ShopProductValues } from "@/lib/data/shop";

/**
 * Parsing form katalog Shop. Dipisah dari actions/shop.ts karena berkas
 * `"use server"` hanya boleh mengekspor fungsi async.
 *
 * Daftar field-nya eksplisit, bukan `Object.fromEntries(formData)`: itulah yang
 * membuat `formData.append("photoKeys", …)` buatan tangan tidak pernah terbaca.
 */

/** Checkbox tidak terkirim sama sekali saat tidak dicentang. */
const checked = (v: FormDataEntryValue | null) => v !== null;

export function parseShopProductForm(formData: FormData) {
  return shopProductSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    price: formData.get("price"),
    priceOriginal: formData.get("priceOriginal"),
    urlShopee: formData.get("urlShopee"),
    urlTokopedia: formData.get("urlTokopedia"),
    urlTiktok: formData.get("urlTiktok"),
    isPublished: checked(formData.get("isPublished")),
    sortOrder: formData.get("sortOrder"),
  });
}

export const toShopProductRow = (
  d: ReturnType<typeof shopProductSchema.parse>,
): ShopProductValues => ({
  name: d.name,
  description: d.description,
  category: d.category,
  priceIdr: d.price,
  priceOriginalIdr: d.priceOriginal,
  urlShopee: d.urlShopee,
  urlTokopedia: d.urlTokopedia,
  urlTiktok: d.urlTiktok,
  isPublished: d.isPublished,
  sortOrder: d.sortOrder,
});
