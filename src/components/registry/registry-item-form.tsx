"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createRegistryItemAction,
  fetchStorePreviewAction,
  updateRegistryItemAction,
  uploadRegistryPhotoAction,
} from "@/lib/actions/registry";
import { useFormAction } from "@/lib/use-form-action";
import { compressToWebp } from "@/lib/compress-image";
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
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_PHOTOS, RegistryPhotoPicker } from "./registry-photo-field";
import { STORE_BRAND, StoreMark } from "./registry-shared";
import type { RegistryItem } from "@/db/schema";

const STORE_FIELD = {
  shopee: "urlShopee",
  tokopedia: "urlTokopedia",
  tiktok: "urlTiktok",
} as const;

/** Tautan pembelian tetap boleh diisi manual tanpa membaca halaman toko. */
const STORES = [
  {
    name: "urlShopee",
    brand: "shopee",
    label: "Shopee",
    placeholder: "https://shopee.co.id/... atau s.shopee.co.id/...",
  },
  {
    name: "urlTokopedia",
    brand: "tokopedia",
    label: "Tokopedia",
    placeholder: "https://www.tokopedia.com/toko/nama-barang",
  },
  {
    name: "urlTiktok",
    brand: "tiktok",
    label: "TikTok Shop",
    placeholder: "https://www.tiktok.com/...",
  },
] as const;

/**
 * Chip pilihan tunggal: `<label>` membungkus radio `sr-only` supaya nilainya
 * benar-benar ikut di FormData — bukan tombol yang perlu state sendiri.
 * `focus-within:ring-2` dipakai karena radio yang disembunyikan tidak lagi
 * memperlihatkan fokusnya sendiri.
 *
 * Diekspor karena form katalog Shop memakainya apa adanya.
 */
