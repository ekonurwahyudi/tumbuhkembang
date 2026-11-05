import { z } from "zod";
import { membershipTierEnum } from "@/db/schema";
import { passwordSchema } from "./auth";

/** Nomor HP Indonesia longgar: 08xxx / 62xxx / +62xxx. Kosong = hapus. */
const phoneSchema = z
  .string()
  .trim()
  .refine((v) => v === "" || /^(\+62|62|0)8[1-9]\d{6,11}$/.test(v), {
    message: "Nomor HP tidak valid (contoh: 0812-3456-7890)",
  });

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100, "Nama terlalu panjang"),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  phone: phoneSchema.optional(),
});

/**
 * Batas satu tier. Kosong = tanpa batas (disimpan NULL), bukan nol: nol berarti
 * tidak boleh menambah sama sekali, dan keduanya perlu bisa dibedakan.
 *
 * `coerce` menolak "5abc" — input number mengirim string, dan Number("5abc") NaN.
 */
export const membershipLimitSchema = z.object({
  tier: z.enum(membershipTierEnum.enumValues),
  registryMax: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{1,5}$/.test(v), {
      message: "Isi bilangan bulat 0-10000, atau kosongkan untuk tanpa batas",
    })
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || v <= 10000, { message: "Terlalu besar" }),
});

/**
 * Ubah akun orang tua oleh admin: profil + tingkat keanggotaan.
 *
 * Tier hanya ada di form admin, bukan di profileSchema: profileSchema juga dipakai
 * halaman Profil milik user sendiri, dan field tier di sana berarti siapa pun bisa
 * menaikkan dirinya ke VVIP lewat satu POST.
 */
export const adminEditParentSchema = profileSchema.extend({
  membershipTier: z.enum(membershipTierEnum.enumValues),
});

/**
 * Akun baru yang dibuat admin: profileSchema + kata sandi awal.
 *
 * `passwordSchema` sama dengan registrasi — akun buatan admin tidak boleh punya kata
 * sandi yang lebih lemah daripada akun yang mendaftar sendiri.
 */
export const adminNewParentSchema = profileSchema.extend({ password: passwordSchema });

// Aturan sama dengan register — kata sandi lewat halaman ini tidak boleh lebih
// lemah daripada yang dibuat saat mendaftar.
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "Kata sandi baru harus berbeda dari yang lama",
    path: ["newPassword"],
  });

export const shareInviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email tujuan tidak valid"),
});
