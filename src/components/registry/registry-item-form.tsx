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

/**
 * Tiga marketplace; nama field sama dengan registryItemSchema.
 *
 * `autofill` di Shopee dan Tokopedia, tidak di TikTok: `tiktok.com/robots.txt`
 * melarang `/shop/view/product/` — path halaman produknya — untuk semua bot.
 * Alasan lengkapnya di `store-preview.ts`.
 */
const STORES = [
  {
    name: "urlShopee",
    brand: "shopee",
    label: "Shopee",
    placeholder: "https://shopee.co.id/... atau s.shopee.co.id/...",
    autofill: true,
  },
  {
    name: "urlTokopedia",
    brand: "tokopedia",
    label: "Tokopedia",
    placeholder: "https://www.tokopedia.com/toko/nama-barang",
    autofill: true,
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

  // Isi otomatis menulis ke input lewat ref, bukan lewat state: field-field di form ini
  // uncontrolled (defaultValue), dan mengubahnya jadi controlled hanya untuk satu tombol
  // akan menyeret field-field lain ikut punya state.
  const nameRef = useRef<HTMLInputElement>(null);
  const priceMinRef = useRef<HTMLInputElement>(null);
  // Tombol mana yang sedang menunggu; null berarti tidak ada. Bukan boolean karena dua
  // toko punya tombol sendiri dan hanya yang ditekan yang boleh berubah label.
  const [fetchingFor, setFetchingFor] = useState<string | null>(null);
  const [, startFetch] = useTransition();

  const autofillFromStore = (field: string, label: string, url: string) => {
    setFetchingFor(field);
    startFetch(async () => {
      try {
        const res = await fetchStorePreviewAction(url);
        if (!res.success) {
          toast.error(res.error.message);
          return;
        }

        const { name, photo, priceIdr } = res.data;
        if (nameRef.current) nameRef.current.value = name;

        // Harga hanya ditulis kalau kolomnya masih kosong: kalau orang tua sudah
        // mengisi anggarannya sendiri, angka toko tidak boleh menimpanya.
        const filledPrice = Boolean(priceIdr && priceMinRef.current && !priceMinRef.current.value);
        if (filledPrice) priceMinRef.current!.value = String(priceIdr);

        if (photo) {
          // Foto lewat jalur yang sama dengan foto pilihan sendiri: jadi File, lalu
          // ditambahkan ke daftar. Tidak melewati pickPhoto() karena bytes-nya sudah
          // divalidasi tipe dan ukurannya di server.
          const blob = await fetch(photo.dataUrl).then((r) => r.blob());
          const ext =
            blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
          setPhotos((prev) =>
            prev.length >= MAX_PHOTOS
              ? prev
              : [...prev, new File([blob], `${field}.${ext}`, { type: blob.type })],
          );
        }

        const dapat = ["Nama", photo && "foto", filledPrice && "harga"].filter(Boolean);
        toast.success(
          `${dapat.join(", ")} terisi dari ${label}.` +
            (photo ? "" : " Fotonya tidak terbaca — unggah sendiri ya.") +
            (filledPrice || !photo ? "" : " Harga tetap diisi manual."),
        );
      } finally {
        setFetchingFor(null);
      }
    });
  };

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
              {/* Lambang merek dalam kepingan berwarna tokonya — label tetap tertulis,
                  jadi warna bukan satu-satunya penanda. */}
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full",
                  STORE_BRAND[store.brand].bg,
                )}
              >
                <StoreMark brand={store.brand} className="size-3" />
              </span>
              {store.label}
            </Label>
            <div className="flex gap-2">
              <Input
                id={store.name}
                name={store.name}
                type="url"
                inputMode="url"
                placeholder={store.placeholder}
                defaultValue={values[store.name] ?? item?.[store.name] ?? ""}
                aria-invalid={!!fields?.[store.name]}
                aria-describedby={
                  fields?.[store.name]
                    ? `${store.name}-error`
                    : "autofill" in store
                      ? `${store.name}-hint`
                      : undefined
                }
              />
              {"autofill" in store && (
                <Button
                  type="button"
                  // Warna tokonya, bukan outline: tombol ini mengambil data DARI toko
                  // itu, dan warnanya mengikat tombol ke baris yang tepat.
                  className={cn(
                    "shrink-0",
                    STORE_BRAND[store.brand].bg,
                    STORE_BRAND[store.brand].hover,
                  )}
                  // Hanya tombol yang ditekan yang nonaktif: dua toko boleh diisi
                  // berurutan tanpa tombol satunya ikut mati.
                  disabled={fetchingFor !== null}
                  onClick={() => {
                    const el = document.getElementById(store.name) as HTMLInputElement | null;
                    const url = el?.value.trim();
                    if (!url) {
                      toast.error(`Tempel tautan ${store.label}-nya dulu.`);
                      return;
                    }
                    autofillFromStore(store.name, store.label, url);
                  }}
                >
                  <Icon
                    name={fetchingFor === store.name ? "sync" : "download"}
                    className="text-[16px]"
                  />
                  {fetchingFor === store.name ? "Mengambil..." : "Ambil"}
                </Button>
              )}
            </div>
            {"autofill" in store && !fields?.[store.name] && (
              <p id={`${store.name}-hint`} className="text-muted-foreground text-xs">
                Tempel tautan halaman barang lalu tekan <strong>Ambil</strong> untuk mengisi nama
                dan foto otomatis
                {store.name === "urlTokopedia" ? ", termasuk harganya" : " (harga diisi sendiri)"}.
              </p>
            )}
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

      <SubmitButton pendingLabel="Menyimpan...">
        {item ? "Simpan Perubahan" : "Simpan ke Wishlist"}
      </SubmitButton>
    </form>
  );
}
