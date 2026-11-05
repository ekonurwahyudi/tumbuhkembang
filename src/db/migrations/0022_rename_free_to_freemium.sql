-- Rename nilai enum di tempat, bukan drop + recreate seperti bawaan drizzle-kit:
-- baris lama berisi 'FREE', dan cast ke tipe baru yang tidak punya nilai itu gagal.
-- RENAME VALUE menyentuh katalog saja, datanya ikut tanpa disalin.
ALTER TYPE "public"."membership_tier" RENAME VALUE 'FREE' TO 'FREEMIUM';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "membership_tier" SET DEFAULT 'FREEMIUM';
