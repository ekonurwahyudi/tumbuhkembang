"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createChildAction, updateChildAction } from "@/lib/actions/children";
import { GESTATIONAL_AGE_MAX_WEEKS, GESTATIONAL_AGE_MIN_WEEKS } from "@/schemas/child";
import { todayYMD } from "@/lib/growth/age";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ActionResult } from "@/lib/action-result";
import type { Child } from "@/db/schema";

type State = ActionResult<{ id: string }> | null;

export function ChildForm({ child }: { child?: Child }) {
  const router = useRouter();
  const [birthType, setBirthType] = useState<"TERM" | "PRETERM">(child?.birthType ?? "TERM");

  const [state, action] = useActionState(async (_prev: State, formData: FormData) => {
    const result = child
      ? await updateChildAction(child.id, formData)
      : await createChildAction(formData);

    if (result.success) {
      toast.success(child ? "Data anak diperbarui." : "Anak berhasil ditambahkan.");
      router.push(`/children/${result.data.id}`);
    }
    return result;
  }, null);

  const fields = state && !state.success ? state.error.fields : undefined;
  const formError = state && !state.success && !fields ? state.error.message : undefined;

  return (
    <form action={action} className="space-y-5" noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nama Anak</Label>
        <Input
          id="name"
          name="name"
          defaultValue={child?.name}
          required
          aria-invalid={!!fields?.name}
          aria-describedby={fields?.name ? "name-error" : undefined}
        />
        <FieldError id="name-error" message={fields?.name} />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm leading-none font-medium">Jenis Kelamin</legend>
        <RadioGroup name="sex" defaultValue={child?.sex} required className="gap-2">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="MALE" id="sex-male" />
            <Label htmlFor="sex-male" className="font-normal">
              Laki-laki
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="FEMALE" id="sex-female" />
            <Label htmlFor="sex-female" className="font-normal">
              Perempuan
            </Label>
          </div>
        </RadioGroup>
        <p className="text-muted-foreground text-xs">
          Diperlukan karena reference pertumbuhan berbeda antara anak laki-laki dan perempuan.
        </p>
        <FieldError id="sex-error" message={fields?.sex} />
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">Tanggal Lahir</Label>
        <Input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          max={todayYMD()}
          defaultValue={child?.dateOfBirth}
          required
          aria-invalid={!!fields?.dateOfBirth}
          aria-describedby={fields?.dateOfBirth ? "dob-error" : undefined}
        />
        <FieldError id="dob-error" message={fields?.dateOfBirth} />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm leading-none font-medium">Status Kelahiran</legend>
        <RadioGroup
          name="birthType"
          value={birthType}
          onValueChange={(v) => setBirthType(v as "TERM" | "PRETERM")}
          required
          className="gap-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="TERM" id="birth-term" />
            <Label htmlFor="birth-term" className="font-normal">
              Cukup Bulan / Term
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="PRETERM" id="birth-preterm" />
            <Label htmlFor="birth-preterm" className="font-normal">
              Prematur / Preterm
            </Label>
          </div>
        </RadioGroup>
        <FieldError id="birth-error" message={fields?.birthType} />
      </fieldset>

      {birthType === "PRETERM" && (
        <fieldset className="bg-muted/40 space-y-3 rounded-lg border p-4">
          <legend className="px-1 text-sm font-medium">Usia Kehamilan Saat Lahir</legend>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="gestationalAgeWeeks">Minggu</Label>
              <Input
                id="gestationalAgeWeeks"
                name="gestationalAgeWeeks"
                type="number"
                inputMode="numeric"
                min={GESTATIONAL_AGE_MIN_WEEKS}
                max={GESTATIONAL_AGE_MAX_WEEKS}
                step={1}
                placeholder="32"
                defaultValue={child?.gestationalAgeWeeks ?? ""}
                aria-invalid={!!fields?.gestationalAgeWeeks}
                aria-describedby={
                  fields?.gestationalAgeWeeks ? "ga-weeks-error" : "ga-hint"
                }
              />
              <FieldError id="ga-weeks-error" message={fields?.gestationalAgeWeeks} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gestationalAgeDays">Hari</Label>
              <Input
                id="gestationalAgeDays"
                name="gestationalAgeDays"
                type="number"
                inputMode="numeric"
                min={0}
                max={6}
                step={1}
                placeholder="4"
                defaultValue={child?.gestationalAgeDays ?? ""}
                aria-invalid={!!fields?.gestationalAgeDays}
                aria-describedby={fields?.gestationalAgeDays ? "ga-days-error" : "ga-hint"}
              />
              <FieldError id="ga-days-error" message={fields?.gestationalAgeDays} />
            </div>
          </div>
          <p id="ga-hint" className="text-muted-foreground text-xs">
            Contoh: 32 minggu 4 hari. Hari diisi 0–6. Dipakai untuk menghitung corrected age.
          </p>
        </fieldset>
      )}

      <SubmitButton pendingLabel="Menyimpan...">
        {child ? "Simpan Perubahan" : "Simpan"}
      </SubmitButton>
    </form>
  );
}
