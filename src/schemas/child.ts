import { z } from "zod";

/**
 * Batas gestational age mengikuti cakupan Fenton 2013 preterm growth chart
 * (22–50 minggu post-menstrual age); kelahiran preterm didefinisikan WHO
 * sebagai < 37 minggu lengkap. Lihat docs/medical-references/preterm-growth.md
 */
export const GESTATIONAL_AGE_MIN_WEEKS = 22;
export const GESTATIONAL_AGE_MAX_WEEKS = 36;

const today = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid")
  .refine((s) => !Number.isNaN(Date.parse(s)), "Tanggal tidak valid");

export const childSchema = z
  .object({
    name: z.string().trim().min(1, "Nama anak wajib diisi").max(100),
    sex: z.enum(["MALE", "FEMALE"], { message: "Jenis kelamin wajib dipilih" }),
    dateOfBirth: dateOnly.refine(
      (s) => new Date(s) <= today(),
      "Tanggal lahir tidak boleh di masa depan",
    ),
    birthType: z.enum(["TERM", "PRETERM"], { message: "Status kelahiran wajib dipilih" }),
    gestationalAgeWeeks: z
      .number()
      .int()
      .min(GESTATIONAL_AGE_MIN_WEEKS, `Minimal ${GESTATIONAL_AGE_MIN_WEEKS} minggu`)
      .max(GESTATIONAL_AGE_MAX_WEEKS, `Maksimal ${GESTATIONAL_AGE_MAX_WEEKS} minggu`)
      .nullable()
      .optional(),
    gestationalAgeDays: z
      .number()
      .int()
      .min(0, "Minimal 0 hari")
      .max(6, "Maksimal 6 hari")
      .nullable()
      .optional(),
  })
  .superRefine((d, ctx) => {
    if (d.birthType === "PRETERM") {
      if (d.gestationalAgeWeeks == null)
        ctx.addIssue({
          code: "custom",
          path: ["gestationalAgeWeeks"],
          message: "Usia kehamilan wajib diisi untuk bayi prematur",
        });
      if (d.gestationalAgeDays == null)
        ctx.addIssue({
          code: "custom",
          path: ["gestationalAgeDays"],
          message: "Hari usia kehamilan wajib diisi (0 bila pas)",
        });
    }
  })
  .transform((d) =>
    d.birthType === "TERM"
      ? { ...d, gestationalAgeWeeks: null, gestationalAgeDays: null }
      : d,
  );

export type ChildInput = z.input<typeof childSchema>;
export type ChildOutput = z.output<typeof childSchema>;
