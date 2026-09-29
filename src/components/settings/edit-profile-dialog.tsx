"use client";

import { useState } from "react";
import { toast } from "sonner";
import { changePasswordAction, updateProfileAction } from "@/lib/actions/account";
import { useFormAction } from "@/lib/use-form-action";
import { FieldError } from "@/components/auth/field-error";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPhotoField } from "./user-photo-field";

const FIELD =
  "h-12 border-transparent bg-white pl-11 text-[15px] text-[#0F172A] placeholder:text-[#94A3B8]/60 shadow-sm focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#006194]/20";

const FIELD_ICON = "pointer-events-none absolute left-3.5 flex items-center text-[#94A3B8]";

const LABEL = "text-[13px] font-semibold text-[#0F172A]";

/** Skor 0–4, aturan sama dengan meter di halaman daftar. */
function strengthOf(pw: string) {
  if (!pw) return { score: 0, label: "Kekuatan kata sandi", color: "" };
  const score = [
    pw.length >= 8,
    /[A-Z]/.test(pw) && /[a-z]/.test(pw),
    /[0-9]/.test(pw),
    /[^A-Za-z0-9]/.test(pw),
  ].filter(Boolean).length;
  if (score === 1) return { score, label: "Lemah", color: "bg-[#EF4444] text-[#EF4444]" };
  if (score === 2) return { score, label: "Cukup", color: "bg-[#F59E0B] text-[#F59E0B]" };
  if (score === 3) return { score, label: "Baik", color: "bg-[#FDE047] text-[#805600]" };
  return { score: 4, label: "Sangat Kuat", color: "bg-[#10B981] text-[#10B981]" };
}

function ProfileForm({
  name,
  email,
  phone,
  initials,
  photoKey,
}: {
  name: string;
  email: string;
  phone: string | null;
  initials: string;
  photoKey: string | null;
}) {
  const { action, fields, formError, values } = useFormAction(updateProfileAction, () => {
    toast.success("Profil diperbarui");
  });

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {formError && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] text-rose-600">{formError}</p>
      )}

      <div className="flex flex-col items-center gap-1 py-1">
        <UserPhotoField name={name} initials={initials} photoKey={photoKey} />
        <p className="text-muted-foreground text-[12px]">Ketuk foto untuk mengganti</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-name" className={LABEL}>
          Nama Lengkap
        </Label>
        <div className="relative flex w-full items-center">
          <span className={FIELD_ICON}>
            <Icon name="person" className="text-[20px]" />
          </span>
          <Input
            id="profile-name"
            name="name"
            autoComplete="name"
            defaultValue={values.name ?? name}
            required
            className={FIELD}
            aria-describedby={fields?.name ? "profile-name-error" : undefined}
            aria-invalid={!!fields?.name}
          />
        </div>
        <FieldError id="profile-name-error" message={fields?.name} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-email" className={LABEL}>
          Email
        </Label>
        <div className="relative flex w-full items-center">
          <span className={FIELD_ICON}>
            <Icon name="mail" className="text-[20px]" />
          </span>
          <Input
            id="profile-email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={values.email ?? email}
            required
            className={FIELD}
            aria-describedby={fields?.email ? "profile-email-error" : undefined}
            aria-invalid={!!fields?.email}
          />
        </div>
        <FieldError id="profile-email-error" message={fields?.email} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-phone" className={LABEL}>
          No. HP <span className="font-normal text-[#94A3B8]">(opsional)</span>
        </Label>
        <div className="relative flex w-full items-center">
          <span className={FIELD_ICON}>
            <Icon name="smartphone" className="text-[20px]" />
          </span>
          <Input
            id="profile-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0812-3456-7890"
            defaultValue={values.phone ?? phone ?? ""}
            className={FIELD}
            aria-describedby={fields?.phone ? "profile-phone-error" : undefined}
            aria-invalid={!!fields?.phone}
          />
        </div>
        <FieldError id="profile-phone-error" message={fields?.phone} />
      </div>

      <SubmitButton
        pendingLabel="Menyimpan..."
        className="h-12 rounded-xl bg-[#0284C7] text-[15px] font-semibold hover:bg-[#006194]"
      >
        Simpan Perubahan
      </SubmitButton>
    </form>
  );
}

