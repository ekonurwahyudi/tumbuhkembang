"use client";

import { registerAction } from "@/lib/auth/actions";
import { useFormAction } from "@/lib/use-form-action";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "./field-error";
import { SubmitButton } from "./submit-button";

export function RegisterForm() {
  const { action, fields, formError, values } = useFormAction(registerAction);

  return (
    <form action={action} className="space-y-4" noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nama</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          required
          defaultValue={values.name}
          aria-describedby={fields?.name ? "name-error" : undefined}
          aria-invalid={!!fields?.name}
        />
        <FieldError id="name-error" message={fields?.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={values.email}
          aria-describedby={fields?.email ? "email-error" : undefined}
          aria-invalid={!!fields?.email}
        />
        <FieldError id="email-error" message={fields?.email} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-describedby={fields?.password ? "password-error" : "password-hint"}
          aria-invalid={!!fields?.password}
        />
        <FieldError id="password-error" message={fields?.password} />
        {!fields?.password && (
          <p id="password-hint" className="text-muted-foreground text-xs">
            Minimal 8 karakter, memuat huruf besar, huruf kecil, dan angka.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-describedby={fields?.confirmPassword ? "confirm-error" : undefined}
          aria-invalid={!!fields?.confirmPassword}
        />
        <FieldError id="confirm-error" message={fields?.confirmPassword} />
      </div>

      <SubmitButton pendingLabel="Mendaftar...">Daftar</SubmitButton>
    </form>
  );
}
