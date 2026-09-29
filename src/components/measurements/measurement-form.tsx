"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createMeasurementAction, updateMeasurementAction } from "@/lib/actions/measurements";
import { useFormAction } from "@/lib/use-form-action";
import { todayYMD } from "@/lib/growth/age";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DateField } from "@/components/ui/date-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GrowthMeasurement } from "@/db/schema";

export function MeasurementForm({
  childId,
  measurement,
  minDate,
  onDone,
}: {
  childId: string;
  measurement?: GrowthMeasurement;
  /** Tanggal lahir anak — pengukuran tidak mungkin sebelum ini. */
  minDate: string;
  onDone?: () => void;
}) {
  const router = useRouter();

  const { action, fields, formError, values } = useFormAction(
    (formData) => {
      const grams = formData.get("weightKg");
      if (typeof grams === "string" && grams.trim() !== "") {
        formData.set("weightKg", (Number(grams) / 1000).toString());
      }
      return measurement
        ? updateMeasurementAction(measurement.id, formData)
        : createMeasurementAction(childId, formData);
    },
    () => {
      toast.success(measurement ? "Pengukuran diperbarui." : "Pengukuran disimpan.");
      onDone?.();
      router.refresh();
    },
  );

  return (
    <form action={action} className="space-y-4" noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="measuredAt">Tanggal Pengukuran</Label>
        <DateField
          id="measuredAt"
          name="measuredAt"
          min={minDate}
          max={todayYMD()}
          defaultValue={values.measuredAt ?? measurement?.measuredAt ?? todayYMD()}
          required
          invalid={!!fields?.measuredAt}
          describedBy={fields?.measuredAt ? "measured-error" : undefined}
        />
        <FieldError id="measured-error" message={fields?.measuredAt} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="weightKg">Berat Badan (gram)</Label>
        <Input
          id="weightKg"
          name="weightKg"
          type="number"
          inputMode="numeric"
          step={1}
          min={0}
          max={150000}
          placeholder="7400"
          defaultValue={
            values.weightKg ??
            (measurement?.weightKg != null ? Math.round(Number(measurement.weightKg) * 1000) : "")
          }
          aria-invalid={!!fields?.weightKg}
          aria-describedby={fields?.weightKg ? "weight-error" : undefined}
        />
        <FieldError id="weight-error" message={fields?.weightKg} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lengthHeightCm">Panjang/Tinggi Badan (cm)</Label>
        <Input
          id="lengthHeightCm"
          name="lengthHeightCm"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          placeholder="67.8"
          defaultValue={values.lengthHeightCm ?? measurement?.lengthHeightCm ?? ""}
          aria-invalid={!!fields?.lengthHeightCm}
          aria-describedby={fields?.lengthHeightCm ? "length-error" : undefined}
        />
        <FieldError id="length-error" message={fields?.lengthHeightCm} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="headCircumferenceCm">Lingkar Kepala (cm)</Label>
        <Input
          id="headCircumferenceCm"
          name="headCircumferenceCm"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          placeholder="43.2"
          defaultValue={values.headCircumferenceCm ?? measurement?.headCircumferenceCm ?? ""}
          aria-invalid={!!fields?.headCircumferenceCm}
          aria-describedby={fields?.headCircumferenceCm ? "head-error" : "measure-hint"}
        />
        <FieldError id="head-error" message={fields?.headCircumferenceCm} />
      </div>

      <p id="measure-hint" className="text-muted-foreground text-xs">
        Isi minimal satu nilai. Kolom yang dikosongkan tidak akan disimpan.
      </p>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan (opsional)</Label>
        <Input
          id="notes"
          name="notes"
          maxLength={500}
          defaultValue={values.notes ?? measurement?.notes ?? ""}
          aria-invalid={!!fields?.notes}
          aria-describedby={fields?.notes ? "notes-error" : undefined}
        />
        <FieldError id="notes-error" message={fields?.notes} />
      </div>

      <SubmitButton pendingLabel="Menyimpan...">
        {measurement ? "Simpan Perubahan" : "Simpan Pengukuran"}
      </SubmitButton>
    </form>
  );
}
