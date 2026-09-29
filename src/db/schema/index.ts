import { relations, sql } from "drizzle-orm";
import {
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

export const sexEnum = pgEnum("sex", ["MALE", "FEMALE"]);
export const birthTypeEnum = pgEnum("birth_type", ["TERM", "PRETERM"]);
export const shareStatusEnum = pgEnum("share_status", ["PENDING", "ACCEPTED"]);
export const feedingTypeEnum = pgEnum("feeding_type", [
  "BREAST_DIRECT",
  "EXPRESSED_BREAST_MILK",
  "FORMULA",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    // Null untuk akun yang dibuat lewat Google — tidak bisa login via password.
    passwordHash: text("password_hash"),
    phone: text("phone"),
    photoKey: text("photo_key"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_unique").on(sql`lower(${t.email})`)],
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

export const usersRelations = relations(users, ({ many }) => ({
  children: many(children),
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
export type Child = typeof children.$inferSelect;
export type GrowthMeasurement = typeof growthMeasurements.$inferSelect;
export type FeedingLog = typeof feedingLogs.$inferSelect;
export type Vaccination = typeof vaccinations.$inferSelect;
export type VaccinationSkip = typeof vaccinationSkips.$inferSelect;
export type VaccineReminder = typeof vaccineReminders.$inferSelect;
export type ChildShare = typeof childShares.$inferSelect;
