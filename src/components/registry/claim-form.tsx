"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { claimItemAction, uploadClaimPhotoAction } from "@/lib/actions/registry";
import { useFormAction } from "@/lib/use-form-action";
import { MAX_PHOTO_BYTES } from "@/lib/storage-limits";
import { MAX_NOTE_CHARS } from "@/schemas/registry";
import { cn } from "@/lib/utils";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { PhotoRow, pickPhoto } from "@/components/children/child-photo-field";
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
 * Bentuk bukti yang dipilih pengklaim saat mengklaim.
 *
 * `foto` tidak bisa diunggah di formulir ini: `uploadClaimPhotoAction` butuh
 * `claimToken`, dan token itu baru ada setelah klaimnya tersimpan. Jadi memilih
 * foto bukan mengubah formulir, melainkan mengubah apa yang ditonjolkan sesudahnya —
 * tautan unggah jadi tombol utama, bukan tautan sampingan.
 */
type ProofMode = "later" | "resi" | "foto";

const MB = Math.round(MAX_PHOTO_BYTES / 1024 / 1024);

/**
 * Formulir klaim di halaman publik. Diisi orang tanpa akun, jadi hanya meminta
 * nama, jumlah, pesan, dan bukti belinya — tidak ada email atau nomor telepon:
 * data kontak yang tidak dipakai lebih baik tidak dikumpulkan.
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
        {/*
          Kuning butter, bukan biru primer: tombol ini satu-satunya aksi utama di
          kartu, dan di halaman publik ia bersaing dengan chip toko berwarna merek.
          `--color-on-butter` adalah teks gelap pasangannya di globals.css, jadi
          kontrasnya tetap terbaca di terang maupun gelap.
        */}
        <Button
          size="lg"
          className="text-body-sm w-full bg-[var(--color-butter-bright)] font-bold text-[var(--color-on-butter)] shadow-sm hover:bg-[var(--color-butter-pastel)]"
        >
          <Icon name="card_giftcard" filled className="text-[18px]" />
          Klaim / Jadikan Hadiah
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hadiahi {itemName}</DialogTitle>
          <DialogDescription>
            Orang tua akan melihat nama Anda, dan bukti pengirimannya bila diisi.
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
  const [proof, setProof] = useState<ProofMode>("later");
  /*
    Foto dipegang di klien sampai klaimnya punya token, lalu diunggah sendiri —
    `uploadClaimPhotoAction` butuh `claimToken`, dan token itu baru ada setelah
    barisnya tersimpan. Jadi fotonya tetap bisa dipilih di formulir ini; yang
    tertunda hanya pengirimannya, satu detik sesudahnya dan tanpa halaman lain.
  */
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoSent, setPhotoSent] = useState(false);

  const { action, fields, formError, values } = useFormAction(
    (formData) => claimItemAction(token, itemId, formData),
    async ({ claimToken: ct }) => {
      setClaimToken(ct);
      if (photo) {
        const fd = new FormData();
        fd.append("photo", photo);
        const res = await uploadClaimPhotoAction(ct, fd);
        if (res.success) setPhotoSent(true);
        else toast.error(res.error.fields?.photo ?? res.error.message);
      }
      router.refresh();
    },
  );

  if (claimToken) {
    const link = `${origin}/kado/${token}/klaim/${claimToken}`;
    // Foto yang gagal terkirim tetap perlu diselesaikan; itu yang ditonjolkan.
    const needsPhoto = proof === "foto" && !photoSent;
    return (
      <div className="space-y-3">
        <div className="bg-accent text-primary flex items-start gap-2 rounded-xl p-3">
          <Icon name="check_circle" filled className="mt-0.5 text-[18px]" />
          <p className="text-body-sm">
            {photoSent
              ? "Terima kasih! Kado dan foto barangnya sudah tercatat atas nama Anda. Semoga si kecil senang menerimanya."
              : "Terima kasih! Kado ini sudah ditandai atas nama Anda."}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-body-sm font-bold">
            {needsPhoto
              ? "Fotonya belum terkirim — unggah lewat halaman ini"
              : "Simpan tautan ini untuk mengubah resi atau foto barangnya nanti"}
          </p>
          <p className="text-muted-foreground text-[12px] break-all">{link}</p>
          <div className="flex flex-wrap gap-2">
            {needsPhoto && (
              <Button asChild size="sm">
                <a href={link}>
                  <Icon name="add" className="text-[16px]" />
                  Unggah Foto Barang
                </a>
              </Button>
            )}
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
            {!needsPhoto && (
              <Button asChild variant="ghost" size="sm">
                <a href={link}>{photoSent ? "Ganti Foto / Isi Resi" : "Kirim Bukti Sekarang"}</a>
              </Button>
            )}
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

      {/*
        Bukti belinya: resi, foto, atau nanti. Sebelumnya hanya ada satu kolom resi
        opsional, dan satu kolom kosong tidak memberi tahu orang bahwa foto barang
        sama sahnya — separuh pengklaim membeli langsung di toko dan tidak punya resi.
      */}
      <fieldset className="space-y-2">
        <legend className="text-body-sm mb-2 font-bold">Sudah dibeli?</legend>
        <ProofChoice
          value="later"
          current={proof}
          onSelect={setProof}
          icon="schedule"
          label="Belum, saya klaim dulu"
          hint="Tautan untuk mengirim bukti muncul setelah ini."
        />
        <ProofChoice
          value="resi"
          current={proof}
          onSelect={setProof}
          icon="list_alt"
          label="Sudah, saya punya nomor resi"
          hint="Isi resinya sekarang."
        />
        <ProofChoice
          value="foto"
          current={proof}
          onSelect={setProof}
          icon="card_giftcard"
          label="Sudah, dibeli langsung di toko"
          hint="Unggah foto barangnya sebagai bukti."
        />
      </fieldset>

      {proof === "foto" && <ClaimPhotoPicker file={photo} onPick={setPhoto} />}

      {/*
        Kolom resi hanya muncul bila dipilih — tapi tetap ada di DOM saat dipilih saja,
        jadi yang memilih foto tidak mengirimkan resi kosong yang tidak berarti.
      */}
      {proof === "resi" && (
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
            Sertakan nama kurirnya bila perlu. Bisa juga diperbaiki nanti lewat tautan klaim.
          </p>
          <FieldError id="tracking-error" message={fields?.trackingNumber} />
        </div>
      )}

      <SubmitButton pendingLabel="Menyimpan...">
        {proof === "foto" ? "Klaim & Lanjut Unggah Foto" : "Konfirmasi Klaim"}
      </SubmitButton>
    </form>
  );
}

