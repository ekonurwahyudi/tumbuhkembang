"use client";

import { removeShopPhotoAction, uploadShopPhotoAction } from "@/lib/actions/shop";
import { MAX_SHOP_PHOTOS } from "@/schemas/shop";
import { PhotoField } from "@/components/registry/registry-photo-field";
import type { ShopProduct } from "@/db/schema";

/**
 * Foto produk katalog. Hanya penyuntik prop untuk `<PhotoField>` — kompresi,
 * validasi, dan petak thumbnail-nya milik satu komponen bersama, bukan salinan.
 */
export const SHOP_PHOTO_HINT =
  `Sampai ${MAX_SHOP_PHOTOS} foto (JPG/PNG/WebP, otomatis dikecilkan). ` +
  "Foto pertama jadi foto utama di kartu katalog. Terlihat oleh semua orang tua yang masuk.";

export function AdminShopPhotoField({ product }: { product: ShopProduct }) {
  return (
    <PhotoField
      owner={{
        id: product.id,
        photoKeys: product.photoKeys,
        upload: uploadShopPhotoAction,
        remove: removeShopPhotoAction,
        src: (id, i) => `/shop/${id}/photo?i=${i}`,
        max: MAX_SHOP_PHOTOS,
        label: "Foto Produk",
        hint: SHOP_PHOTO_HINT,
      }}
    />
  );
}
