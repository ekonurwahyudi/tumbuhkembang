"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createFeedingAction, updateFeedingAction } from "@/lib/actions/feeding";
import { useFormAction } from "@/lib/use-form-action";
import { FEEDING_TYPE_LABEL, FEEDING_TYPES, nowDefaults } from "@/schemas/feeding";
import { todayLocalISO } from "@/schemas/date";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { FeedingLog } from "@/db/schema";

/** Pecah timestamp jadi nilai awal input tanggal dan jam (waktu lokal). */
function splitFedAt(fedAt: Date) {
  return {
    date: todayLocalISO(fedAt),
    time: `${String(fedAt.getHours()).padStart(2, "0")}:${String(fedAt.getMinutes()).padStart(2, "0")}`,
  };
}

export function FeedingForm({
  childId,
  log,
  onDone,
}: {
  childId: string;
  log?: FeedingLog;
  onDone?: () => void;
}) {
  const router = useRouter();
  const initial = log ? splitFedAt(log.fedAt) : nowDefaults();

  const [feedingType, setFeedingType] = useState<FeedingLog["feedingType"]>(
    log?.feedingType ?? "BREAST_DIRECT",
  );

  const { action, fields, formError, values } = useFormAction(
    (formData) =>
      log ? updateFeedingAction(log.id, formData) : createFeedingAction(childId, formData),
    () => {
      toast.success(log ? "Catatan asupan diperbarui." : "Asupan tercatat.");
      onDone?.();
      router.refresh();
    },
  );

  const amountOptional = feedingType === "BREAST_DIRECT";

  return (
    <form action={action} className="space-y-4" noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm leading-none font-medium">Jenis</legend>
        <RadioGroup
          name="feedingType"
          value={feedingType}
          onValueChange={(v) => setFeedingType(v as FeedingLog["feedingType"])}
          required
          className="gap-2"
        >
          {FEEDING_TYPES.map((type) => (
            <div key={type} className="flex items-center gap-2">
              <RadioGroupItem value={type} id={`feeding-${type}`} />
              <Label htmlFor={`feeding-${type}`} className="font-normal">
                {FEEDING_TYPE_LABEL[type]}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <FieldError id="type-error" message={fields?.feedingType} />
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="amountMl">
          Jumlah (ml){amountOptional && <span className="text-muted-foreground"> — opsional</span>}
        </Label>
        <Input
          id="amountMl"
          name="amountMl"
          type="number"
          inputMode="decimal"
          step="1"
          min="0"
          placeholder="90"
          defaultValue={values.amountMl ?? log?.amountMl ?? ""}
          aria-invalid={!!fields?.amountMl}
          aria-describedby={fields?.amountMl ? "amount-error" : "amount-hint"}
        />
        <FieldError id="amount-error" message={fields?.amountMl} />
        {!fields?.amountMl && amountOptional && (
          <p id="amount-hint" className="text-muted-foreground text-xs">
            Boleh dikosongkan — volume ASI langsung tidak selalu dapat diketahui. Sesi tanpa
            volume dihitung sebagai jumlah sesi, tidak masuk total ml.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="fedDate">Tanggal</Label>
          <Input
            id="fedDate"
            name="fedDate"
            type="date"
            max={todayLocalISO()}
            defaultValue={values.fedDate ?? initial.date}
            required
            aria-invalid={!!fields?.fedDate}
            aria-describedby={fields?.fedDate ? "date-error" : undefined}
          />
          <FieldError id="date-error" message={fields?.fedDate} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fedTime">Jam</Label>
          <Input
            id="fedTime"
            name="fedTime"
            type="time"
            defaultValue={values.fedTime ?? initial.time}
            required
            aria-invalid={!!fields?.fedTime}
            aria-describedby={fields?.fedTime ? "time-error" : undefined}
          />
          <FieldError id="time-error" message={fields?.fedTime} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan (opsional)</Label>
        <Input
          id="notes"
          name="notes"
          maxLength={500}
          defaultValue={values.notes ?? log?.notes ?? ""}
          aria-invalid={!!fields?.notes}
          aria-describedby={fields?.notes ? "notes-error" : undefined}
        />
        <FieldError id="notes-error" message={fields?.notes} />
      </div>

      <SubmitButton pendingLabel="Menyimpan...">
        {log ? "Simpan Perubahan" : "Simpan"}
      </SubmitButton>
    </form>
  );
}
