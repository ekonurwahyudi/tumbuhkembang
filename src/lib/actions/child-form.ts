import { childSchema } from "@/schemas/child";
import type { NewChild } from "@/lib/data/children";

/**
 * Parsing form anak, dipakai bersama oleh action pemilik (actions/children.ts) dan
 * action admin (actions/admin.ts). Dipisah karena berkas `"use server"` hanya boleh
 * mengekspor fungsi async — dan karena aturan usia gestasi cukup satu tempat saja.
 */

/** Angka opsional dari FormData: "" -> null, selain itu Number. */
function optionalInt(v: FormDataEntryValue | null): number | null | undefined {
  if (v === null) return undefined;
  const s = String(v).trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : Number.NaN; // NaN akan ditolak Zod
}

export function parseChildForm(formData: FormData) {
  return childSchema.safeParse({
    name: formData.get("name"),
    sex: formData.get("sex"),
    dateOfBirth: formData.get("dateOfBirth"),
    birthType: formData.get("birthType"),
    gestationalAgeWeeks: optionalInt(formData.get("gestationalAgeWeeks")),
    gestationalAgeDays: optionalInt(formData.get("gestationalAgeDays")),
    birthWeightGrams: optionalInt(formData.get("birthWeightGrams")),
  });
}

export const toChildRow = (d: ReturnType<typeof childSchema.parse>): NewChild => ({
  name: d.name,
  sex: d.sex,
  dateOfBirth: d.dateOfBirth,
  birthType: d.birthType,
  gestationalAgeWeeks: d.gestationalAgeWeeks ?? null,
  gestationalAgeDays: d.gestationalAgeDays ?? null,
  birthWeightGrams: d.birthWeightGrams ?? null,
});
