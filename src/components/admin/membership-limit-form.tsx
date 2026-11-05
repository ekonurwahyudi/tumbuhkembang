"use client";

import { toast } from "sonner";
import type { MembershipTier } from "@/db/schema";
import { adminSetMembershipLimitAction } from "@/lib/actions/admin";
import { useFormAction } from "@/lib/use-form-action";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Satu kartu per tier. Dipisah jadi form sendiri, bukan satu form besar: menyimpan
 * batas Freemium tidak perlu ikut menulis ulang baris VIP, dan galat pada satu tier
 * tidak membatalkan perubahan tier lain.
 */
export function MembershipLimitForm({
  tier,
  label,
  registryMax,
}: {
  tier: MembershipTier;
  label: string;
  registryMax: number | null;
}) {
  const { action, fields, formError } = useFormAction(adminSetMembershipLimitAction, () => {
    toast.success(`Batas ${label} disimpan.`);
  });
  const inputId = `limit-${tier}`;

  return (
    <form action={action} className="bg-card flex flex-col gap-3 rounded-2xl border p-4 shadow-sm">
      <input type="hidden" name="tier" value={tier} />
      <h2 className="text-body-lg font-bold">{label}</h2>

      {formError && (
        <p className="text-body-sm rounded-xl bg-rose-50 px-3 py-2 text-rose-600">{formError}</p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={inputId}>Maksimal Kado</Label>
        <Input
          id={inputId}
          name="registryMax"
          inputMode="numeric"
          placeholder="Tanpa batas"
          defaultValue={registryMax ?? ""}
          aria-describedby={fields?.registryMax ? `${inputId}-error` : `${inputId}-hint`}
          aria-invalid={!!fields?.registryMax}
        />
        <p id={`${inputId}-hint`} className="text-muted-foreground text-body-sm">
          Kosong = tanpa batas.
        </p>
        <FieldError id={`${inputId}-error`} message={fields?.registryMax} />
      </div>

      <SubmitButton pendingLabel="Menyimpan...">Simpan</SubmitButton>
    </form>
  );
}
