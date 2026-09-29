import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["USER", "SUPERADMIN"]);
export const sexEnum = pgEnum("sex", ["MALE", "FEMALE"]);
export const birthTypeEnum = pgEnum("birth_type", ["TERM", "PRETERM"]);
export const shareStatusEnum = pgEnum("share_status", ["PENDING", "ACCEPTED"]);
export const feedingTypeEnum = pgEnum("feeding_type", [
  "BREAST_DIRECT",
  "EXPRESSED_BREAST_MILK",
  "FORMULA",
]);
export const registryPriorityEnum = pgEnum("registry_priority", ["HIGH", "NORMAL", "EXTRA"]);
export const registryCategoryEnum = pgEnum("registry_category", [
  "NUTRITION",
  "CLOTHING",
  "BEDROOM",
  "TOYS",
  "TRANSPORT",
  "OTHER",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    // Null untuk akun yang dibuat lewat Google — tidak bisa login via password.
    passwordHash: text("password_hash"),
    // Default USER untuk setiap pendaftar. Dinaikkan hanya lewat scripts/grant-admin.ts —
    // tidak ada server action yang menulis kolom ini, jadi tidak ada jalur eskalasi.
    role: userRoleEnum("role").notNull().default("USER"),
    phone: text("phone"),
    photoKey: text("photo_key"),
    // Tautan publik MyRegistry. Token baru dibuat saat pertama kali dibagikan, bukan
    // saat pendaftaran: akun yang tidak pernah berbagi tidak punya tautan untuk ditebak.
    // registryPublic dimatikan tanpa mengganti token, jadi tautannya bisa dihidupkan lagi.
    registryToken: text("registry_token"),
    registryPublic: boolean("registry_public").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_email_unique").on(sql`lower(${t.email})`),
    // NULL boleh berkali-kali di unique index Postgres, jadi akun tanpa token aman.
    uniqueIndex("users_registry_token_unique").on(t.registryToken),
  ],
);

export const children = pgTable(
  "children",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sex: sexEnum("sex").notNull(),
    dateOfBirth: date("date_of_birth").notNull(),
    birthType: birthTypeEnum("birth_type").notNull(),
    gestationalAgeWeeks: integer("gestational_age_weeks"),
    gestationalAgeDays: integer("gestational_age_days"),
    // Dipakai untuk syarat berat lahir rendah (HB0), bukan hanya untuk PRETERM.
    birthWeightGrams: integer("birth_weight_grams"),
    // Key objek di R2, bukan URL: bucket-nya privat dan berkasnya disajikan
    // lewat route terotorisasi, sehingga foto tidak pernah dapat tautan publik.
    photoKey: text("photo_key"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("children_user_id_idx").on(t.userId),
    // PRETERM wajib punya gestational age lengkap; TERM wajib NULL keduanya.
    check(
      "children_gestational_age_consistency",
      sql`(${t.birthType} = 'PRETERM' AND ${t.gestationalAgeWeeks} IS NOT NULL AND ${t.gestationalAgeDays} IS NOT NULL)
          OR (${t.birthType} = 'TERM' AND ${t.gestationalAgeWeeks} IS NULL AND ${t.gestationalAgeDays} IS NULL)`,
    ),
    check(
      "children_gestational_age_days_range",
      sql`${t.gestationalAgeDays} IS NULL OR (${t.gestationalAgeDays} >= 0 AND ${t.gestationalAgeDays} <= 6)`,
    ),
    check(
      "children_gestational_age_weeks_range",
      sql`${t.gestationalAgeWeeks} IS NULL OR (${t.gestationalAgeWeeks} >= 22 AND ${t.gestationalAgeWeeks} <= 36)`,
    ),
    check(
      "children_birth_weight_range",
      sql`${t.birthWeightGrams} IS NULL OR (${t.birthWeightGrams} >= 200 AND ${t.birthWeightGrams} <= 8000)`,
    ),
  ],
);

