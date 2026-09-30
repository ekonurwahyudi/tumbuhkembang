"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveShippingAction } from "@/lib/actions/registry";
import { useFormAction } from "@/lib/use-form-action";
import { BANK_CODES, BANKS } from "@/schemas/registry";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
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
import { LokasiPicker } from "./lokasi-picker";
import { BankChip } from "./registry-shared";

/**
 * Bentuk apa adanya dari `getShippingSettings`: semuanya nullable karena kolomnya
 * nullable — akun lama tidak punya alamat, dan UI-lah yang mewajibkannya, bukan DB.
 */
export type ShippingDraft = {
  shipName: string | null;
  shipPhone: string | null;
  shipProvince: string | null;
  shipCity: string | null;
  shipDistrict: string | null;
  shipAddress: string | null;
  bankName: string | null;
  bankHolder: string | null;
  bankAccount: string | null;
  bankPublic: boolean;
};

/**
 * Alamat kirim + rekening opsional. Dialog, bukan halaman sendiri: diisi sekali
 * lalu jarang disentuh lagi, dan tempatnya memang di sebelah kartu bagikan —
 * alamat adalah bagian dari "wishlist ini siap dibagikan".
 *
 * Kecamatan/kota/provinsi diisi `LokasiPicker` (satu ketikan, tiga nilai). Semua
 * field tetap divalidasi ulang di `shippingSchema` di server: dropdown bukan penjaga.
 */
