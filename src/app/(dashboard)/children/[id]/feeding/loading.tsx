import { Skeleton } from "@/components/ui/skeleton";

/** Kerangka rute yang di-prefetch; inilah yang tampil saat tanpa koneksi. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-36" />
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
}
