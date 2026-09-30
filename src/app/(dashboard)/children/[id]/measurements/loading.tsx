import { Skeleton } from "@/components/ui/skeleton";

/**
 * Selain menutupi jeda muat, berkas ini memberi Next batas untuk di-prefetch
 * sebagai kerangka rute — dan kerangka itulah yang tetap tampil saat perangkat
 * tanpa koneksi. Tanpanya, halaman ini tidak terbuka sama sekali secara offline.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  );
}