export function ChipRadio({
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

  // Isi otomatis menulis ke input lewat ref, bukan lewat state: field-field di form ini
  // uncontrolled (defaultValue), dan mengubahnya jadi controlled hanya untuk satu tombol
  // akan menyeret field-field lain ikut punya state.
  const linkRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const priceMinRef = useRef<HTMLInputElement>(null);
  const [reading, startRead] = useTransition();
  const photoRoom = Math.max(0, MAX_PHOTOS - (item?.photoKeys.length ?? 0));

  const readLink = () => {
    const url = linkRef.current?.value.trim();
    if (!url) {
      toast.error("Tempel tautan produknya dulu.");
      return;
    }
    startRead(async () => {
      try {
        const res = await fetchStorePreviewAction(url);
        if (!res.success) {
          toast.error(res.error.message);
          return;
        }

        const { name, description, photos: storePhotos, priceIdr, brand } = res.data;
        const field = linkRef.current?.form?.elements.namedItem(STORE_FIELD[brand]);
        if (field instanceof HTMLInputElement) field.value = url;
        if (brand === "tiktok") {
          toast.info("Tautan TikTok terisi. Nama, deskripsi, foto, dan harga perlu diisi manual.");
          return;
        }

        // Isian manual tidak ditimpa oleh data toko.
        if (nameRef.current && !nameRef.current.value) nameRef.current.value = name;
        if (descriptionRef.current && !descriptionRef.current.value)
          descriptionRef.current.value = description;
        if (priceIdr && priceMinRef.current && !priceMinRef.current.value)
          priceMinRef.current.value = String(priceIdr);

        const files = await Promise.all(
          storePhotos.slice(0, Math.max(0, photoRoom - photos.length)).map(async (photo, index) => {
            const blob = await fetch(photo.dataUrl).then((r) => r.blob());
            const ext =
              blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
            return compressToWebp(new File([blob], `${brand}-${index + 1}.${ext}`, { type: blob.type }));
          }),
        );
        /*
          Di mode UBAH barangnya sudah punya id, jadi fotonya diunggah saat itu
          juga — pemilih foto di form ini hanya ada di mode tambah, dan tanpa
          unggahan langsung foto hasil "Baca" tidak akan pernah sampai ke mana pun.

          Di mode tambah, foto ditahan di state sampai barangnya tersimpan dan
          punya id (lihat `useFormAction` di bawah).
        */
        if (item) {
          if (files.length > 0) {
            const fd = new FormData();
            for (const f of files) fd.append("photo", f);
            const res = await uploadRegistryPhotoAction(item.id, fd);
            if (res.success) router.refresh();
            else toast.warning("Data terbaca, tetapi fotonya gagal diunggah.");
          }
        } else {
          setPhotos((prev) => [...prev, ...files].slice(0, photoRoom));
        }

        toast.success(
          `Data ${STORE_BRAND[brand].label} dibaca. ${files.length} foto ditambahkan.` +
            (description ? "" : " Deskripsi produk tidak tersedia, isi manual.") +
            (storePhotos.length === 1 ? " Hanya satu foto tersedia dari pratinjau tautan." : "") +
            (storePhotos.length ? "" : " Foto tidak tersedia, unggah sendiri ya."),
        );
      } catch {
        toast.error("Gagal membaca tautan. Coba lagi atau isi datanya manual.");
      }
    });
  };

  const { action, fields, formError, values } = useFormAction(
    (formData) =>
      item ? updateRegistryItemAction(item.id, formData) : createRegistryItemAction(formData),
    async ({ id }) => {
      // Barang sudah tersimpan. Foto menyusul; gagal unggah tidak membatalkan
      // apa pun — datanya aman dan fotonya bisa diulang dari halaman ubah.
      if (photos.length > 0) {
        const fd = new FormData();
        for (const photo of photos) fd.append("photo", photo);
        const res = await uploadRegistryPhotoAction(id, fd);
        toast[res.success ? "success" : "warning"](
          res.success
            ? item
              ? "Barang diperbarui."
              : "Barang ditambahkan ke wishlist."
            : "Barang tersimpan, tetapi fotonya gagal diunggah. Coba lagi dari halaman ubah.",
        );
      } else {
        toast.success(item ? "Barang diperbarui." : "Barang ditambahkan ke wishlist.");
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

      <fieldset disabled={reading} className="bg-muted/40 space-y-2 rounded-2xl border p-4">
        <Label htmlFor="storeLink">Tautan Produk (Opsional)</Label>
        <div className="flex gap-2">
          <Input
            id="storeLink"
            name="storeLink"
            type="url"
            inputMode="url"
            ref={linkRef}
            maxLength={500}
            defaultValue={values.storeLink ?? ""}
            placeholder="https://s.shopee.co.id/..."
            aria-describedby="store-link-hint"
          />
          <Button type="button" className="shrink-0" onClick={readLink} aria-busy={reading}>
            <Icon name={reading ? "sync" : "download"} className="text-[16px]" />
            {reading ? "Membaca..." : "Baca"}
          </Button>
        </div>
        <p id="store-link-hint" className="text-muted-foreground text-xs">
          Tempel tautan Shopee atau Tokopedia, lalu tekan Baca. Pratinjau Shopee biasanya hanya
          menyediakan judul dan satu foto; deskripsi serta foto lainnya perlu ditambahkan manual.
          Hingga {MAX_PHOTOS} foto, deskripsi produk, dan harga diambil bila tersedia dalam data
          halaman. Isian yang sudah diisi tidak ditimpa. TikTok hanya mengisi tautan.
        </p>
      </fieldset>

      {/*
        Hanya di mode TAMBAH. Di mode ubah, <RegistryPhotoField> di halaman edit
        sudah berdiri di atas form ini dan mengunggah langsung ke barang yang
        sudah punya id — dua pemilih foto di satu halaman membuat orang menebak
        mana yang berlaku, dan yang di bawah hanya tersimpan setelah form di-submit.

        Foto hasil tombol "Baca" tetap ada jalannya di mode ubah: lihat catatan di
        `readLink`, yang mengunggahnya langsung alih-alih menumpuknya di state.
      */}
      {!item && photoRoom > 0 && (
        <RegistryPhotoPicker
          files={photos}
          onChange={setPhotos}
          max={photoRoom}
          disabled={reading}
        />
      )}

      <fieldset className="space-y-4 rounded-2xl border p-4">
        <legend className="px-1 text-sm font-medium">Rincian Barang Impian</legend>

        <div className="space-y-2">
          <Label htmlFor="name">Nama Barang</Label>
          <Input
            id="name"
            name="name"
            ref={nameRef}
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
            ref={descriptionRef}
            rows={3}
            maxLength={1000}
            placeholder="Warna, ukuran, merek yang dicari..."
            defaultValue={values.description ?? item?.description ?? ""}
            aria-invalid={!!fields?.description}
            aria-describedby={fields?.description ? "description-error" : undefined}
          />
          <FieldError id="description-error" message={fields?.description} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Kategori</Label>
          <select
            id="category"
            name="category"
            defaultValue={values.category ?? item?.category ?? "OTHER"}
            aria-invalid={!!fields?.category}
            aria-describedby={fields?.category ? "category-error" : undefined}
            className="border-input bg-background focus-visible:ring-ring aria-invalid:border-destructive h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
          >
            {REGISTRY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
          <FieldError id="category-error" message={fields?.category} />
        </div>

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
              ref={priceMinRef}
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
        {STORES.map((store) => (
          <div key={store.name} className="space-y-2">
            <Label htmlFor={store.name} className="gap-1.5">
              {/* Lambang resmi tokonya, tanpa keping bulat — label tetap tertulis,
                  jadi warna bukan satu-satunya penanda. */}
              <StoreMark brand={store.brand} className="size-5" />
              {store.label}
            </Label>
            <Input
              id={store.name}
              name={store.name}
              type="url"
              inputMode="url"
              placeholder={store.placeholder}
              defaultValue={values[store.name] ?? item?.[store.name] ?? ""}
              aria-invalid={!!fields?.[store.name]}
              aria-describedby={fields?.[store.name] ? `${store.name}-error` : undefined}
            />
            <FieldError id={`${store.name}-error`} message={fields?.[store.name]} />
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

      <fieldset disabled={reading}>
        <SubmitButton pendingLabel="Menyimpan...">
          {item ? "Simpan Perubahan" : "Simpan ke Wishlist"}
        </SubmitButton>
      </fieldset>
    </form>
  );
}
