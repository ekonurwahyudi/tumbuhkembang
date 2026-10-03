"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createShopProductAction,
  readStoreLinkAction,
  updateShopProductAction,
  uploadShopPhotoAction,
} from "@/lib/actions/shop";
import { useFormAction } from "@/lib/use-form-action";
import {
  MAX_SHOP_PHOTOS,
  SHOP_CATEGORY_LABEL,
  SHOP_GROUPS,
  categoriesOfGroup,
} from "@/schemas/shop";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RegistryPhotoPicker } from "@/components/registry/registry-photo-field";
import { STORE_BRAND, StoreMark } from "@/components/registry/registry-shared";
import { SHOP_PHOTO_HINT } from "./admin-shop-photo-field";
import type { ShopProduct } from "@/db/schema";

/**
 * Form katalog Shop. Bedanya dari form wishlist cuma satu, dan itu yang diminta:
 * **satu** kolom tautan di atas, bukan tiga. Host-nya yang menentukan kolom tautan
 * toko mana yang terisi, dan keputusan itu diambil di server
 * (`readStoreLinkAction` → `storeBrandOf`) supaya daftar host-nya tidak pernah
 * jadi dua.
 *
 * Field-nya uncontrolled (`defaultValue`) dan autofill menulis lewat `ref`:
 * mengubahnya jadi controlled hanya demi satu tombol akan menyeret seluruh field
 * lain ikut punya state.
 */
const STORE_FIELD = {
  shopee: "urlShopee",
  tokopedia: "urlTokopedia",
  tiktok: "urlTiktok",
} as const;

/** Tiga kolom tautan tetap ada di bawah: satu produk boleh punya tautan di tiga toko. */
const STORES = [
  { name: "urlShopee", brand: "shopee", placeholder: "https://shopee.co.id/..." },
  { name: "urlTokopedia", brand: "tokopedia", placeholder: "https://www.tokopedia.com/..." },
  { name: "urlTiktok", brand: "tiktok", placeholder: "https://www.tiktok.com/..." },
] as const;

