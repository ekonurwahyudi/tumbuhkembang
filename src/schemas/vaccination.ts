import { z } from "zod";
import { isNotFuture, isValidYMD } from "./date";
import { CATALOG_KEYS, catalogVaccine } from "@/lib/immunization/catalog";

export const vaccinationSchema = z
  .object({
    // "" dari <select> berarti "vaksin custom, bukan dari katalog".
    catalogKey: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null))
      .refine((v) => v === null || CATALOG_KEYS.includes(v), "Vaksin katalog tidak dikenali"),
    customName: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v) => (typeof v === "string" ? v.trim() : v))
      .refine((v) => v == null || v.length <= 100, "Nama maksimal 100 karakter"),
    givenAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid")
      .refine(isValidYMD, "Tanggal tidak valid")
      .refine((s) => isNotFuture(s), "Tanggal pemberian tidak boleh di masa depan"),
    notes: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null))
      .refine((v) => v === null || v.length <= 500, "Catatan maksimal 500 karakter"),
  })
  .superRefine((d, ctx) => {
    if (d.catalogKey === null && !d.customName) {
      ctx.addIssue({
        code: "custom",
        path: ["customName"],
        message: "Nama vaksin wajib diisi",
      });
    }
  })
  .transform((d) => ({
    catalogKey: d.catalogKey,
    name: d.catalogKey ? catalogVaccine(d.catalogKey)!.name : d.customName!,
    givenAt: d.givenAt,
    notes: d.notes,
  }));

export type VaccinationInput = z.input<typeof vaccinationSchema>;
export type VaccinationOutput = z.output<typeof vaccinationSchema>;
