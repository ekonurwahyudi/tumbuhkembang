"use client";

import { useFormStatus } from "react-dom";
import { useOffline } from "next/offline";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const offline = useOffline();
  // Tanpa label ini tombolnya sekadar membeku: aksinya memang sengaja ditahan Next
  // sampai koneksi kembali, dan "Menyimpan..." selamanya terbaca seperti aplikasi
  // menggantung. Satu berkas ini dipakai semua formulir, jadi satu perubahan cukup.
  const waiting = pending && offline;
  return (
    <Button
      type="submit"
      size="lg"
      className={cn("w-full", className)}
      disabled={pending}
      aria-busy={pending}
    >
      {pending && <Icon name="progress_activity" className="animate-spin text-[16px]" />}
      {pending ? (waiting ? "Menunggu koneksi..." : pendingLabel) : children}
    </Button>
  );
}
