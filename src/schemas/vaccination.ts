import { z } from "zod";
import { isNotFuture, isValidYMD } from "./date";
import { CATALOG_KEYS, IMMUNIZATION_CATALOG, catalogVaccine } from "@/lib/immunization/catalog";

/**
 * Nama bebas yang persis sama dengan vaksin katalog dicatat sebagai entri
 * katalog. Form memberi daftar pilihan, jadi memilih "BCG" dari daftar dan
 * mengetiknya sendiri harus berakhir sama — kalau tidak, dosis yang dipilih
 * dari daftar tidak ikut terhitung di kemajuan imunisasi.
 */
const catalogKeyByName = (name: string): string | null =>
  IMMUNIZATION_CATALOG.find((cv) => cv.name.toLowerCase() === name.toLowerCase())?.key ?? null;

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
  .transform((d) => {
    const key = d.catalogKey ?? (d.customName ? catalogKeyByName(d.customName) : null);
    return {
      catalogKey: key,
      name: key ? catalogVaccine(key)!.name : d.customName!,
      givenAt: d.givenAt,
      notes: d.notes,
    };
  });

export type VaccinationInput = z.input<typeof vaccinationSchema>;
export type VaccinationOutput = z.output<typeof vaccinationSchema>;