/**
 * Pemilih foto barang di dalam formulir klaim.
 *
 * Berkasnya hanya disimpan di state, tidak ikut `<form action>`: unggahannya butuh
 * `claimToken` yang baru lahir setelah klaimnya tersimpan. `pickPhoto` sudah
 * memeriksa tipe dan ukuran lalu mengecilkannya ke WebP — sama seperti unggahan foto
 * lain di aplikasi ini. Pemeriksaan sebenarnya tetap di server
 * (`uploadClaimPhotoAction`); yang di sini cuma kenyamanan.
 */
function ClaimPhotoPicker({
  file,
  onPick,
}: {
  file: File | null;
  onPick: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Pratinjau dari berkas terpilih — dibuat di render, dibersihkan saat berganti.
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  return (
    <PhotoRow
      label="Foto Barang"
      hint={`Satu foto (maksimal ${MB} MB, JPG/PNG/WebP). Terkirim bersama klaim Anda; hanya orang tua yang bisa melihatnya.`}
      error={error}
      inputRef={inputRef}
      onFiles={(files) => {
        setBusy(true);
        void pickPhoto(files[0]).then((picked) => {
          setBusy(false);
          if ("error" in picked) {
            setError(picked.error);
            return;
          }
          setError(null);
          onPick(picked.file);
        });
      }}
      avatar={
        preview ? (
          <span className="bg-accent ring-accent block size-16 shrink-0 overflow-hidden rounded-xl ring-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- blob: URL berkas lokal, bukan aset untuk next/image */}
            <img src={preview} alt="Pratinjau foto barang" className="size-full object-cover" />
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
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <Icon name="add" className="text-[16px]" />
            {busy ? "Menyiapkan..." : file ? "Ganti Foto" : "Pilih Foto Barang"}
          </Button>
          {file && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onPick(null)}>
              <Icon name="close" className="text-[16px]" />
              Hapus
            </Button>
          )}
        </>
      }
    />
  );
}

/**
 * Satu pilihan bukti. `<input type="radio">` sungguhan di dalam `<label>`, bukan
 * tombol ber-`aria-pressed`: panah atas/bawah dan pembaca layar sudah mengerti
 * grup radio tanpa kode tambahan. Radionya `sr-only` — yang terlihat kotaknya.
 *
 * Tanpa `name` HTML: nilainya tidak ikut terkirim ke server (server tidak butuh
 * tahu pilihan ini — yang ia terima tetap resi atau tidak ada resi), jadi
 * `value`-nya hanya menggerakkan tampilan.
 */
function ProofChoice({
  value,
  current,
  onSelect,
  icon,
  label,
  hint,
}: {
  value: ProofMode;
  current: ProofMode;
  onSelect: (v: ProofMode) => void;
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  hint: string;
}) {
  const active = current === value;
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
        active ? "border-primary bg-accent" : "bg-card hover:bg-muted",
      )}
    >
      <input type="radio" className="sr-only" checked={active} onChange={() => onSelect(value)} />
      <Icon
        name={icon}
        filled={active}
        className={cn(
          "mt-0.5 shrink-0 text-[18px]",
          active ? "text-primary" : "text-muted-foreground",
        )}
      />
      <span className="min-w-0">
        <span className={cn("text-body-sm block font-bold", active && "text-primary")}>
          {label}
        </span>
        <span className="text-muted-foreground text-label-sm block">{hint}</span>
      </span>
      {/* Centang, bukan warna saja: penanda terpilih tidak boleh bergantung pada warna. */}
      {active && <Icon name="check_circle" filled className="text-primary ml-auto text-[18px]" />}
    </label>
  );
}
