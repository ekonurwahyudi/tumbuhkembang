"use client";

import Link from "next/link";
import { loginAction } from "@/lib/auth/actions";
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

export function LoginForm({ next }: { next?: string }) {
  const { action, fields, formError, values } = useFormAction(loginAction);

  return (
    <form action={action} className="mt-3 flex flex-col gap-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-[13px] font-semibold text-[#0F172A]">
          Alamat Email
        </Label>
        <div className="relative flex items-center">
          <span className={FIELD_ICON}>
            <Icon name="alternate_email" className="text-[20px]" />
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
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className={`${FIELD} pr-12 tracking-wider`}
            aria-describedby={fields?.password ? "password-error" : undefined}
            aria-invalid={!!fields?.password}
          />
        </div>
        <FieldError id="password-error" message={fields?.password} />
      </div>

      <div className="flex items-center justify-end pt-0.5">
        <Link
          href="/forgot-password"
          className="text-[11px] font-medium tracking-[0.02em] text-[#0284C7] transition-all hover:text-[#006194] active:underline"
        >
          Lupa Kata Sandi?
        </Link>
      </div>

      <SubmitButton
        pendingLabel="Memverifikasi..."
        className="mt-1.5 h-12 w-full rounded-xl bg-[#0284C7] text-[17px] font-semibold hover:bg-[#006194]"
      >
        Masuk ke Aplikasi
        <Icon name="arrow_forward" className="text-[20px]" />
      </SubmitButton>
    </form>
  );
}
