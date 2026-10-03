"use client";

import { removeShopPhotoAction, uploadShopPhotoAction } from "@/lib/actions/shop";
import { MAX_SHOP_PHOTOS } from "@/schemas/shop";
import { MAX_PHOTO_BYTES } from "@/lib/storage-limits";
import { PhotoField } from "@/components/registry/registry-photo-field";
import type { ShopProduct } from "@/db/schema";

/**
 * Foto produk katalog. Hanya penyuntik prop untuk `<PhotoField>` — kompresi,
 * validasi, dan petak thumbnail-nya milik satu komponen bersama, bukan salinan.
 */
const MB = Math.round(MAX_PHOTO_BYTES / 1024 / 1024);

export const SHOP_PHOTO_HINT =
  `Sampai ${MAX_SHOP_PHOTOS} foto (maksimal ${MB} MB per foto, JPG/PNG/WebP). ` +
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
