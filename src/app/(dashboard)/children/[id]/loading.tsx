import { Skeleton } from "@/components/ui/skeleton";

/**
 * Kerangka rute yang di-prefetch; inilah yang tampil saat tanpa koneksi.
 * Halaman anak adalah pintu masuk ke riwayat pengukuran dan catatan ASI, jadi
 * kerangkanya harus ada supaya jalur offline itu bisa ditempuh.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* Hero anak: avatar + nama + umur */}
      <div className="flex items-center gap-3">
        <Skeleton className="size-16 shrink-0 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