function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  // `key` diganti setelah sukses supaya field kata sandi benar-benar kosong lagi —
  // useFormAction sengaja tidak mengembalikan nilai password ke DOM.
  const [formKey, setFormKey] = useState(0);
  const [pw, setPw] = useState("");
  const strength = strengthOf(pw);

  const { action, fields, formError } = useFormAction(changePasswordAction, () => {
    toast.success(hasPassword ? "Kata sandi diganti" : "Kata sandi dibuat");
    setPw("");
    setFormKey((k) => k + 1);
  });

  return (
    <form key={formKey} action={action} className="flex flex-col gap-4" noValidate>
      {formError && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] text-rose-600">{formError}</p>
      )}

      {!hasPassword && (
        <p className="bg-accent text-primary rounded-xl px-3 py-2 text-[13px]">
          Akun Anda masuk lewat Google. Buat kata sandi agar bisa masuk tanpa Google.
        </p>
      )}

      {hasPassword && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currentPassword" className={LABEL}>
            Kata Sandi Lama
          </Label>
          <PasswordInput
            id="currentPassword"
            name="currentPassword"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className={FIELD.replace("pl-11", "pl-4")}
            aria-describedby={fields?.currentPassword ? "currentPassword-error" : undefined}
            aria-invalid={!!fields?.currentPassword}
          />
          <FieldError id="currentPassword-error" message={fields?.currentPassword} />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword" className={LABEL}>
          {hasPassword ? "Kata Sandi Baru" : "Buat Kata Sandi"}
        </Label>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
          required
          placeholder="Minimal 8 karakter"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className={FIELD.replace("pl-11", "pl-4")}
          aria-describedby={fields?.newPassword ? "newPassword-error" : "newPassword-hint"}
          aria-invalid={!!fields?.newPassword}
        />

        <div className="flex items-center gap-2">
          <div className="bg-border h-1 flex-1 overflow-hidden rounded-full">
            <div
              className={`h-full rounded-full transition-all ${strength.color || "bg-transparent"}`}
              style={{ width: `${strength.score * 25}%` }}
            />
          </div>
          <span
            className={`text-[11px] font-semibold ${strength.color ? strength.color.split(" ")[1] : "text-muted-foreground"}`}
          >
            {strength.label}
          </span>
        </div>
        <p id="newPassword-hint" className="text-muted-foreground text-[12px]">
          Minimal 8 karakter, memuat huruf besar, huruf kecil, dan angka.
        </p>
        <FieldError id="newPassword-error" message={fields?.newPassword} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmNewPassword" className={LABEL}>
          Konfirmasi Kata Sandi
        </Label>
        <PasswordInput
          id="confirmNewPassword"
          name="confirmPassword"
          autoComplete="new-password"
          required
          placeholder="Ulangi kata sandi"
          className={FIELD.replace("pl-11", "pl-4")}
          aria-describedby={fields?.confirmPassword ? "confirmPassword-error" : undefined}
          aria-invalid={!!fields?.confirmPassword}
        />
        <FieldError id="confirmPassword-error" message={fields?.confirmPassword} />
      </div>

      <SubmitButton
        pendingLabel="Menyimpan..."
        className="h-12 rounded-xl bg-[#0284C7] text-[15px] font-semibold text-white hover:bg-[#006194]"
      >
        {hasPassword ? "Ganti Kata Sandi" : "Buat Kata Sandi"}
      </SubmitButton>
    </form>
  );
}

export function EditProfileDialog({
  name,
  email,
  phone,
  hasPassword,
  initials,
  photoKey,
}: {
  name: string;
  email: string;
  phone: string | null;
  hasPassword: boolean;
  initials: string;
  photoKey: string | null;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="bg-muted hover:bg-slate-100 text-foreground flex h-11 w-full items-center justify-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold transition-all active:scale-[0.98]"
        >
          <Icon name="manage_accounts" className="text-muted-foreground text-[18px]" />
          Edit Profil
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] max-w-md gap-0 overflow-y-auto px-5 pt-6 pb-5">
        <DialogHeader className="px-0">
          <DialogTitle className="text-left text-[17px]">Edit Profil</DialogTitle>
          <DialogDescription className="text-left text-[13px]">
            Perbarui foto, data akun, dan kata sandi Anda.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profil" className="mt-4 gap-4">
          <TabsList className="h-10 w-full">
            <TabsTrigger value="profil" className="flex-1 text-[13px]">
              Profil
            </TabsTrigger>
            <TabsTrigger value="keamanan" className="flex-1 text-[13px]">
              Keamanan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profil">
            <ProfileForm
              name={name}
              email={email}
              phone={phone}
              initials={initials}
              photoKey={photoKey}
            />
          </TabsContent>

          <TabsContent value="keamanan">
            <PasswordForm hasPassword={hasPassword} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
