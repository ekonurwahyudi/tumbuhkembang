import { z } from "zod";

/**
 * Batas plausibilitas longgar — hanya menolak salah ketik nyata (mis. berat 700 kg).
 * Interpretasi medis adalah tugas growth engine, bukan validasi input.
 */
const MAX_WEIGHT_KG = 150;
const MAX_LENGTH_CM = 220;
const MAX_HEAD_CM = 80;

/** Input kosong (field opsional di form) jadi null; selain itu wajib angka > 0 dan <= max. */
const optionalMeasure = (max: number, label: string) =>
  z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((v) => (typeof v === "string" ? v.trim() : v))
    .transform((v) => (v === "" || v == null ? null : Number(v)))
    .refine((n) => n === null || Number.isFinite(n), `${label} harus berupa angka`)
    .refine((n) => n === null || n > 0, `${label} harus lebih dari 0`)
    .refine((n) => n === null || n <= max, `${label} melebihi batas wajar (${max})`);

const notFuture = (s: string) => {
  const d = new Date(`${s}T00:00:00`);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return !Number.isNaN(d.getTime()) && d <= end;
};

export const measurementSchema = z
  .object({
    measuredAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid")
      .refine(notFuture, "Tanggal pengukuran tidak boleh di masa depan"),
    weightKg: optionalMeasure(MAX_WEIGHT_KG, "Berat badan"),
    lengthHeightCm: optionalMeasure(MAX_LENGTH_CM, "Panjang/tinggi badan"),
    headCircumferenceCm: optionalMeasure(MAX_HEAD_CM, "Lingkar kepala"),
    notes: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null))
      .refine((v) => v === null || v.length <= 500, "Catatan maksimal 500 karakter"),
  })
  .refine(
    (d) => d.weightKg !== null || d.lengthHeightCm !== null || d.headCircumferenceCm !== null,
    { message: "Isi minimal satu nilai pengukuran", path: ["weightKg"] },
  );

export type MeasurementInput = z.input<typeof measurementSchema>;
export type MeasurementOutput = z.output<typeof measurementSchema>;
