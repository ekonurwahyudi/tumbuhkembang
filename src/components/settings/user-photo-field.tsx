"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { removeUserPhotoAction, uploadUserPhotoAction } from "@/lib/actions/account";
import { compressToWebp } from "@/lib/compress-image";
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_BYTES } from "@/lib/storage-limits";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";

const MB = Math.round(MAX_PHOTO_BYTES / 1024 / 1024);

/**
 * Avatar profil yang bisa diklik untuk ganti foto. Berkas dikompresi di client
 * (sama seperti foto anak) lalu diunggah lewat action tersendiri.
 */
export function UserPhotoField({
  name,
  initials,
  photoKey,
}: {
  name: string;
  initials: string;
  photoKey: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onFile = (file: File) =>
    startTransition(async () => {
      if (!ALLOWED_PHOTO_TYPES.includes(file.type as (typeof ALLOWED_PHOTO_TYPES)[number])) {
        setError("Gunakan berkas JPG, PNG, atau WebP.");
        return;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        setError(`Ukuran foto melebihi batas ${MB} MB.`);
        return;
      }
      setError(null);

      const formData = new FormData();
      formData.set("photo", await compressToWebp(file));

      const res = await uploadUserPhotoAction(formData);
      if (res.success) {
        toast.success("Foto profil diperbarui.");
        router.refresh();
      } else setError(res.error.message);
    });

  const remove = () =>
    startTransition(async () => {
      const res = await removeUserPhotoAction();
      if (res.success) {
        toast.success("Foto profil dihapus.");
        router.refresh();
      } else setError(res.error.message);
    });

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          aria-label={photoKey ? "Ganti foto profil" : "Unggah foto profil"}
          className="group block rounded-full disabled:opacity-60"
        >
          <Avatar className="bg-accent ring-primary/20 size-20 ring-2 after:hidden">
            {photoKey && (
              <AvatarImage
                src={`/user/photo?v=${encodeURIComponent(photoKey)}`}
                alt={`Foto ${name}`}
              />
            )}
            <AvatarFallback className="bg-accent text-accent-foreground text-headline-md">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="bg-primary text-primary-foreground ring-card absolute right-0 bottom-0 grid size-7 place-items-center rounded-full ring-2 transition-transform group-active:scale-90">
            <Icon name={pending ? "progress_activity" : "edit"} className="text-[14px]" />
          </span>
        </button>
      </div>

      {/* Di luar <button> agar tidak jadi tombol bersarang. */}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_PHOTO_TYPES.join(",")}
        className="sr-only"
        aria-label="Pilih foto profil"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />

      {photoKey && (
        <button
          type="button"
          disabled={pending}
          onClick={remove}
          className="text-label-sm font-semibold text-rose-600 disabled:opacity-50"
        >
          Hapus Foto
        </button>
      )}
      {error && (
        <p role="alert" className="text-destructive max-w-[220px] text-center text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
