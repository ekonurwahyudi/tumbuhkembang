"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { removeRegistryPhotoAction, uploadRegistryPhotoAction } from "@/lib/actions/registry";
import { MAX_PHOTO_BYTES } from "@/lib/storage-limits";
import type { ActionResult } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PhotoRow, formatSize, pickPhoto } from "@/components/children/child-photo-field";
import type { RegistryItem } from "@/db/schema";

/**
 * Foto barang wishlist — boleh beberapa sudut, foto pertama jadi foto utama di
 * daftar dan halaman publik. Validasi, kompresi, dan kerangka tampilannya dipakai
 * ulang dari child-photo-field.tsx; yang beda hanya jumlah foto, action, dan teks
 * petunjuknya (foto ini akan terlihat publik bila barangnya dibagikan).
 *
 * Batasnya disalin dari MAX_ITEM_PHOTOS di data/registry.ts — server tetap yang
 * menegakkan; angka di sini supaya tombolnya mati sebelum unggahan ditolak.
 *
 * Sejak katalog Shop ada, action/URL/batas/label disuntik lewat prop, bukan
 * di-hardcode: dua modul memakai komponen ini, dan kompresi + validasi + petak
 * thumbnail-nya tetap satu sumber kebenaran. Default-nya tetap registry supaya
 * pemanggil lamanya tidak berubah.
 */
export const MAX_PHOTOS = 5;
const MB = Math.round(MAX_PHOTO_BYTES / 1024 / 1024);
const HINT = `Opsional, sampai ${MAX_PHOTOS} foto (maksimal ${MB} MB per foto, JPG/PNG/WebP). Foto pertama jadi foto utama. Foto ini terlihat oleh siapa pun yang membuka tautan wishlist Anda.`;

/** Apa yang membedakan satu modul dari modul lain — tidak lebih dari ini. */
export type PhotoOwner = {
  id: string;
  photoKeys: string[];
  upload: (id: string, fd: FormData) => Promise<ActionResult<{ id: string }>>;
  remove: (id: string, key: string) => Promise<ActionResult>;
  /** Route foto berotorisasi modul itu. */
  src: (id: string, index: number) => string;
  max: number;
  label: string;
  hint: string;
};

const registryOwner = (item: RegistryItem): PhotoOwner => ({
  id: item.id,
  photoKeys: item.photoKeys,
  upload: uploadRegistryPhotoAction,
  remove: removeRegistryPhotoAction,
  src: (id, i) => `/registry/${id}/photo?i=${i}`,
  max: MAX_PHOTOS,
  label: "Foto Barang Impian",
  hint: HINT,
});

