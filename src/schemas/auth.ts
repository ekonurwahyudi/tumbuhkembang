import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .max(72, "Password maksimal 72 karakter") // batas bcrypt
  .regex(/[a-z]/, "Password harus memuat huruf kecil")
  .regex(/[A-Z]/, "Password harus memuat huruf besar")
  .regex(/[0-9]/, "Password harus memuat angka");

/** trim/lowercase harus jalan sebelum validasi format — Zod v4 menerapkan transform setelah check. */
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(255)
  .pipe(z.email("Format email tidak valid"));

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    terms: z.boolean(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Konfirmasi password tidak sama",
    path: ["confirmPassword"],
  })
  .refine((d) => d.terms, {
    message: "Anda harus menyetujui ketentuan layanan",
    path: ["terms"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password wajib diisi"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
