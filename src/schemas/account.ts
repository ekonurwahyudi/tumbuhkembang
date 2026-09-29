import { z } from "zod";
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
