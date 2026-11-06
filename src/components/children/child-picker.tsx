"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ChildAvatar } from "./child-avatar";

/**
 * Ganti anak tanpa kembali ke beranda dulu. Dipakai di halaman ber-scope anak
 * (`/children/[id]/...`): memilih anak lain membuka rute yang SAMA untuk anak itu,
 * jadi orang tua tetap berada di layar yang sedang dibacanya.
 *
 * Tujuan dibawa per-anak sebagai `href`, bukan sebagai fungsi: komponen ini client
 * dan pemanggilnya server component — fungsi tidak bisa menyeberangi batas itu.
 */
export function ChildPicker({
  items,
  activeId,
}: {
  items: { id: string; name: string; photoKey: string | null; caption: string; href: string }[];
  activeId: string;
}) {
  const router = useRouter();

  // Satu anak = tidak ada yang bisa dipilih; tombolnya hanya akan membuka menu
  // berisi dirinya sendiri.
  if (items.length < 2) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Ganti anak">
          <Icon name="swap_horiz" className="text-[18px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Ganti anak</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuItem
            key={item.id}
            onSelect={() => router.push(item.href)}
            className="gap-2.5 py-2"
          >
            <ChildAvatar child={item} className="size-8 shrink-0" iconClassName="text-[16px]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{item.name}</span>
              <span className="text-muted-foreground block truncate text-xs">{item.caption}</span>
            </span>
            {item.id === activeId && (
              <Icon name="check" aria-label="Sedang dibuka" className="text-primary text-[18px]" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
