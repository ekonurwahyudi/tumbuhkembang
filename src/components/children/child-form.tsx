"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createChildAction,
  updateChildAction,
  uploadChildPhotoAction,
} from "@/lib/actions/children";
import { useFormAction } from "@/lib/use-form-action";
import { GESTATIONAL_AGE_MAX_WEEKS, GESTATIONAL_AGE_MIN_WEEKS } from "@/schemas/child";
import { todayYMD } from "@/lib/growth/age";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DateField } from "@/components/ui/date-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChildPhotoPicker } from "./child-photo-field";
import type { Child } from "@/db/schema";

/** Pengukuran awal (hanya anak baru) — nama field sama dengan measurementSchema. */
const INITIAL_MEASURES = [
  { name: "weightKg", label: "Berat (kg)", placeholder: "3,4", max: 150, step: 0.01 },
  { name: "lengthHeightCm", label: "Panjang (cm)", placeholder: "50", max: 220, step: 0.1 },
  { name: "headCircumferenceCm", label: "Lingkar Kepala (cm)", placeholder: "34", max: 80, step: 0.1 },
] as const;

export function ChildForm({ child }: { child?: Child }) {
  const router = useRouter();
  const [birthType, setBirthType] = useState<"TERM" | "PRETERM">(child?.birthType ?? "TERM");
  // Hanya untuk anak baru: fotonya ditahan sampai ada id yang bisa dituju.
  const [photo, setPhoto] = useState<File | null>(null);

  const { action, fields, formError, values } = useFormAction(
    (formData) =>
      child ? updateChildAction(child.id, formData) : createChildAction(formData),
    async ({ id }) => {
      if (child) {
        toast.success("Data anak diperbarui.");
        router.push(`/children/${id}`);
        return;
      }

      // Anak sudah tersimpan. Foto menyusul, dan kegagalannya tidak
      // membatalkan apa pun — datanya sudah aman, fotonya bisa diulang dari
      // halaman ubah data.
      if (photo) {
        const formData = new FormData();
        formData.set("photo", photo);
        const res = await uploadChildPhotoAction(id, formData);
        toast[res.success ? "success" : "warning"](
          res.success
            ? "Anak berhasil ditambahkan."
            : "Anak tersimpan, tetapi fotonya gagal diunggah. Coba lagi dari Ubah Data Anak.",
        );
      } else {
        toast.success("Anak berhasil ditambahkan.");
      }

      router.push(`/children/${id}`);
    },
  );

  return (
    <form action={action} className="space-y-5" noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {!child && <ChildPhotoPicker file={photo} onSelect={setPhoto} />}

      <div className="space-y-2">
        <Label htmlFor="name">Nama Anak</Label>
        <Input
          id="name"
          name="name"
          defaultValue={values.name ?? child?.name}
          required
          aria-invalid={!!fields?.name}
          aria-describedby={fields?.name ? "name-error" : undefined}
        />
        <FieldError id="name-error" message={fields?.name} />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm leading-none font-medium">Jenis Kelamin</legend>
        <RadioGroup name="sex" defaultValue={values.sex ?? child?.sex} required className="gap-2">
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
        <DateField
          id="dateOfBirth"
          name="dateOfBirth"
          max={todayYMD()}
          defaultValue={values.dateOfBirth ?? child?.dateOfBirth}
          required
          invalid={!!fields?.dateOfBirth}
          describedBy={fields?.dateOfBirth ? "dob-error" : undefined}
        />
        <FieldError id="dob-error" message={fields?.dateOfBirth} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthWeightGrams">Berat Lahir (gram)</Label>
        <Input
          id="birthWeightGrams"
          name="birthWeightGrams"
          type="number"
          inputMode="numeric"
          min={200}
          max={8000}
          step={1}
          placeholder="3000"
          defaultValue={values.birthWeightGrams ?? child?.birthWeightGrams ?? ""}
          aria-invalid={!!fields?.birthWeightGrams}
          aria-describedby={fields?.birthWeightGrams ? "birth-weight-error" : "birth-weight-hint"}
        />
        <p id="birth-weight-hint" className="text-muted-foreground text-xs">
          Opsional. Dipakai untuk cek syarat penundaan Hepatitis B0 (&lt;2000 g) dan BCG
          (&lt;2500 g) pada berat lahir rendah.
        </p>
        <FieldError id="birth-weight-error" message={fields?.birthWeightGrams} />
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
                defaultValue={values.gestationalAgeWeeks ?? child?.gestationalAgeWeeks ?? ""}
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
                defaultValue={values.gestationalAgeDays ?? child?.gestationalAgeDays ?? ""}
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

      {!child && (
        <fieldset className="bg-muted/40 space-y-3 rounded-lg border p-4">
          <legend className="px-1 text-sm font-medium">Pengukuran Saat Ini</legend>
          <p className="text-muted-foreground text-xs">
            Opsional. Bila diisi, langsung tercatat sebagai pengukuran pertama anak dan jadi
            titik awal grafik pertumbuhannya.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {INITIAL_MEASURES.map(({ name, label, placeholder, max, step }) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={name}>{label}</Label>
                <Input
                  id={name}
                  name={name}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={max}
                  step={step}
                  placeholder={placeholder}
                  defaultValue={values[name] ?? ""}
                  aria-invalid={!!fields?.[name]}
                  aria-describedby={fields?.[name] ? `${name}-error` : undefined}
                />
                <FieldError id={`${name}-error`} message={fields?.[name]} />
              </div>
            ))}
          </div>
        </fieldset>
      )}

      <SubmitButton pendingLabel="Menyimpan...">
        {child ? "Simpan Perubahan" : "Simpan"}
      </SubmitButton>
    </form>
  );
}
