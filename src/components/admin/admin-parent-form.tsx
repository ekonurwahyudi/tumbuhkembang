"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminCreateParentAction, adminUpdateParentAction } from "@/lib/actions/admin";
import { useFormAction } from "@/lib/use-form-action";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Buat / ubah akun orang tua oleh admin. Satu form untuk keduanya: bedanya hanya action
 * dan ada-tidaknya field kata sandi awal.
 *
 * Saat mengubah, kata sandi tidak ada di sini — reset kata sandi oleh admin bukan bagian
 * permintaan, dan tiap field kata sandi berarti satu jalur pengambilalihan akun yang
 * harus dijaga. Saat membuat, kata sandi awal wajib: akun tanpa kata sandi tidak bisa
 * dipakai masuk lewat kredensial.
 */
export function AdminParentForm({
  parent,
}: {
  parent?: { id: string; name: string; email: string; phone: string | null };
}) {
  const router = useRouter();
  const { action, fields, formError } = useFormAction(
    (formData) =>
      parent ? adminUpdateParentAction(parent.id, formData) : adminCreateParentAction(formData),
    () => {
      toast.success(parent ? "Data orang tua diperbarui." : "Akun orang tua dibuat.");
      router.push("/admin/parents");
    },
  );

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {formError && (
        <p className="text-body-sm rounded-xl bg-rose-50 px-3 py-2 text-rose-600">{formError}</p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="admin-parent-name">Nama Lengkap</Label>
        <Input
          id="admin-parent-name"
          name="name"
          defaultValue={parent?.name}
          required
          aria-describedby={fields?.name ? "admin-parent-name-error" : undefined}
          aria-invalid={!!fields?.name}
        />
        <FieldError id="admin-parent-name-error" message={fields?.name} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="admin-parent-email">Email</Label>
        <Input
          id="admin-parent-email"
          name="email"
          type="email"
          defaultValue={parent?.email}
          required
          aria-describedby={fields?.email ? "admin-parent-email-error" : undefined}
          aria-invalid={!!fields?.email}
        />
        <FieldError id="admin-parent-email-error" message={fields?.email} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="admin-parent-phone">Nomor HP (opsional)</Label>
        <Input
          id="admin-parent-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          placeholder="0812-3456-7890"
          defaultValue={parent?.phone ?? ""}
          aria-describedby={fields?.phone ? "admin-parent-phone-error" : undefined}
          aria-invalid={!!fields?.phone}
        />
        <FieldError id="admin-parent-phone-error" message={fields?.phone} />
      </div>

      {!parent && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin-parent-password">Kata Sandi Awal</Label>
          <Input
            id="admin-parent-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-describedby={
              fields?.password ? "admin-parent-password-error" : "admin-parent-password-hint"
            }
            aria-invalid={!!fields?.password}
          />
          <p id="admin-parent-password-hint" className="text-muted-foreground text-body-sm">
            Minimal 8 karakter, memuat huruf besar, huruf kecil, dan angka. Sampaikan ke
            pemiliknya lewat jalur pribadi dan minta segera diganti dari Profil.
          </p>
          <FieldError id="admin-parent-password-error" message={fields?.password} />
        </div>
      )}

      <SubmitButton pendingLabel="Menyimpan...">
        {parent ? "Simpan Perubahan" : "Buat Akun"}
      </SubmitButton>
    </form>
  );
}
