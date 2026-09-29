import { z } from "zod";
import { isValidYMD, todayLocalISO } from "./date";
import { CATALOG_KEYS } from "@/lib/immunization/catalog";

/**
 * Pengingat jadwal vaksin. Kebalikan dari `vaccinationSchema`: tanggal di sini
 * justru harus di masa depan (atau hari ini) — mengingatkan sesuatu yang sudah
 * lewat tidak ada gunanya.
 */
export const reminderSchema = z.object({
  catalogKey: z
    .string()
    .refine((v) => CATALOG_KEYS.includes(v), "Vaksin katalog tidak dikenali"),
  remindOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid")
    .refine(isValidYMD, "Tanggal tidak valid")
    .refine((s) => s >= todayLocalISO(), "Tanggal pengingat sudah lewat"),
  remindTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Format jam tidak valid (HH:MM)")
    .refine((s) => {
      const [hh, mm] = s.split(":").map(Number);
      return hh <= 23 && mm <= 59;
    }, "Jam tidak valid"),
  notes: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null))
    .refine((v) => v === null || v.length <= 200, "Catatan maksimal 200 karakter"),
});

export type ReminderInput = z.input<typeof reminderSchema>;
export type ReminderOutput = z.output<typeof reminderSchema>;
