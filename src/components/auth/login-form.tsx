"use client";

import { loginAction } from "@/lib/auth/actions";
import { useFormAction } from "@/lib/use-form-action";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "./field-error";
import { SubmitButton } from "./submit-button";

export function LoginForm() {
  const { action, fields, formError, values } = useFormAction(loginAction);

  return (
    <form action={action} className="space-y-4" noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

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
          autoComplete="current-password"
          required
          aria-describedby={fields?.password ? "password-error" : undefined}
          aria-invalid={!!fields?.password}
        />
        <FieldError id="password-error" message={fields?.password} />
      </div>

      <SubmitButton pendingLabel="Masuk...">Masuk</SubmitButton>
    </form>
  );
}
