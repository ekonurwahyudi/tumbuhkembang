"use client";

import { toast } from "sonner";

/** Tombol untuk fitur yang belum ada: menekannya memberi kabar, bukan halaman kosong. */
export function ComingSoon({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => toast.info(`${label} segera hadir.`)}
    >
      {children}
    </button>
  );
}
