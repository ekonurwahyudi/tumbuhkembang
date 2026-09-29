"use client";

import { useState } from "react";
import { registerAction } from "@/lib/auth/actions";
import { useFormAction } from "@/lib/use-form-action";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "./field-error";
import { PasswordInput } from "./password-input";
import { SubmitButton } from "./submit-button";

const FIELD =
  "h-12 border-transparent bg-white pl-11 text-[15px] text-[#0F172A] placeholder:text-[#94A3B8]/60 shadow-sm focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#006194]/20";

const FIELD_ICON =
  "pointer-events-none absolute left-3.5 flex items-center text-[#94A3B8]";

/** Skor 0–4 sesuai logika meter kekuatan di mock. */
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

export function RegisterForm() {
  const { action, fields, formError, values } = useFormAction(registerAction);
  const [pw, setPw] = useState("");
  const strength = strengthOf(pw);

  return (
    <form action={action} className="mt-3 flex flex-col gap-4" noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="name" className="text-[13px] font-semibold text-[#0F172A]">
            Nama Lengkap Orang Tua
          </Label>
          <span className="text-[12px] font-normal text-[#94A3B8]">Ayah / Bunda</span>
        </div>
        <div className="relative flex items-center">
          <span className={FIELD_ICON}>
            <Icon name="person" className="text-[20px]" />
          </span>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            required
            placeholder="Bunda Sarah Amelia"
            defaultValue={values.name}
            className={FIELD}
            aria-describedby={fields?.name ? "name-error" : undefined}
            aria-invalid={!!fields?.name}
          />
        </div>
        <FieldError id="name-error" message={fields?.name} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-[13px] font-semibold text-[#0F172A]">
          Alamat Email Aktif
        </Label>
        <div className="relative flex items-center">
          <span className={FIELD_ICON}>
            <Icon name="mail" className="text-[20px]" />
          </span>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="bunda@keluarga.id"
            defaultValue={values.email}
            className={FIELD}
            aria-describedby={fields?.email ? "email-error" : undefined}
            aria-invalid={!!fields?.email}
          />
        </div>
        <FieldError id="email-error" message={fields?.email} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password" className="text-[13px] font-semibold text-[#0F172A]">
          Kata Sandi
        </Label>
        <div className="relative flex items-center">
          <span className={FIELD_ICON}>
            <Icon name="lock" className="text-[20px]" />
          </span>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            placeholder="Minimal 8 karakter"
            className={`${FIELD} pr-12`}
            onChange={(e) => setPw(e.target.value)}
            aria-describedby={fields?.password ? "password-error" : undefined}
            aria-invalid={!!fields?.password}
          />
        </div>
        <FieldError id="password-error" message={fields?.password} />
        <div className="mt-1.5 px-1">
          <div className="mb-1.5 flex h-1.5 w-full gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-full flex-1 rounded-full transition-colors duration-300 ${
                  i <= strength.score ? strength.color.split(" ")[0] : "bg-[#dce9ff]"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-[11px] font-medium">
            <span className={strength.color.split(" ")[1] || "text-[#94A3B8]"}>{strength.label}</span>
            <span className="text-[#94A3B8]/80">Kombinasi huruf, angka &amp; simbol</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword" className="text-[13px] font-semibold text-[#0F172A]">
          Konfirmasi Kata Sandi
        </Label>
        <div className="relative flex items-center">
          <span className={FIELD_ICON}>
            <Icon name="lock_reset" className="text-[20px]" />
          </span>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            required
            placeholder="Ulangi kata sandi"
            className={`${FIELD} pr-12`}
            aria-describedby={fields?.confirmPassword ? "confirm-error" : undefined}
            aria-invalid={!!fields?.confirmPassword}
          />
        </div>
        <FieldError id="confirm-error" message={fields?.confirmPassword} />
      </div>

      <div className="mt-1 flex items-start gap-3 px-0.5">
        <div className="relative flex items-center pt-0.5">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            required
            className="peer size-5 cursor-pointer appearance-none rounded-md bg-white shadow-sm transition-colors checked:bg-[#0284C7]"
            aria-describedby={fields?.terms ? "terms-error" : undefined}
          />
          <Icon
            name="check"
            className="pointer-events-none absolute top-[4px] left-[2px] text-[16px] text-white opacity-0 transition-opacity peer-checked:opacity-100"
          />
        </div>
        <label
          htmlFor="terms"
          className="cursor-pointer select-none text-[13px] leading-snug text-[#475569]"
        >
          Saya menyetujui <span className="font-semibold text-[#0284C7]">Ketentuan Layanan</span>{" "}
          &amp; <span className="font-semibold text-[#0284C7]">Kebijakan Privasi Rekam Medis Anak</span>.
        </label>
      </div>
      <FieldError id="terms-error" message={fields?.terms} />

      <SubmitButton
        pendingLabel="Membuat Akun..."
        className="mt-2 h-12 w-full rounded-full bg-[#0284C7] text-[13px] font-semibold shadow-md shadow-[#0284C7]/20 hover:bg-[#006194]"
      >
        Buat Akun Sekarang
        <Icon name="arrow_forward" className="text-[18px]" />
      </SubmitButton>
    </form>
  );
}
