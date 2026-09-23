import { z } from "zod";
import { isValidYMD, todayLocalISO } from "./date";

/**
 * Batas plausibilitas volume sekali minum. Longgar — hanya menolak salah ketik
 * nyata (mis. 5000 ml). Bukan penilaian medis.
 */
const MAX_AMOUNT_ML = 500;

export const FEEDING_TYPES = ["BREAST_DIRECT", "EXPRESSED_BREAST_MILK", "FORMULA"] as const;

export const FEEDING_TYPE_LABEL: Record<(typeof FEEDING_TYPES)[number], string> = {
  BREAST_DIRECT: "ASI langsung",
  EXPRESSED_BREAST_MILK: "ASI perah",
  FORMULA: "Susu formula",
};

/** Gabungkan tanggal + jam lokal jadi Date. Keduanya diisi terpisah di form. */
export function combineDateTime(date: string, time: string): Date | null {
  if (!isValidYMD(date)) return null;
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) return null;

  const [hh, mm] = [Number(m[1]), Number(m[2])];
  if (hh > 23 || mm > 59) return null;

  const [y, mo, d] = date.split("-").map(Number);
  return new Date(y, mo - 1, d, hh, mm);
}

export const feedingSchema = z
  .object({
    feedingType: z.enum(FEEDING_TYPES, { message: "Jenis asupan wajib dipilih" }),
    fedDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid")
      .refine(isValidYMD, "Tanggal tidak valid"),
    fedTime: z.string().regex(/^\d{2}:\d{2}$/, "Format jam tidak valid (HH:MM)"),
    amountMl: z
      .union([z.string(), z.number(), z.null()])
      .optional()
      .transform((v) => (typeof v === "string" ? v.trim() : v))
      .transform((v) => (v === "" || v == null ? null : Number(v)))
      .refine((n) => n === null || Number.isFinite(n), "Jumlah harus berupa angka")
      .refine((n) => n === null || n > 0, "Jumlah harus lebih dari 0")
      .refine((n) => n === null || n <= MAX_AMOUNT_ML, `Jumlah melebihi batas wajar (${MAX_AMOUNT_ML} ml)`),
    notes: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null))
      .refine((v) => v === null || v.length <= 500, "Catatan maksimal 500 karakter"),
  })
  .superRefine((d, ctx) => {
    // ASI langsung boleh tanpa volume — memang tidak selalu dapat diukur.
    // Jenis lain harus punya volume, kalau tidak catatannya tidak berarti.
    if (d.feedingType !== "BREAST_DIRECT" && d.amountMl === null) {
      ctx.addIssue({
        code: "custom",
        path: ["amountMl"],
        message: "Jumlah wajib diisi untuk ASI perah dan susu formula",
      });
    }

    const at = combineDateTime(d.fedDate, d.fedTime);
    if (!at) {
      ctx.addIssue({ code: "custom", path: ["fedTime"], message: "Waktu tidak valid" });
      return;
    }
    // Toleransi 1 menit untuk selisih jam perangkat.
    if (at.getTime() > Date.now() + 60_000) {
      ctx.addIssue({
        code: "custom",
        path: ["fedTime"],
        message: "Waktu pemberian tidak boleh di masa depan",
      });
    }
  })
  .transform((d) => ({
    feedingType: d.feedingType,
    amountMl: d.amountMl,
    notes: d.notes,
    fedAt: combineDateTime(d.fedDate, d.fedTime)!,
  }));

export type FeedingInput = z.input<typeof feedingSchema>;
export type FeedingOutput = z.output<typeof feedingSchema>;

/** Nilai awal form: hari ini, jam sekarang. */
export function nowDefaults(now = new Date()) {
  return {
    date: todayLocalISO(now),
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
  };
}
