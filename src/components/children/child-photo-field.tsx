"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { removeChildPhotoAction, uploadChildPhotoAction } from "@/lib/actions/children";
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_BYTES } from "@/lib/storage-limits";
import { compressToWebp } from "@/lib/compress-image";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ChildAvatar } from "./child-avatar";
import type { Child } from "@/db/schema";

const MB = Math.round(MAX_PHOTO_BYTES / 1024 / 1024);

export const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`
    : `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("id-ID")} KB`;

/**
 * Validasi pilihan pengguna lalu kompresi. Dipakai dua mode di bawah supaya
 * aturan ukuran dan format tidak ditulis dua kali.
 *
 * Cek di sini hanya untuk memberi tahu lebih cepat — server tetap memvalidasi,
 * karena permintaan bisa dibuat tanpa lewat form sama sekali.
 */
export async function pickPhoto(file: File): Promise<{ file: File } | { error: string }> {
  if (!ALLOWED_PHOTO_TYPES.includes(file.type as (typeof ALLOWED_PHOTO_TYPES)[number]))
    return { error: "Gunakan berkas JPG, PNG, atau WebP." };

  if (file.size > MAX_PHOTO_BYTES)
    return {
      error:
        `Ukuran foto ${formatSize(file.size)}, melebihi batas ${MB} MB. ` +
        "Pilih foto lain atau perkecil dulu.",
    };

  return { file: await compressToWebp(file) };
}

const HINT = `Opsional. JPG, PNG, atau WebP, maksimal ${MB} MB. Foto otomatis dikecilkan dan diubah ke WebP agar ringan. Hanya bisa dilihat oleh akun Anda.`;

/** Kerangka tampilan yang sama untuk kedua mode, juga dipakai foto MyRegistry. */
export function PhotoRow({
  avatar,
  actions,
  error,
  inputRef,
  onFiles,
  label = "Foto Anak",
  hint = HINT,
  multiple = false,
}: {
  avatar: React.ReactNode;
  actions: React.ReactNode;
  error: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Semua berkas terpilih sekaligus — satu panggilan, satu unggahan. */
  onFiles: (files: File[]) => void;
  label?: string;
  hint?: string;
  /** Foto barang wishlist boleh beberapa sudut; avatar tetap satu. */
  multiple?: boolean;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm leading-none font-medium">{label}</span>

      <div className="flex items-center gap-3.5">
        {avatar}
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>

      {/*
        Input di luar <form> data anak: berkasnya tidak ikut submit form,
        melainkan diunggah lewat action tersendiri.
      */}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_PHOTO_TYPES.join(",")}
        multiple={multiple}
        className="sr-only"
        aria-label={`Pilih ${label.toLowerCase()}`}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) onFiles(files);
          e.target.value = "";
        }}
      />

      <p className="text-muted-foreground text-xs">{hint}</p>
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Mode anak yang sudah ada: unggahan langsung berlaku.
 *
 * Terpisah dari form data anak karena berkasnya dikirim sendiri — menaruhnya
 * di form yang sama memaksa pengguna menyimpan ulang seluruh data hanya untuk
 * mengganti foto.
 */
export function ChildPhotoField({ child }: { child: Child }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onFile = (file: File) =>
    startTransition(async () => {
      const picked = await pickPhoto(file);
      if ("error" in picked) {
        setError(picked.error);
        return;
      }
      setError(null);

      const formData = new FormData();
      formData.set("photo", picked.file);

      const res = await uploadChildPhotoAction(child.id, formData);
      if (res.success) {
        toast.success(
          file.size > picked.file.size
            ? `Foto anak diperbarui (${formatSize(file.size)} → ${formatSize(picked.file.size)}).`
            : "Foto anak diperbarui.",
        );
        router.refresh();
      } else {
        setError(res.error.fields?.photo ?? res.error.message);
      }
    });

  const remove = () =>
    startTransition(async () => {
      const res = await removeChildPhotoAction(child.id);
      if (res.success) {
        toast.success("Foto anak dihapus.");
        router.refresh();
      } else {
        setError(res.error.message);
      }
    });

  return (
    <PhotoRow
      error={error}
      inputRef={inputRef}
      onFiles={([file]) => onFile(file)}
      avatar={
        <ChildAvatar
          child={child}
          className="ring-accent size-16 shrink-0 ring-2"
          iconClassName="text-[32px]"
        />
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
            {child.photoKey ? "Ganti Foto" : "Unggah Foto"}
          </Button>
          {child.photoKey && (
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={remove}>
              Hapus
            </Button>
          )}
        </>
      }
    />
  );
}

/**
 * Mode anak baru: foto ditahan di client sampai anaknya tersimpan.
 *
 * Belum ada id untuk dituju sebelum anak dibuat, jadi berkasnya disimpan di
 * state pemanggil dan diunggah setelah simpan berhasil.
 */
export function ChildPhotoPicker({
  file,
  onSelect,
  disabled,
}: {
  file: File | null;
  onSelect: (file: File | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Object URL diturunkan dari `file`, bukan disimpan di state — memberi URL
  // baru lewat effect berarti satu render tambahan tanpa gambar.
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  // URL lama harus dilepas, kalau tidak blob-nya tertahan di memori sampai
  // halaman ditutup.
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const onFile = (picked: File) =>
    startTransition(async () => {
      const result = await pickPhoto(picked);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setError(null);
      onSelect(result.file);
    });

  return (
    <PhotoRow
      error={error}
      inputRef={inputRef}
      onFiles={([file]) => onFile(file)}
      avatar={
        <span className="bg-accent text-primary ring-accent grid size-16 shrink-0 place-items-center overflow-hidden rounded-full ring-2">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob lokal, bukan aset yang bisa dioptimalkan next/image
            <img src={previewUrl} alt="Pratinjau foto anak" className="size-full object-cover" />
          ) : (
            <Icon name="child_care" filled className="text-[32px]" />
          )}
        </span>
      }
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || pending}
            onClick={() => inputRef.current?.click()}
          >
            <Icon name="add" className="text-[16px]" />
            {file ? "Ganti Foto" : "Unggah Foto"}
          </Button>
          {file && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || pending}
              onClick={() => onSelect(null)}
            >
              Hapus
            </Button>
          )}
        </>
      }
    />
  );
}