export function AdminShopForm({ product }: { product?: ShopProduct }) {
  const router = useRouter();
  // Produk baru belum punya id untuk dituju, jadi fotonya ditahan sampai tersimpan.
  const [photos, setPhotos] = useState<File[]>([]);

  const linkRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);
  const [, startRead] = useTransition();

  const readLink = () => {
    const url = linkRef.current?.value.trim();
    if (!url) {
      toast.error("Tempel tautan produknya dulu.");
      return;
    }

    setReading(true);
    startRead(async () => {
      try {
        const res = await readStoreLinkAction(url);
        if (!res.success) {
          toast.error(res.error.message);
          return;
        }

        const { name, photo, priceIdr, brand } = res.data;
        const store = STORE_BRAND[brand].label;

        // Kolom tautan toko yang sesuai selalu terisi — termasuk TikTok, yang
        // halamannya tidak boleh dibaca tapi tautannya tetap tersimpan.
        const field = document.getElementById(STORE_FIELD[brand]) as HTMLInputElement | null;
        if (field) field.value = url;

        if (brand === "tiktok") {
          toast.info(
            `Tautan TikTok tersimpan di kolomnya. Halaman produk TikTok tidak boleh dibaca otomatis, jadi nama, foto, dan harganya diisi manual.`,
          );
          return;
        }

        if (name && nameRef.current && !nameRef.current.value) nameRef.current.value = name;

        // Harga toko adalah harga jualnya. Hanya ditulis bila kolomnya masih kosong:
        // angka yang sudah diisi admin tidak boleh ditimpa.
        const filledPrice = Boolean(priceIdr && priceRef.current && !priceRef.current.value);
        if (filledPrice) priceRef.current!.value = String(priceIdr);

        if (photo) {
          // Lewat jalur yang sama dengan foto pilihan tangan: jadi File, lalu masuk
          // daftar unggahan. Bytes-nya sudah divalidasi tipe dan ukuran di server,
          // jadi tidak melewati pickPhoto() lagi.
          const blob = await fetch(photo.dataUrl).then((r) => r.blob());
          const ext =
            blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
          setPhotos((prev) =>
            prev.length >= MAX_SHOP_PHOTOS
              ? prev
              : [...prev, new File([blob], `${brand}.${ext}`, { type: blob.type })],
          );
        }

        const dapat = ["Tautan", name && "nama", photo && "foto", filledPrice && "harga"].filter(
          Boolean,
        );
        toast.success(
          `${dapat.join(", ")} terisi dari ${store}.` +
            (photo ? "" : " Fotonya tidak terbaca — unggah sendiri ya.") +
            (filledPrice ? "" : ` Harga dari ${store} tidak tersedia, isi manual.`),
        );
      } finally {
        setReading(false);
      }
    });
  };

  const { action, fields, formError, values } = useFormAction(
    (formData) =>
      product ? updateShopProductAction(product.id, formData) : createShopProductAction(formData),
    async ({ id }) => {
      if (product) {
        toast.success("Produk diperbarui.");
        router.push("/admin/shop");
        return;
      }

      // Barisnya sudah tersimpan. Foto menyusul; gagal unggah tidak membatalkan
      // apa pun — fotonya bisa diulang dari halaman ubah.
      if (photos.length > 0) {
        const fd = new FormData();
        for (const photo of photos) fd.append("photo", photo);
        const res = await uploadShopPhotoAction(id, fd);
        toast[res.success ? "success" : "warning"](
          res.success
            ? "Produk ditambahkan ke katalog."
            : "Produk tersimpan, tetapi fotonya gagal diunggah. Coba lagi dari halaman ubah.",
        );
      } else {
        toast.success("Produk ditambahkan ke katalog.");
      }
      router.push("/admin/shop");
    },
  );

  return (
    <form action={action} className="space-y-5" noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {/*
        Kolom baca di luar <fieldset> rincian dan di paling atas: ini pintu masuk
        yang dimaksud "cukup 1 kolom input". Isinya tidak ikut tersimpan — yang
        tersimpan adalah kolom tautan toko di bawah yang diisinya.
      */}
      <div className="bg-muted/40 space-y-2 rounded-2xl border p-4">
        <Label htmlFor="storeLink">Tempel Tautan Produk</Label>
        <div className="flex gap-2">
          <Input
            id="storeLink"
            name="storeLink"
            type="url"
            inputMode="url"
            ref={linkRef}
            placeholder="https://s.shopee.co.id/60S055iVg8"
            aria-describedby="store-link-hint"
          />
          <Button type="button" className="shrink-0" disabled={reading} onClick={readLink}>
            <Icon name={reading ? "sync" : "download"} className="text-[16px]" />
            {reading ? "Membaca..." : "Baca"}
          </Button>
        </div>
        <p id="store-link-hint" className="text-muted-foreground text-xs">
          Shopee, Tokopedia, atau TikTok — tokonya dikenali sendiri dari tautannya. Dari TikTok
          hanya tautannya yang tersimpan: halaman produknya tidak boleh dibaca otomatis. Harga hanya
          terisi dari Tokopedia.
        </p>
      </div>

      {!product && (
        <RegistryPhotoPicker
          files={photos}
          onChange={setPhotos}
          max={MAX_SHOP_PHOTOS}
          label="Foto Produk"
          hint={SHOP_PHOTO_HINT}
        />
      )}

      <fieldset className="space-y-4 rounded-2xl border p-4">
        <legend className="px-1 text-sm font-medium">Rincian Produk</legend>

        <div className="space-y-2">
          <Label htmlFor="name">Nama Produk</Label>
          <Input
            id="name"
            name="name"
            ref={nameRef}
            required
            maxLength={160}
            placeholder="Pompa ASI elektrik wireless"
            defaultValue={values.name ?? product?.name}
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
            rows={4}
            maxLength={2000}
            placeholder="Kenapa produk ini direkomendasikan, untuk usia berapa, apa yang perlu diperhatikan..."
            defaultValue={values.description ?? product?.description ?? ""}
            aria-invalid={!!fields?.description}
            aria-describedby={fields?.description ? "description-error" : undefined}
          />
          <FieldError id="description-error" message={fields?.description} />
        </div>

        {/*
          Satu <select> dengan <optgroup>, bukan tiga belas chip: sederet chip sepanjang
          itu memakan separuh form. Label grupnya tidak bisa dipilih, jadi tidak perlu
          penjaga tambahan. `<select>` bawaan dengan alasan yang sama seperti SortSelect
          di MyRegistry: di HP ia membuka picker asli sistem.
        */}
        <div className="space-y-2">
          <Label htmlFor="category">Kategori</Label>
          <select
            id="category"
            name="category"
            defaultValue={values.category ?? product?.category ?? "OTHER"}
            aria-invalid={!!fields?.category}
            aria-describedby={fields?.category ? "category-error" : undefined}
            className="border-input bg-background focus-visible:ring-ring aria-invalid:border-destructive h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
          >
            {SHOP_GROUPS.map((group) => (
              <optgroup key={group} label={group}>
                {categoriesOfGroup(group).map((c) => (
                  <option key={c} value={c}>
                    {SHOP_CATEGORY_LABEL[c]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <FieldError id="category-error" message={fields?.category} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="price">Harga Jual (Rp)</Label>
            <Input
              id="price"
              name="price"
              ref={priceRef}
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              placeholder="100000"
              defaultValue={values.price ?? product?.priceIdr ?? ""}
              aria-invalid={!!fields?.price}
              aria-describedby={fields?.price ? "price-error" : "price-hint"}
            />
            <FieldError id="price-error" message={fields?.price} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priceOriginal">Harga Asli (Rp)</Label>
            <Input
              id="priceOriginal"
              name="priceOriginal"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              placeholder="125000"
              defaultValue={values.priceOriginal ?? product?.priceOriginalIdr ?? ""}
              aria-invalid={!!fields?.priceOriginal}
              aria-describedby={fields?.priceOriginal ? "price-original-error" : "price-hint"}
            />
            <FieldError id="price-original-error" message={fields?.priceOriginal} />
          </div>
          <p id="price-hint" className="text-muted-foreground col-span-2 text-xs">
            Harga asli adalah harga sebelum diskon — ditampilkan dicoret beserta persen diskonnya.
            Kosongkan bila produknya tidak sedang diskon.
          </p>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-2xl border p-4">
        <legend className="px-1 text-sm font-medium">Tautan Pembelian</legend>
        <p className="text-muted-foreground text-xs">
          Terisi sendiri oleh tombol <strong>Baca</strong> di atas, satu toko per sekali tempel.
          Boleh juga ditempel langsung di sini.
        </p>
        {STORES.map((store) => (
          <div key={store.name} className="space-y-2">
            <Label htmlFor={store.name} className="gap-1.5">
              <StoreMark brand={store.brand} className="size-5" />
              {STORE_BRAND[store.brand].label}
            </Label>
            <Input
              id={store.name}
              name={store.name}
              type="url"
              inputMode="url"
              placeholder={store.placeholder}
              defaultValue={values[store.name] ?? product?.[store.name] ?? ""}
              aria-invalid={!!fields?.[store.name]}
              aria-describedby={fields?.[store.name] ? `${store.name}-error` : undefined}
            />
            <FieldError id={`${store.name}-error`} message={fields?.[store.name]} />
          </div>
        ))}
      </fieldset>

      <fieldset className="space-y-3 rounded-2xl border p-4">
        <legend className="px-1 text-sm font-medium">Tampilan &amp; Urutan</legend>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={product?.isPublished ?? false}
            className="accent-primary mt-0.5 size-4 shrink-0"
          />
          <span>
            <span className="text-body-sm block font-bold">Terbitkan ke Halaman Shop</span>
            <span className="text-muted-foreground text-label-sm block">
              Selama mati, produk ini hanya terlihat di halaman admin.
            </span>
          </span>
        </label>

        <div className="space-y-2">
          <Label htmlFor="sortOrder">Urutan Tampil</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            inputMode="numeric"
            min={0}
            max={9999}
            step={1}
            defaultValue={values.sortOrder ?? product?.sortOrder ?? 0}
            aria-invalid={!!fields?.sortOrder}
            aria-describedby={fields?.sortOrder ? "sort-error" : "sort-hint"}
          />
          <p id="sort-hint" className="text-muted-foreground text-xs">
            Angka kecil tampil lebih dulu. Yang sama urutannya diurutkan dari yang terbaru.
          </p>
          <FieldError id="sort-error" message={fields?.sortOrder} />
        </div>
      </fieldset>

      <SubmitButton pendingLabel="Menyimpan...">
        {product ? "Simpan Perubahan" : "Simpan Produk"}
      </SubmitButton>
    </form>
  );
}
