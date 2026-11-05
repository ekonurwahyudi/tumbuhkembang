CREATE TABLE "membership_limits" (
	"tier" "membership_tier" PRIMARY KEY NOT NULL,
	"registry_max" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Baris awal. Tanpa ini tabelnya kosong dan setiap pembacaan jatuh ke fallback kode.
-- NULL = tanpa batas. ON CONFLICT supaya migrasi aman diulang.
INSERT INTO "membership_limits" ("tier", "registry_max") VALUES
	('FREEMIUM', 5),
	('VIP', NULL),
	('VVIP', NULL)
ON CONFLICT ("tier") DO NOTHING;