export function ShippingDialog({
  current,
  complete,
}: {
  current: ShippingDraft | null;
  /** Alamat sudah lengkap — mengubah teks tombol dan menghilangkan nudge-nya. */
  complete: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-primary inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-semibold shadow-sm active:scale-95 dark:bg-white/10"
        >
          <Icon name="home" className="text-[14px]" />
          {complete ? "Ubah Alamat Kirim" : "Isi Alamat Kirim"}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] max-w-md gap-0 overflow-y-auto px-5 pt-6 pb-5">
        <DialogHeader className="px-0">
          <DialogTitle className="text-left text-[17px]">Alamat Pengiriman Kado</DialogTitle>
          <DialogDescription className="text-left text-[13px]">
            Tampil di halaman publik wishlist Anda, supaya pemberi hadiah tahu ke mana kadonya
            dikirim.
          </DialogDescription>
        </DialogHeader>

        <ShippingForm
          current={current}
          onSaved={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function ShippingForm({
  current,
  onSaved,
}: {
  current: ShippingDraft | null;
  onSaved: () => void;
}) {
  const { action, fields, formError, values } = useFormAction(saveShippingAction, () => {
    toast.success("Alamat kirim disimpan.");
    onSaved();
  });

  // Sakelar dan bank dikendalikan supaya bagian rekening bisa disembunyikan dan
  // chip banknya ikut berubah saat dipilih.
  const [bankPublic, setBankPublic] = useState(current?.bankPublic ?? false);
  const [bankName, setBankName] = useState(current?.bankName ?? "");

  const lokasi =
    current?.shipProvince && current.shipCity && current.shipDistrict
      ? {
          province: current.shipProvince,
          city: current.shipCity,
          district: current.shipDistrict,
        }
      : null;

  return (
    <form action={action} className="mt-4 space-y-4" noValidate>
      {formError && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] text-rose-600">{formError}</p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="shipName">Nama Penerima</Label>
        <Input
          id="shipName"
          name="shipName"
          autoComplete="name"
          placeholder="Nama yang tertera di paket"
          defaultValue={values.shipName ?? current?.shipName ?? ""}
          aria-invalid={!!fields?.shipName}
          aria-describedby={fields?.shipName ? "shipName-error" : undefined}
        />
        <FieldError id="shipName-error" message={fields?.shipName} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="shipPhone">No. HP</Label>
        <Input
          id="shipPhone"
          name="shipPhone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0812-3456-7890"
          defaultValue={values.shipPhone ?? current?.shipPhone ?? ""}
          aria-invalid={!!fields?.shipPhone}
          aria-describedby={fields?.shipPhone ? "shipPhone-error" : undefined}
        />
        <FieldError id="shipPhone-error" message={fields?.shipPhone} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lokasi">Kecamatan, Kota/Kabupaten, Provinsi</Label>
        <LokasiPicker
          defaultValue={lokasi}
          invalid={!!(fields?.shipDistrict || fields?.shipCity || fields?.shipProvince)}
          describedBy="lokasi-error"
        />
        <FieldError
          id="lokasi-error"
          message={fields?.shipDistrict ?? fields?.shipCity ?? fields?.shipProvince}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="shipAddress">Alamat Lengkap</Label>
        <Textarea
          id="shipAddress"
          name="shipAddress"
          rows={3}
          maxLength={300}
          placeholder="Jl. Melati No. 12, RT 03 / RW 05, patokan seberang masjid"
          defaultValue={values.shipAddress ?? current?.shipAddress ?? ""}
          aria-invalid={!!fields?.shipAddress}
          aria-describedby={fields?.shipAddress ? "shipAddress-error" : undefined}
        />
        <FieldError id="shipAddress-error" message={fields?.shipAddress} />
      </div>

      <fieldset className="space-y-3 rounded-2xl border p-4">
        <legend className="px-1 text-sm font-medium">Kirim Tunai (Opsional)</legend>

        {/* Checkbox HTML polos: tidak ada primitive Switch di repo ini, dan
            nilainya ikut di FormData tanpa input tambahan. */}
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="bankPublic"
            checked={bankPublic}
            onChange={(e) => setBankPublic(e.target.checked)}
            className="accent-primary mt-0.5 size-4 shrink-0"
          />
          <span>
            <span className="text-body-sm block font-bold">Tampilkan Nomor Rekening</span>
            <span className="text-muted-foreground text-label-sm block">
              Siapa pun yang punya tautan wishlist bisa melihatnya. Biarkan mati bila Anda hanya
              ingin menerima barang.
            </span>
          </span>
        </label>

        {bankPublic && (
          <div className="space-y-3 border-t pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="bankName">Bank</Label>
              {/* <select> bawaan: di HP ini membuka picker asli sistem, dan 16 pilihan
                  tidak perlu popover. Chip di bawahnya memperlihatkan warna merek. */}
              <select
                id="bankName"
                name="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                aria-invalid={!!fields?.bankName}
                aria-describedby={fields?.bankName ? "bankName-error" : undefined}
                className="border-input bg-background h-11 w-full rounded-xl border px-3 text-[15px] outline-none focus-visible:ring-2"
              >
                <option value="">Pilih bank…</option>
                {BANK_CODES.map((code) => (
                  <option key={code} value={code}>
                    {BANKS[code].label}
                  </option>
                ))}
              </select>
              {bankName && <BankChip code={bankName} className="pt-0.5" />}
              <FieldError id="bankName-error" message={fields?.bankName} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bankHolder">Nama Pemilik Rekening</Label>
              <Input
                id="bankHolder"
                name="bankHolder"
                placeholder="Sesuai buku tabungan"
                defaultValue={values.bankHolder ?? current?.bankHolder ?? ""}
                aria-invalid={!!fields?.bankHolder}
                aria-describedby={fields?.bankHolder ? "bankHolder-error" : undefined}
              />
              <FieldError id="bankHolder-error" message={fields?.bankHolder} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bankAccount">Nomor Rekening</Label>
              <Input
                id="bankAccount"
                name="bankAccount"
                inputMode="numeric"
                maxLength={34}
                placeholder="1234567890"
                defaultValue={values.bankAccount ?? current?.bankAccount ?? ""}
                aria-invalid={!!fields?.bankAccount}
                aria-describedby={fields?.bankAccount ? "bankAccount-error" : undefined}
                className="tabular-nums"
              />
              <FieldError id="bankAccount-error" message={fields?.bankAccount} />
            </div>
          </div>
        )}
      </fieldset>

      <SubmitButton pendingLabel="Menyimpan...">Simpan Alamat</SubmitButton>
    </form>
  );
}