export const growthMeasurements = pgTable(
  "growth_measurements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    childId: uuid("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    measuredAt: date("measured_at").notNull(),
    weightKg: numeric("weight_kg", { precision: 6, scale: 3 }),
    lengthHeightCm: numeric("length_height_cm", { precision: 6, scale: 2 }),
    headCircumferenceCm: numeric("head_circumference_cm", { precision: 6, scale: 2 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("growth_measurements_child_measured_idx").on(t.childId, t.measuredAt),
    check("growth_measurements_weight_positive", sql`${t.weightKg} IS NULL OR ${t.weightKg} > 0`),
    check("growth_measurements_length_positive", sql`${t.lengthHeightCm} IS NULL OR ${t.lengthHeightCm} > 0`),
    check("growth_measurements_head_positive", sql`${t.headCircumferenceCm} IS NULL OR ${t.headCircumferenceCm} > 0`),
    // Minimal satu nilai terisi — record kosong tidak berguna.
    check(
      "growth_measurements_at_least_one_value",
      sql`${t.weightKg} IS NOT NULL OR ${t.lengthHeightCm} IS NOT NULL OR ${t.headCircumferenceCm} IS NOT NULL`,
    ),
  ],
);

export const feedingLogs = pgTable(
  "feeding_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    childId: uuid("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    feedingType: feedingTypeEnum("feeding_type").notNull(),
    amountMl: numeric("amount_ml", { precision: 6, scale: 1 }),
    fedAt: timestamp("fed_at", { withTimezone: true }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("feeding_logs_child_fed_at_idx").on(t.childId, t.fedAt),
    check("feeding_logs_amount_positive", sql`${t.amountMl} IS NULL OR ${t.amountMl} > 0`),
  ],
);

export const vaccinations = pgTable(
  "vaccinations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    childId: uuid("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    // Cocok dengan key di src/lib/immunization/catalog.ts. NULL = catatan vaksin
    // custom di luar katalog wajib. Bukan pgEnum — katalog Kemenkes sudah dua kali
    // direvisi belakangan ini (PCV/Rotavirus 2022, IPV2 2024), jadi divalidasi di
    // Zod, bukan dikunci lewat migrasi enum.
    catalogKey: text("catalog_key"),
    // Label disalin saat dicatat, bukan dijoin dari katalog, agar riwayat tidak
    // ikut berubah kalau label katalog direvisi di kemudian hari.
    name: text("name").notNull(),
    givenAt: date("given_at").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("vaccinations_child_id_idx").on(t.childId),
    // Satu dosis katalog hanya dicatat sekali per anak; entri custom tidak dibatasi.
    uniqueIndex("vaccinations_child_catalog_unique")
      .on(t.childId, t.catalogKey)
      .where(sql`${t.catalogKey} IS NOT NULL`),
  ],
);

export const vaccinationSkips = pgTable(
  "vaccination_skips",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    childId: uuid("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    // Cocok dengan key di src/lib/immunization/catalog.ts.
    catalogKey: text("catalog_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("vaccination_skips_child_id_idx").on(t.childId),
    uniqueIndex("vaccination_skips_child_catalog_unique").on(t.childId, t.catalogKey),
  ],
);

/**
 * Pengingat jadwal vaksin yang dibuat orang tua sendiri: satu per (anak, vaksin
 * katalog), diubah lewat upsert supaya tidak menumpuk.
 *
 * Tanggal dan jam disimpan terpisah, bukan timestamptz: ini waktu lokal orang tua
 * ("Kamis 09:00 di posyandu"), bukan momen absolut. Container production berjalan
 * UTC — menggabungkannya di server akan menggeser jamnya.
 */
export const vaccineReminders = pgTable(
  "vaccine_reminders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    childId: uuid("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    // Cocok dengan key di src/lib/immunization/catalog.ts; divalidasi di Zod,
    // alasannya sama seperti vaccinations.catalogKey.
    catalogKey: text("catalog_key").notNull(),
    remindOn: date("remind_on").notNull(),
    remindTime: time("remind_time").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("vaccine_reminders_child_id_idx").on(t.childId),
    uniqueIndex("vaccine_reminders_child_catalog_unique").on(t.childId, t.catalogKey),
  ],
);

/**
 * MyRegistry: daftar kado impian milik satu akun orang tua (bukan per anak — satu
 * daftar, satu tautan publik). `childId` opsional hanya untuk label "Untuk: Aisyah";
 * anak yang dihapus meninggalkan itemnya utuh, karena barangnya tetap dibutuhkan.
 *
 * Tiga kolom tautan toko, bukan tabel anak: jumlah marketplace-nya tetap tiga.
 */
export const registryItems = pgTable(
  "registry_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    childId: uuid("child_id").references(() => children.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    description: text("description"),
    /**
     * Beberapa foto per barang (sudut berbeda), yang pertama jadi foto utama.
     * Kolom array, bukan tabel anak: key-nya selalu dibaca bersama barangnya dan
     * tidak pernah dicari sendiri, jadi tabel terpisah hanya menambah join.
     */
    photoKeys: text("photo_keys").array().notNull().default([]),
    priority: registryPriorityEnum("priority").notNull().default("NORMAL"),
    category: registryCategoryEnum("category").notNull().default("OTHER"),
    // Kisaran harga dalam rupiah utuh — integer, bukan numeric: tidak ada sen di sini.
    priceMinIdr: integer("price_min_idr"),
    priceMaxIdr: integer("price_max_idr"),
    desiredQty: integer("desired_qty").notNull().default(1),
    allowGroup: boolean("allow_group").notNull().default(false),
    isPublic: boolean("is_public").notNull().default(true),
    note: text("note"),
    urlShopee: text("url_shopee"),
    urlTokopedia: text("url_tokopedia"),
    urlTiktok: text("url_tiktok"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("registry_items_user_id_idx").on(t.userId),
    check("registry_items_qty_range", sql`${t.desiredQty} between 1 and 99`),
    check(
      "registry_items_price_range",
      sql`${t.priceMinIdr} IS NULL OR ${t.priceMaxIdr} IS NULL OR ${t.priceMaxIdr} >= ${t.priceMinIdr}`,
    ),
  ],
);

