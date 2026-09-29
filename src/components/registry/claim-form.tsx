"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { claimItemAction } from "@/lib/actions/registry";
import { useFormAction } from "@/lib/use-form-action";
import { MAX_NOTE_CHARS } from "@/schemas/registry";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Formulir klaim di halaman publik. Diisi orang tanpa akun, jadi hanya meminta
 * nama, jumlah, pesan, dan nomor resi bila sudah dikirim — tidak ada email atau
 * nomor telepon: data kontak yang tidak dipakai lebih baik tidak dikumpulkan.
 */
export function ClaimButton({
  token,
  itemId,
  itemName,
  remaining,
  allowGroup,
  origin,
}: {
  token: string;
  itemId: string;
  itemName: string;
  remaining: number;
  allowGroup: boolean;
  /** Dari server, supaya tautan klaim yang disalin pengklaim sudah utuh. */
  origin: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="text-body-sm h-11 w-full rounded-xl font-bold">
          <Icon name="card_giftcard" className="text-[16px]" />
          Klaim / Jadikan Hadiah
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hadiahi {itemName}</DialogTitle>
          <DialogDescription>
            Orang tua akan melihat nama Anda dan nomor resinya bila diisi.
          </DialogDescription>
        </DialogHeader>
        <ClaimForm
          token={token}
          itemId={itemId}
          remaining={remaining}
          allowGroup={allowGroup}
          origin={origin}
        />
      </DialogContent>
    </Dialog>
  );
}

function ClaimForm({
  token,
  itemId,
  remaining,
  allowGroup,
  origin,
}: {
  token: string;
  itemId: string;
  remaining: number;
  allowGroup: boolean;
  origin: string;
}) {
  const router = useRouter();
  const [claimToken, setClaimToken] = useState<string | null>(null);

  const { action, fields, formError, values } = useFormAction(
    (formData) => claimItemAction(token, itemId, formData),
    ({ claimToken: ct }) => {
      setClaimToken(ct);
      router.refresh();
    },
  );

  if (claimToken) {
    const link = `${origin}/kado/${token}/klaim/${claimToken}`;
    return (
      <div className="space-y-3">
        <div className="bg-accent text-primary flex items-start gap-2 rounded-xl p-3">
          <Icon name="check_circle" filled className="mt-0.5 text-[18px]" />
          <p className="text-body-sm">
            Terima kasih! Kado ini sudah ditandai atas nama Anda.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-body-sm font-bold">Simpan tautan ini untuk mengisi nomor resi nanti</p>
          <p className="text-muted-foreground text-[12px] break-all">{link}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                navigator.clipboard
                  .writeText(link)
                  .then(() => toast.success("Tautan tersalin"))
                  .catch(() => toast.error("Gagal menyalin — salin manual dari teks"))
              }
            >
              <Icon name="content_copy" className="text-[16px]" />
              Salin Tautan
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href={link}>Isi Nomor Resi Sekarang</a>
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Tautan ini satu-satunya cara mengubah klaim Anda — kami tidak punya akun Anda untuk
            mengirimkannya ulang.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="claimerName">Atas Nama</Label>
        <Input
          id="claimerName"
          name="claimerName"
          required
          maxLength={80}
          placeholder="Tante Rina"
          defaultValue={values.claimerName}
          aria-invalid={!!fields?.claimerName}
          aria-describedby={fields?.claimerName ? "claimer-error" : undefined}
        />
        <FieldError id="claimer-error" message={fields?.claimerName} />
      </div>

      {/*
        Tanpa patungan jumlahnya tidak bisa dipilih — pengklaim mengambil seluruhnya,
        jadi field-nya hidden supaya tetap terkirim tanpa memberi pilihan semu.
      */}
      {allowGroup ? (
        <div className="space-y-2">
          <Label htmlFor="qty">Jumlah yang Anda Berikan</Label>
          <Input
            id="qty"
            name="qty"
            type="number"
            inputMode="numeric"
            min={1}
            max={remaining}
            step={1}
            defaultValue={values.qty ?? 1}
            aria-invalid={!!fields?.qty}
            aria-describedby={fields?.qty ? "qty-error" : "qty-hint"}
          />
          <p id="qty-hint" className="text-muted-foreground text-xs">
            Sisa yang dibutuhkan: {remaining} unit.
          </p>
          <FieldError id="qty-error" message={fields?.qty} />
        </div>
      ) : (
        <input type="hidden" name="qty" value={1} />
      )}

      <div className="space-y-2">
        <Label htmlFor="message">Pesan untuk Orang Tua</Label>
        <Textarea
          id="message"
          name="message"
          rows={2}
          maxLength={MAX_NOTE_CHARS}
          placeholder="Semoga bermanfaat untuk si kecil ya!"
          defaultValue={values.message ?? ""}
          aria-invalid={!!fields?.message}
          aria-describedby={fields?.message ? "message-error" : undefined}
        />
        <FieldError id="message-error" message={fields?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="trackingNumber">Nomor Resi</Label>
        <Input
          id="trackingNumber"
          name="trackingNumber"
          maxLength={50}
          placeholder="JNE 0123456789"
          defaultValue={values.trackingNumber ?? ""}
          aria-invalid={!!fields?.trackingNumber}
          aria-describedby={fields?.trackingNumber ? "tracking-error" : "tracking-hint"}
        />
        <p id="tracking-hint" className="text-muted-foreground text-xs">
          Opsional. Kosongkan bila belum dikirim — Anda bisa menambahkannya nanti lewat tautan
          yang muncul setelah klaim.
        </p>
        <FieldError id="tracking-error" message={fields?.trackingNumber} />
      </div>

      <SubmitButton pendingLabel="Menyimpan...">Konfirmasi Klaim</SubmitButton>
    </form>
  );
}
