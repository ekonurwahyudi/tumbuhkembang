import { registryClaimSchema, registryItemSchema } from "@/schemas/registry";
import type { RegistryItemValues } from "@/lib/data/registry";
import type { ClaimValues } from "@/lib/data/registry";

/**
 * Parsing form MyRegistry. Dipisah dari actions/registry.ts karena berkas
 * `"use server"` hanya boleh mengekspor fungsi async.
 */

/** Checkbox tidak terkirim sama sekali saat tidak dicentang. */
const checked = (v: FormDataEntryValue | null) => v !== null;

export function parseRegistryItemForm(formData: FormData) {
  return registryItemSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    category: formData.get("category"),
    desiredQty: formData.get("desiredQty") ?? "1",
    priceMin: formData.get("priceMin"),
    priceMax: formData.get("priceMax"),
    note: formData.get("note"),
    urlShopee: formData.get("urlShopee"),
    urlTokopedia: formData.get("urlTokopedia"),
    urlTiktok: formData.get("urlTiktok"),
    childId: formData.get("childId"),
    allowGroup: checked(formData.get("allowGroup")),
    isPublic: checked(formData.get("isPublic")),
  });
}

export const toRegistryItemRow = (
  d: ReturnType<typeof registryItemSchema.parse>,
): RegistryItemValues => ({
  name: d.name,
  description: d.description,
  priority: d.priority,
  category: d.category,
  desiredQty: d.desiredQty,
  priceMinIdr: d.priceMin,
  priceMaxIdr: d.priceMax,
  note: d.note,
  urlShopee: d.urlShopee,
  urlTokopedia: d.urlTokopedia,
  urlTiktok: d.urlTiktok,
  childId: d.childId,
  allowGroup: d.allowGroup,
  isPublic: d.isPublic,
});

export function parseClaimForm(formData: FormData) {
  return registryClaimSchema.safeParse({
    claimerName: formData.get("claimerName"),
    qty: formData.get("qty") ?? "1",
    message: formData.get("message"),
    trackingNumber: formData.get("trackingNumber"),
  });
}

export const toClaimValues = (
  d: ReturnType<typeof registryClaimSchema.parse>,
): ClaimValues => ({
  claimerName: d.claimerName,
  qty: d.qty,
  message: d.message,
  trackingNumber: d.trackingNumber,
});
