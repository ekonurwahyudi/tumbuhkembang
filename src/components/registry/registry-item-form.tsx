"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createRegistryItemAction,
  updateRegistryItemAction,
  uploadRegistryPhotoAction,
} from "@/lib/actions/registry";
import { useFormAction } from "@/lib/use-form-action";
import {
  CATEGORY_LABEL,
  MAX_NOTE_CHARS,
  MAX_QTY,
  PRIORITY_LABEL,
  REGISTRY_CATEGORIES,
  REGISTRY_PRIORITIES,
} from "@/schemas/registry";
import { cn } from "@/lib/utils";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RegistryPhotoPicker } from "./registry-photo-field";
import type { RegistryItem } from "@/db/schema";

/** Tiga marketplace; nama field sama dengan registryItemSchema. */
const STORES = [
  { name: "urlShopee", label: "Shopee", placeholder: "https://shopee.co.id/..." },
  { name: "urlTokopedia", label: "Tokopedia", placeholder: "https://www.tokopedia.com/..." },
  { name: "urlTiktok", label: "TikTok Shop", placeholder: "https://www.tiktok.com/..." },
] as const;

/**
 * Chip pilihan tunggal: `<label>` membungkus radio `sr-only` supaya nilainya
 * benar-benar ikut di FormData — bukan tombol yang perlu state sendiri.
 * `focus-within:ring-2` dipakai karena radio yang disembunyikan tidak lagi
 * memperlihatkan fokusnya sendiri.
 */
