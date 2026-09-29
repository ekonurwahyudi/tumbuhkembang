ALTER TABLE "registry_items" ADD COLUMN "photo_keys" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
-- Foto tunggal yang sudah ada dipindahkan jadi elemen pertama, jadi barang lama
-- tidak kehilangan fotonya saat kolomnya diganti array.
UPDATE "registry_items" SET "photo_keys" = ARRAY["photo_key"] WHERE "photo_key" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "registry_items" DROP COLUMN "photo_key";
