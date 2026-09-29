"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createVaccinationAction, updateVaccinationAction } from "@/lib/actions/vaccinations";
import { useFormAction } from "@/lib/use-form-action";
import { todayLocalISO } from "@/schemas/date";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DateField } from "@/components/ui/date-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Vaccination } from "@/db/schema";
import type { CatalogVaccine } from "@/lib/immunization/catalog";
import { VaccinePicker } from "./vaccine-picker";

export function VaccinationForm({
  childId,
  catalog,
  record,
  freeTextOnly,
  onDone,
}: {
  childId: string;
  /** Diisi saat mencatat dosis dari katalog wajib (nama tidak bisa diubah). */
  catalog?: CatalogVaccine;
  /** Diisi saat mengubah catatan yang sudah ada. */
  record?: Vaccination;
  /**
   * Kolom nama polos tanpa daftar katalog. Dipakai "Tambah Vaksin Lain" di
   * halaman anak: vaksin katalog punya barisnya sendiri di daftar itu, jadi
   * menawarkan daftar yang sama di sini cuma jalan memutar.
   */
  freeTextOnly?: boolean;
  onDone?: () => void;
}) {
  const router = useRouter();
  const isCustomName = !catalog && !record?.catalogKey;
  const displayName = catalog?.name ?? record?.name;

  const { action, fields, formError, values } = useFormAction(
    (formData) =>
      record ? updateVaccinationAction(record.id, formData) : createVaccinationAction(childId, formData),
    () => {
      toast.success(record ? "Catatan vaksinasi diperbarui." : "Vaksinasi tercatat.");
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

      <input type="hidden" name="catalogKey" value={catalog?.key ?? record?.catalogKey ?? ""} />

      {isCustomName ? (
        <div className="space-y-2">
          <Label htmlFor="customName">Nama vaksin</Label>
          {freeTextOnly ? (
            <Input
              id="customName"
              name="customName"
              autoComplete="off"
              placeholder="mis. Influenza"
              maxLength={100}
              required
              defaultValue={values.customName ?? record?.name ?? ""}
              aria-invalid={!!fields?.customName}
              aria-describedby={fields?.customName ? "name-error" : "customName-hint"}
            />
          ) : (
            <VaccinePicker
              defaultValue={values.customName ?? record?.name ?? ""}
              invalid={!!fields?.customName}
              describedBy={fields?.customName ? "name-error" : "customName-hint"}
            />
          )}
          <p id="customName-hint" className="text-muted-foreground text-label-sm">
            {freeTextOnly
              ? "Untuk vaksin di luar jadwal program — vaksin program dicatat dari daftarnya di atas."
              : "Pilih dari daftar vaksin program, atau tulis nama vaksin lain."}
          </p>
          <FieldError id="name-error" message={fields?.customName} />
        </div>
      ) : (
        <div className="space-y-1">
          <Label className="text-muted-foreground">Vaksin</Label>
          <p className="font-medium">{displayName}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="givenAt">Tanggal diberikan</Label>
        <DateField
          id="givenAt"
          name="givenAt"
          max={todayLocalISO()}
          defaultValue={values.givenAt ?? record?.givenAt ?? todayLocalISO()}
          required
          invalid={!!fields?.givenAt}
          describedBy={fields?.givenAt ? "date-error" : undefined}
        />
        <FieldError id="date-error" message={fields?.givenAt} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan (opsional)</Label>
        <Input
          id="notes"
          name="notes"
          placeholder="mis. merk vaksin"
          maxLength={500}
          defaultValue={values.notes ?? record?.notes ?? ""}
          aria-invalid={!!fields?.notes}
          aria-describedby={fields?.notes ? "notes-error" : undefined}
        />
        <FieldError id="notes-error" message={fields?.notes} />
      </div>

      <SubmitButton pendingLabel="Menyimpan...">
        {record ? "Simpan Perubahan" : "Simpan"}
      </SubmitButton>
    </form>
  );
}