function ChipRadio({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label
      className={cn(
        "text-label-sm cursor-pointer rounded-full border px-3 py-2 font-bold transition-colors",
        "focus-within:ring-ring focus-within:ring-2 focus-within:ring-offset-2",
        "has-checked:bg-primary has-checked:text-primary-foreground has-checked:border-primary",
        "bg-card text-muted-foreground",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="sr-only"
      />
      {label}
    </label>
  );
}

export function RegistryItemForm({
  item,
  childrenList,
}: {
  item?: RegistryItem;
  childrenList: { id: string; name: string }[];
}) {
  const router = useRouter();
  // Barang baru belum punya id untuk dituju, jadi fotonya ditahan sampai tersimpan.
  const [photos, setPhotos] = useState<File[]>([]);
  const [noteLen, setNoteLen] = useState(item?.note?.length ?? 0);

  const { action, fields, formError, values } = useFormAction(
    (formData) =>
      item ? updateRegistryItemAction(item.id, formData) : createRegistryItemAction(formData),
    async ({ id }) => {
      if (item) {
        toast.success("Barang diperbarui.");
        router.push("/registry");
        return;
      }

      // Barang sudah tersimpan. Foto menyusul; gagal unggah tidak membatalkan
      // apa pun — datanya aman dan fotonya bisa diulang dari halaman ubah.
      if (photos.length > 0) {
        const fd = new FormData();
        for (const photo of photos) fd.append("photo", photo);
        const res = await uploadRegistryPhotoAction(id, fd);
        toast[res.success ? "success" : "warning"](
          res.success
            ? "Barang ditambahkan ke wishlist."
            : "Barang tersimpan, tetapi fotonya gagal diunggah. Coba lagi dari halaman ubah.",
        );
      } else {
        toast.success("Barang ditambahkan ke wishlist.");
      }
      router.push("/registry");
    },
  );

  return (
    <form action={action} className="space-y-5" noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {!item && <RegistryPhotoPicker files={photos} onChange={setPhotos} />}

      <fieldset className="space-y-4 rounded-2xl border p-4">
        <legend className="px-1 text-sm font-medium">Rincian Barang Impian</legend>

        <div className="space-y-2">
          <Label htmlFor="name">Nama Barang</Label>
          <Input
            id="name"
            name="name"
            required
            maxLength={120}
            placeholder="Stroller ringan kabin"
            defaultValue={values.name ?? item?.name}
            aria-invalid={!!fields?.name}
            aria-describedby={fields?.name ? "name-error" : undefined}
          />
          <FieldError id="name-error" message={fields?.name} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            maxLength={1000}
            placeholder="Warna, ukuran, merek yang dicari..."
            defaultValue={values.description ?? item?.description ?? ""}
            aria-invalid={!!fields?.description}
            aria-describedby={fields?.description ? "description-error" : undefined}
          />
          <FieldError id="description-error" message={fields?.description} />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm leading-none font-medium">Kategori</legend>
          <div className="flex flex-wrap gap-1.5">
            {REGISTRY_CATEGORIES.map((c) => (
              <ChipRadio
                key={c}
                name="category"
                value={c}
                label={CATEGORY_LABEL[c]}
                defaultChecked={(values.category ?? item?.category ?? "OTHER") === c}
              />
            ))}
          </div>
          <FieldError id="category-error" message={fields?.category} />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm leading-none font-medium">Prioritas</legend>
          <div className="flex flex-wrap gap-1.5">
            {REGISTRY_PRIORITIES.map((p) => (
              <ChipRadio
                key={p}
                name="priority"
                value={p}
                label={PRIORITY_LABEL[p]}
                defaultChecked={(values.priority ?? item?.priority ?? "NORMAL") === p}
              />
            ))}
          </div>
          <FieldError id="priority-error" message={fields?.priority} />
        </fieldset>

        {childrenList.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="text-sm leading-none font-medium">Untuk Anak</legend>
            <div className="flex flex-wrap gap-1.5">
              <ChipRadio
                name="childId"
                value=""
                label="Tidak spesifik"
                defaultChecked={!(values.childId ?? item?.childId)}
              />
              {childrenList.map((c) => (
                <ChipRadio
                  key={c.id}
                  name="childId"
                  value={c.id}
                  label={c.name}
                  defaultChecked={(values.childId ?? item?.childId) === c.id}
                />
              ))}
            </div>
            <FieldError id="childId-error" message={fields?.childId} />
          </fieldset>
        )}

        <div className="space-y-2">
          <Label htmlFor="desiredQty">Jumlah Diinginkan</Label>
          <Input
            id="desiredQty"
            name="desiredQty"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_QTY}
            step={1}
            defaultValue={values.desiredQty ?? item?.desiredQty ?? 1}
            aria-invalid={!!fields?.desiredQty}
            aria-describedby={fields?.desiredQty ? "qty-error" : undefined}
          />
          <FieldError id="qty-error" message={fields?.desiredQty} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="priceMin">Harga Dari (Rp)</Label>
            <Input
              id="priceMin"
              name="priceMin"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              placeholder="750000"
              defaultValue={values.priceMin ?? item?.priceMinIdr ?? ""}
              aria-invalid={!!fields?.priceMin}
              aria-describedby={fields?.priceMin ? "price-min-error" : "price-hint"}
            />
            <FieldError id="price-min-error" message={fields?.priceMin} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priceMax">Sampai (Rp)</Label>
            <Input
              id="priceMax"
              name="priceMax"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              placeholder="850000"
              defaultValue={values.priceMax ?? item?.priceMaxIdr ?? ""}
              aria-invalid={!!fields?.priceMax}
              aria-describedby={fields?.priceMax ? "price-max-error" : "price-hint"}
            />
            <FieldError id="price-max-error" message={fields?.priceMax} />
          </div>
          <p id="price-hint" className="text-muted-foreground col-span-2 text-xs">
            Opsional. Membantu pemberi hadiah memperkirakan anggaran.
          </p>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-2xl border p-4">
        <legend className="px-1 text-sm font-medium">Tautan Belanja Online</legend>
        <p className="text-muted-foreground text-xs">
          Opsional. Tautan harus dari toko yang sesuai supaya pemberi hadiah tidak diarahkan ke
          situs lain.
        </p>
        {STORES.map(({ name, label, placeholder }) => (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>{label}</Label>
            <Input
              id={name}
              name={name}
              type="url"
              inputMode="url"
              placeholder={placeholder}
              defaultValue={values[name] ?? item?.[name] ?? ""}
              aria-invalid={!!fields?.[name]}
              aria-describedby={fields?.[name] ? `${name}-error` : undefined}
            />
            <FieldError id={`${name}-error`} message={fields?.[name]} />
          </div>
        ))}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="note">Catatan Spesifik untuk Pemberi Hadiah</Label>
        <Textarea
          id="note"
          name="note"
          rows={3}
          maxLength={MAX_NOTE_CHARS}
          placeholder="Kami sudah punya yang ukuran S, jadi cari ukuran M ya."
          defaultValue={values.note ?? item?.note ?? ""}
          onChange={(e) => setNoteLen(e.target.value.length)}
          aria-invalid={!!fields?.note}
          aria-describedby="note-count"
        />
        <p id="note-count" className="text-muted-foreground text-xs tabular-nums">
          {noteLen}/{MAX_NOTE_CHARS} karakter
        </p>
        <FieldError id="note-error" message={fields?.note} />
      </div>

      {/*
        Dua sakelar memakai checkbox HTML polos: tidak ada primitive Switch di repo
        ini, dan checkbox ikut terkirim di FormData tanpa state tambahan.
      */}
      <fieldset className="space-y-3 rounded-2xl border p-4">
        <legend className="px-1 text-sm font-medium">Visibilitas &amp; Partisipasi Kado</legend>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="isPublic"
            defaultChecked={item ? item.isPublic : true}
            className="accent-primary mt-0.5 size-4 shrink-0"
          />
          <span>
            <span className="text-body-sm block font-bold">Tampilkan di Wishlist Publik</span>
            <span className="text-muted-foreground text-label-sm block">
              Matikan untuk menyimpan barang ini hanya untuk Anda.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="allowGroup"
            defaultChecked={item?.allowGroup ?? false}
            className="accent-primary mt-0.5 size-4 shrink-0"
          />
          <span>
            <span className="text-body-sm block font-bold">Izinkan Pembelian Patungan</span>
            <span className="text-muted-foreground text-label-sm block">
              Beberapa orang boleh mengambil sebagian dari jumlah yang dibutuhkan.
            </span>
          </span>
        </label>
      </fieldset>

      <SubmitButton pendingLabel="Menyimpan...">
        {item ? "Simpan Perubahan" : "Simpan ke Wishlist"}
      </SubmitButton>
    </form>
  );
}
