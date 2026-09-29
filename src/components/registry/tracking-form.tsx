"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateClaimTrackingAction } from "@/lib/actions/registry";
import { useFormAction } from "@/lib/use-form-action";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Pengklaim kembali lewat tautan pribadinya; `claimToken` di URL adalah otorisasinya. */
export function TrackingForm({
  claimToken,
  current,
}: {
  claimToken: string;
  current: string | null;
}) {
  const router = useRouter();
  const { action, fields, formError, values } = useFormAction(
    (formData) => updateClaimTrackingAction(claimToken, formData),
    () => {
      toast.success("Nomor resi tersimpan. Orang tua akan melihatnya.");
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
        <Label htmlFor="trackingNumber">Nomor Resi</Label>
        <Input
          id="trackingNumber"
          name="trackingNumber"
          required
          maxLength={50}
          placeholder="JNE 0123456789"
          defaultValue={values.trackingNumber ?? current ?? ""}
          aria-invalid={!!fields?.trackingNumber}
          aria-describedby={fields?.trackingNumber ? "tracking-error" : "tracking-hint"}
        />
        <p id="tracking-hint" className="text-muted-foreground text-xs">
          Sertakan nama kurirnya bila perlu, misalnya &ldquo;JNE 0123456789&rdquo;.
        </p>
        <FieldError id="tracking-error" message={fields?.trackingNumber} />
      </div>

      <SubmitButton pendingLabel="Menyimpan...">
        {current ? "Perbarui Nomor Resi" : "Simpan Nomor Resi"}
      </SubmitButton>
    </form>
  );
}
