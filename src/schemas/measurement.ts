import { z } from "zod";
import { isNotFuture, isValidYMD } from "./date";

/**
 * Batas plausibilitas longgar — hanya menolak salah ketik nyata (mis. berat 700 kg).
 * Interpretasi medis adalah tugas growth engine, bukan validasi input.
 */
const MAX_WEIGHT_KG = 150;
const MAX_LENGTH_CM = 220;
const MAX_HEAD_CM = 80;

/**
 * Input kosong jadi null; selain itu wajib angka > 0 dan <= max.
 *
 * `.optional()` diperlukan agar KUNCI-nya boleh tidak ada sama sekali, bukan hanya
 * bernilai undefined — keduanya hal berbeda di Zod. Server action selalu mengirim
 * seluruh kunci (FormData.get() memberi null), tetapi pemanggil lain belum tentu.
 */
const optionalMeasure = (max: number, label: string) =>
  z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((v) => (typeof v === "string" ? v.trim() : v))
    .transform((v) => (v === "" || v == null ? null : Number(v)))
    .refine((n) => n === null || Number.isFinite(n), `${label} harus berupa angka`)
    .refine((n) => n === null || n > 0, `${label} harus lebih dari 0`)
    .refine((n) => n === null || n <= max, `${label} melebihi batas wajar (${max})`);

export const measurementSchema = z
  .object({
    measuredAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid")
      .refine(isValidYMD, "Tanggal tidak valid")
      .refine((s) => isNotFuture(s), "Tanggal pengukuran tidak boleh di masa depan"),
    weightKg: optionalMeasure(MAX_WEIGHT_KG, "Berat badan"),
    lengthHeightCm: optionalMeasure(MAX_LENGTH_CM, "Panjang/tinggi badan"),
    headCircumferenceCm: optionalMeasure(MAX_HEAD_CM, "Lingkar kepala"),
    notes: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null))
      .refine((v) => v === null || v.length <= 500, "Catatan maksimal 500 karakter"),
  })
  .refine(
    (d) => d.weightKg !== null || d.lengthHeightCm !== null || d.headCircumferenceCm !== null,
    { message: "Isi minimal satu nilai pengukuran", path: ["weightKg"] },
  );

export type MeasurementInput = z.input<typeof measurementSchema>;
export type MeasurementOutput = z.output<typeof measurementSchema>;
