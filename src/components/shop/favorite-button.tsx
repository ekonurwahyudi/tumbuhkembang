"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleFavoriteAction } from "@/lib/actions/shop-favorites";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Tombol hati di kartu produk. Dipasang sebagai SAUDARA dari `<Link>` kartunya, bukan
 * di dalamnya — tombol di dalam tautan adalah konten interaktif bersarang.
 *
 * Bukan `<Button variant="ghost">`: ia melayang di atas foto, jadi butuh latar sendiri
 * yang kontrasnya tidak bergantung pada foto di belakangnya.
 *
 * Tanpa useOptimistic — `useTransition` + `router.refresh()`, pola yang sama dengan
 * seluruh toggle lain di aplikasi ini.
 */
export function FavoriteButton({
  productId,
  name,
  isFavorite,
  className,
}: {
  productId: string;
  name: string;
  isFavorite: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = !isFavorite;
  const label = next ? `Simpan ${name} ke favorit` : `Hapus ${name} dari favorit`;

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={label}
      aria-pressed={isFavorite}
      title={next ? "Simpan ke favorit" : "Hapus dari favorit"}
      onClick={() =>
        startTransition(async () => {
          const res = await toggleFavoriteAction(productId, next);
          if (res.success) {
            toast.success(next ? `${name} disimpan ke favorit.` : `${name} dihapus dari favorit.`);
            router.refresh();
          } else {
            toast.error(res.error.message);
          }
        })
      }
      className={cn(
        "bg-background/90 focus-visible:ring-ring grid size-8 place-items-center rounded-full shadow-sm outline-none backdrop-blur-sm transition-transform active:scale-90 focus-visible:ring-2 disabled:opacity-60",
        className,
      )}
    >
      <Icon
        name="favorite"
        filled={isFavorite}
        className={cn(
          "text-[18px]",
          isFavorite ? "text-[var(--color-status-alert-text)]" : "text-muted-foreground",
        )}
      />
    </button>
  );
}