/**
 * Klaim kado oleh orang luar — satu-satunya tabel di aplikasi ini yang ditulis tanpa
 * sesi. Otorisasinya cuma dua token: `users.registry_token` untuk membuat klaim, dan
 * `claim_token` di sini supaya pengklaim bisa kembali mengisi nomor resinya.
 *
 * Tidak ada kolom status: `tracking_number IS NULL` berarti belum dikirim, terisi
 * berarti sedang dikirim. Nama kurir sudah muat di teks resinya.
 */
export const registryClaims = pgTable(
  "registry_claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => registryItems.id, { onDelete: "cascade" }),
    claimerName: text("claimer_name").notNull(),
    qty: integer("qty").notNull().default(1),
    message: text("message"),
    trackingNumber: text("tracking_number"),
    claimToken: text("claim_token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("registry_claims_token_unique").on(t.claimToken),
    index("registry_claims_item_id_idx").on(t.itemId),
    check("registry_claims_qty_range", sql`${t.qty} between 1 and 99`),
  ],
);

export const registryItemsRelations = relations(registryItems, ({ one, many }) => ({
  user: one(users, { fields: [registryItems.userId], references: [users.id] }),
  child: one(children, { fields: [registryItems.childId], references: [children.id] }),
  claims: many(registryClaims),
}));

export const registryClaimsRelations = relations(registryClaims, ({ one }) => ({
  item: one(registryItems, {
    fields: [registryClaims.itemId],
    references: [registryItems.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  children: many(children),
  registryItems: many(registryItems),
}));

/**
 * Undangan "Akses Pasangan": pemilik anak membagikan satu anak lewat link ber-token.
 * Link ditujukan ke email tertentu — hanya akun dengan email yang sama yang bisa
 * menerima. ACCEPTED = inviteeUserId terisi dan akun itu punya akses ke anak.
 */
export const childShares = pgTable(
  "child_shares",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    childId: uuid("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    inviteeEmail: text("invitee_email").notNull(),
    token: text("token").notNull(),
    status: shareStatusEnum("status").notNull().default("PENDING"),
    inviteeUserId: uuid("invitee_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("child_shares_token_unique").on(t.token),
    index("child_shares_child_id_idx").on(t.childId),
    index("child_shares_invitee_user_id_idx").on(t.inviteeUserId),
  ],
);

export const childSharesRelations = relations(childShares, ({ one }) => ({
  child: one(children, { fields: [childShares.childId], references: [children.id] }),
  owner: one(users, { fields: [childShares.ownerId], references: [users.id] }),
}));

export const childrenRelations = relations(children, ({ one, many }) => ({
  user: one(users, { fields: [children.userId], references: [users.id] }),
  measurements: many(growthMeasurements),
  feedingLogs: many(feedingLogs),
  vaccinations: many(vaccinations),
  vaccinationSkips: many(vaccinationSkips),
  vaccineReminders: many(vaccineReminders),
}));

export const growthMeasurementsRelations = relations(growthMeasurements, ({ one }) => ({
  child: one(children, { fields: [growthMeasurements.childId], references: [children.id] }),
}));

export const feedingLogsRelations = relations(feedingLogs, ({ one }) => ({
  child: one(children, { fields: [feedingLogs.childId], references: [children.id] }),
}));

export const vaccinationsRelations = relations(vaccinations, ({ one }) => ({
  child: one(children, { fields: [vaccinations.childId], references: [children.id] }),
}));

export const vaccinationSkipsRelations = relations(vaccinationSkips, ({ one }) => ({
  child: one(children, { fields: [vaccinationSkips.childId], references: [children.id] }),
}));

export const vaccineRemindersRelations = relations(vaccineReminders, ({ one }) => ({
  child: one(children, { fields: [vaccineReminders.childId], references: [children.id] }),
}));

export type User = typeof users.$inferSelect;
/** Satu-satunya sumber nilai peran — jangan tulis literalnya lagi di tempat lain. */
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type Child = typeof children.$inferSelect;
export type GrowthMeasurement = typeof growthMeasurements.$inferSelect;
export type FeedingLog = typeof feedingLogs.$inferSelect;
export type Vaccination = typeof vaccinations.$inferSelect;
export type VaccinationSkip = typeof vaccinationSkips.$inferSelect;
export type VaccineReminder = typeof vaccineReminders.$inferSelect;
export type ChildShare = typeof childShares.$inferSelect;
export type RegistryItem = typeof registryItems.$inferSelect;
export type RegistryClaim = typeof registryClaims.$inferSelect;
/** Satu-satunya sumber nilai prioritas/kategori — jangan tulis literalnya lagi. */
export type RegistryPriority = (typeof registryPriorityEnum.enumValues)[number];
export type RegistryCategory = (typeof registryCategoryEnum.enumValues)[number];
