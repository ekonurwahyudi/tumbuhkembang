"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  removeClaimPhotoAction,
  updateClaimTrackingAction,
  uploadClaimPhotoAction,
} from "@/lib/actions/registry";
import { useFormAction } from "@/lib/use-form-action";
import { MAX_PHOTO_BYTES } from "@/lib/storage-limits";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { PhotoRow, formatSize, pickPhoto } from "@/components/children/child-photo-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MB = Math.round(MAX_PHOTO_BYTES / 1024 / 1024);

/**
 * Bukti pengiriman dari pengklaim: nomor resi ATAU foto barangnya. Dua bentuk yang
 * sama sahnya, bukan satu wajib dan satu tambahan — tidak semua orang membeli lewat
 * kurir berresi, sebagian membelikannya langsung di toko.
 *
 * `claimToken` di URL adalah otorisasinya untuk keduanya; tidak ada sesi.
 */
export function TrackingForm({
  token,
  claimToken,
  current,
  hasPhoto,
}: {
  token: string;
  claimToken: string;
  current: string | null;
  hasPhoto: boolean;
}) {
  /*
    Ucapan terima kasih muncul setelah buktinya tersimpan — dua jalurnya sama-sama
    memicu, karena resi dan foto adalah bukti yang sama sahnya. Toast tidak cukup di
    sini: ini akhir perjalanan si pengklaim, dan satu baris yang hilang dalam tiga
    detik terbaca seperti konfirmasi sistem, bukan terima kasih.
  */
  const [thanks, setThanks] = useState(false);

  return (
    <div className="space-y-5">
      <ClaimPhotoField
        token={token}
        claimToken={claimToken}
        hasPhoto={hasPhoto}
        onSaved={() => setThanks(true)}
      />
      <div className="flex items-center gap-2">
        <span className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-label-sm font-bold">ATAU</span>
        <span className="bg-border h-px flex-1" />
      </div>
      <TrackingNumberForm
        claimToken={claimToken}
        current={current}
        onSaved={() => setThanks(true)}
      />

      <ThanksDialog open={thanks} onClose={() => setThanks(false)} />
    </div>
  );
}

/**
 * Terima kasih setelah bukti tersimpan.
 *
 * Tombolnya menutup dialog, bukan berpindah halaman: formulir resi dan unggah foto
 * ada tepat di belakangnya, jadi "ubah" berarti kembali ke tempat yang sama.
 */
function ThanksDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="text-center sm:max-w-sm">
        <DialogHeader className="items-center">
          <span className="bg-accent text-primary mx-auto grid size-16 place-items-center rounded-full">
            <Icon name="favorite" filled className="text-[32px]" />
          </span>
          <DialogTitle className="mt-2">Terima kasih atas kadonya!</DialogTitle>
          <DialogDescription>
            Semoga si kecil senang menerimanya dan selalu sehat. Orang tuanya sudah bisa melihat
            bukti pengiriman Anda.
          </DialogDescription>
        </DialogHeader>
        <Button type="button" variant="outline" onClick={onClose} className="rounded-full">
          <Icon name="edit" className="text-[16px]" />
          Ubah Resi / Ganti Foto
        </Button>
      </DialogContent>
    </Dialog>
  );
}

/** Foto barang sebagai bukti. Satu foto per klaim — unggahan baru menggantinya. */
function ClaimPhotoField({
  token,
  claimToken,
  hasPhoto,
  onSaved,
}: {
  token: string;
  claimToken: string;
  hasPhoto: boolean;
  onSaved: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onFiles = (files: File[]) =>
    startTransition(async () => {
      const picked = await pickPhoto(files[0]);
      if ("error" in picked) {
        setError(picked.error);
        return;
      }
      setError(null);

      const fd = new FormData();
      fd.append("photo", picked.file);
      const res = await uploadClaimPhotoAction(claimToken, fd);
      if (res.success) {
        toast.success(
          files[0].size > picked.file.size
            ? `Foto terkirim (${formatSize(files[0].size)} → ${formatSize(picked.file.size)}).`
            : "Foto terkirim. Orang tua akan melihatnya.",
        );
        onSaved();
        router.refresh();
      } else {
        setError(res.error.fields?.photo ?? res.error.message);
      }
    });

  const remove = () =>
    startTransition(async () => {
      const res = await removeClaimPhotoAction(claimToken);
      if (res.success) {
        toast.success("Foto dihapus.");
        router.refresh();
      } else {
        setError(res.error.message);
      }
    });

  return (
    <PhotoRow
      label="Foto Barang"
      hint={`Opsional, satu foto (maksimal ${MB} MB, JPG/PNG/WebP). Dipakai bila Anda tidak punya nomor resi — misalnya barangnya dibeli langsung di toko. Hanya orang tua yang bisa melihatnya.`}
      error={error}
      inputRef={inputRef}
      onFiles={onFiles}
      avatar={
        hasPhoto ? (
          <span className="bg-accent ring-accent block size-16 shrink-0 overflow-hidden rounded-xl ring-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- route foto berotorisasi, bukan aset statis untuk next/image */}
            <img
              src={`/kado/${token}/klaim/${claimToken}/foto`}
              alt="Foto barang yang Anda kirim"
              className="size-full object-cover"
            />
          </span>
        ) : (
          <span className="bg-accent text-primary ring-accent grid size-16 shrink-0 place-items-center rounded-xl ring-2">
            <Icon name="card_giftcard" filled className="text-[32px]" />
          </span>
        )
      }
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            <Icon name="add" className="text-[16px]" />
            {hasPhoto ? "Ganti Foto" : "Unggah Foto Barang"}
          </Button>
          {hasPhoto && (
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={remove}>
              <Icon name="close" className="text-[16px]" />
              Hapus
            </Button>
          )}
        </>
      }
    />
  );
}

function TrackingNumberForm({
  claimToken,
  current,
  onSaved,
}: {
  claimToken: string;
  current: string | null;
  onSaved: () => void;
}) {
  const router = useRouter();
  /*
    Mengosongkan lalu menyimpan berarti MENGHAPUS resi — itu bukan kado yang baru
    masuk, jadi tidak diucapkan terima kasih. Isinya dibaca dari formData yang
    barusan dikirim, bukan dari `values` yang baru terisi setelah action selesai.
  */
  const sentRef = useRef(false);
  const { action, fields, formError, values } = useFormAction(
    (formData) => {
      sentRef.current = String(formData.get("trackingNumber") ?? "").trim().length > 0;
      return updateClaimTrackingAction(claimToken, formData);
    },
    () => {
      toast.success("Bukti tersimpan. Orang tua akan melihatnya.");
      if (sentRef.current) onSaved();
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
          maxLength={50}
          placeholder="JNE 0123456789"
          defaultValue={values.trackingNumber ?? current ?? ""}
          aria-invalid={!!fields?.trackingNumber}
          aria-describedby={fields?.trackingNumber ? "tracking-error" : "tracking-hint"}
        />
        <p id="tracking-hint" className="text-muted-foreground text-xs">
          Opsional. Sertakan nama kurirnya bila perlu, misalnya &ldquo;JNE 0123456789&rdquo;.
          Kosongkan lalu simpan untuk menghapus resi yang sudah terisi.
        </p>
        <FieldError id="tracking-error" message={fields?.trackingNumber} />
      </div>

      <SubmitButton pendingLabel="Menyimpan...">
        {current ? "Perbarui Nomor Resi" : "Simpan Nomor Resi"}
      </SubmitButton>
    </form>
  );
}
