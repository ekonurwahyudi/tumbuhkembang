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
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const sexEnum = pgEnum("sex", ["MALE", "FEMALE"]);
export const birthTypeEnum = pgEnum("birth_type", ["TERM", "PRETERM"]);
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
    passwordHash: text("password_hash").notNull(),
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

export const usersRelations = relations(users, ({ many }) => ({
  children: many(children),
}));

export const childrenRelations = relations(children, ({ one, many }) => ({
  user: one(users, { fields: [children.userId], references: [users.id] }),
  measurements: many(growthMeasurements),
  feedingLogs: many(feedingLogs),
}));

export const growthMeasurementsRelations = relations(growthMeasurements, ({ one }) => ({
  child: one(children, { fields: [growthMeasurements.childId], references: [children.id] }),
}));

export const feedingLogsRelations = relations(feedingLogs, ({ one }) => ({
  child: one(children, { fields: [feedingLogs.childId], references: [children.id] }),
}));

export type User = typeof users.$inferSelect;
export type Child = typeof children.$inferSelect;
export type GrowthMeasurement = typeof growthMeasurements.$inferSelect;
export type FeedingLog = typeof feedingLogs.$inferSelect;
