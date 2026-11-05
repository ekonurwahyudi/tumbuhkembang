"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { MembershipTier } from "@/db/schema";
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
  parent?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    membershipTier: MembershipTier;
  };
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

      {/*
        Tier hanya muncul saat mengubah, bukan saat membuat: akun baru selalu FREE,
        sama seperti yang mendaftar sendiri. `<select>` bawaan dengan alasan yang sama
        seperti kategori di form Shop — di HP ia membuka picker asli sistem.
      */}
      {parent && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin-parent-tier">Status Member</Label>
          <select
            id="admin-parent-tier"
            name="membershipTier"
            defaultValue={parent.membershipTier}
            aria-describedby={
              fields?.membershipTier ? "admin-parent-tier-error" : "admin-parent-tier-hint"
            }
            aria-invalid={!!fields?.membershipTier}
            className="border-input bg-background focus-visible:ring-ring aria-invalid:border-destructive h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
          >
            <option value="FREE">Free</option>
            <option value="VIP">VIP</option>
            <option value="VVIP">VVIP</option>
          </select>
          <p id="admin-parent-tier-hint" className="text-muted-foreground text-body-sm">
            Berlaku segera tanpa pemiliknya login ulang.
          </p>
          <FieldError id="admin-parent-tier-error" message={fields?.membershipTier} />
        </div>
      )}

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