/** Petak foto: satu tombol hapus per foto, plus penanda "Utama" di yang pertama. */
function Thumbs({
  srcs,
  onRemove,
  disabled,
}: {
  srcs: string[];
  onRemove?: (index: number) => void;
  disabled?: boolean;
}) {
  if (srcs.length === 0)
    return (
      <span className="bg-accent text-primary ring-accent grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl ring-2">
        <Icon name="card_giftcard" filled className="text-[32px]" />
      </span>
    );

  return (
    <ul className="flex flex-wrap gap-2">
      {srcs.map((src, i) => (
        <li key={src} className="relative">
          <span className="bg-accent ring-accent block size-16 overflow-hidden rounded-xl ring-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- blob lokal / route foto, bukan aset yang bisa dioptimalkan next/image */}
            <img
              src={src}
              alt={`Pratinjau foto barang ${i + 1}`}
              className="size-full object-cover"
            />
          </span>
          {i === 0 && (
            <span className="bg-primary text-primary-foreground absolute bottom-0 left-0 rounded-br-xl rounded-tl-none px-1.5 text-[10px] font-bold">
              Utama
            </span>
          )}
          {onRemove && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRemove(i)}
              aria-label={`Hapus foto ${i + 1}`}
              className="bg-card text-muted-foreground ring-border absolute -top-1.5 -right-1.5 grid size-6 place-items-center rounded-full ring-1 disabled:opacity-50"
            >
              <Icon name="close" className="text-[14px]" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Mode barang yang sudah ada: unggahan langsung berlaku. */
export function RegistryPhotoField({ item }: { item: RegistryItem }) {
  return <PhotoField owner={registryOwner(item)} />;
}

/** Mode baris yang sudah ada, modul apa pun: unggahan langsung berlaku. */
export function PhotoField({ owner }: { owner: PhotoOwner }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const keys = owner.photoKeys;
  const full = keys.length >= owner.max;

  const onFiles = (files: File[]) =>
    startTransition(async () => {
      const room = owner.max - keys.length;
      if (files.length > room) {
        setError(`Sisa kuota ${room} foto lagi. Hapus foto lain dulu atau pilih lebih sedikit.`);
        return;
      }

      const fd = new FormData();
      let before = 0;
      let after = 0;
      for (const file of files) {
        const picked = await pickPhoto(file);
        if ("error" in picked) {
          setError(picked.error);
          return;
        }
        before += file.size;
        after += picked.file.size;
        fd.append("photo", picked.file);
      }
      setError(null);

      const res = await owner.upload(owner.id, fd);
      if (res.success) {
        const n = files.length;
        toast.success(
          before > after
            ? `${n} foto ditambahkan (${formatSize(before)} → ${formatSize(after)}).`
            : `${n} foto ditambahkan.`,
        );
        router.refresh();
      } else {
        setError(res.error.fields?.photo ?? res.error.message);
      }
    });

  const removeAt = (index: number) =>
    startTransition(async () => {
      const res = await owner.remove(owner.id, keys[index]);
      if (res.success) {
        toast.success("Foto dihapus.");
        router.refresh();
      } else {
        setError(res.error.message);
      }
    });

  return (
    <PhotoRow
      label={owner.label}
      hint={owner.hint}
      error={error}
      inputRef={inputRef}
      onFiles={onFiles}
      multiple
      avatar={
        <Thumbs
          srcs={keys.map((_, i) => owner.src(owner.id, i))}
          onRemove={removeAt}
          disabled={pending}
        />
      }
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || full}
            onClick={() => inputRef.current?.click()}
          >
            <Icon name="add" className="text-[16px]" />
            {keys.length === 0 ? "Unggah Foto" : "Tambah Foto"}
          </Button>
          {full && (
            <span className="text-muted-foreground text-label-sm self-center">
              Kuota {owner.max} foto penuh
            </span>
          )}
        </>
      }
    />
  );
}

/** Mode barang baru: foto ditahan di client sampai barangnya punya id. */
export function RegistryPhotoPicker({
  files,
  onChange,
  disabled,
  max = MAX_PHOTOS,
  label = "Foto Barang Impian",
  hint = HINT,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  /** Katalog Shop punya kuota dan label sendiri; default-nya tetap registry. */
  max?: number;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Object URL diturunkan dari daftar berkas, bukan disimpan di state.
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  const onFiles = (picked: File[]) =>
    startTransition(async () => {
      const room = max - files.length;
      if (picked.length > room) {
        setError(`Maksimal ${max} foto. Sisa kuota ${room} foto lagi.`);
        return;
      }

      const next: File[] = [];
      for (const file of picked) {
        const result = await pickPhoto(file);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        next.push(result.file);
      }
      setError(null);
      onChange([...files, ...next]);
    });

  return (
    <PhotoRow
      label={label}
      hint={hint}
      error={error}
      inputRef={inputRef}
      onFiles={onFiles}
      multiple
      avatar={
        <Thumbs
          srcs={previews}
          onRemove={(i) => onChange(files.filter((_, n) => n !== i))}
          disabled={disabled || pending}
        />
      }
      actions={
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || pending || files.length >= max}
          onClick={() => inputRef.current?.click()}
        >
          <Icon name="add" className="text-[16px]" />
          {files.length === 0 ? "Unggah Foto" : "Tambah Foto"}
        </Button>
      }
    />
  );
}
