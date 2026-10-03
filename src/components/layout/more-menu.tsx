"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Satu daftar untuk nav bawah DAN nav atas: dua salinan pasti berbeda suatu saat.
 *
 * Ikonnya dipilih dari subset font yang sudah ada. `shopping_bag` dan `more_horiz`
 * akan menuntut `material-symbols-subset.woff2` dibuat ulang (lihat `ui/icon.tsx`),
 * dan `menu_book` sudah terbaca sebagai katalog.
 */
export const MORE_ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/settings", label: "Pengaturan", icon: "settings" },
  { href: "/bantuan", label: "Bantuan", icon: "info" },
  { href: "/shop", label: "Shop Katalog", icon: "menu_book" },
];

/** Benar juga untuk `/settings/apa-pun`, sama dengan tab nav lainnya. */
export const isMorePath = (pathname: string) =>
  MORE_ITEMS.some((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));

/**
 * Menu "Lainnya" untuk HP: lembar bawah berisi halaman yang tidak cukup sering dibuka
 * untuk mendapat tab sendiri. Menggantikan tab "Profil", yang menyembunyikan Pengaturan
 * di balik kata yang tidak menyebutkannya — dan tidak menyisakan tempat bagi Bantuan
 * maupun Shop Katalog, yang sebelumnya hanya bisa dicapai dari beranda.
 *
 * Pasangannya untuk desktop adalah `MoreDropdown` di bawah. Dua komponen, bukan satu
 * yang beralih lewat media query: `BottomNav` sudah `md:hidden` dan `TopNav` sudah
 * `hidden md:block`, jadi tidak ada yang perlu diputuskan saat jalan.
 *
 * `trigger` diteruskan pemanggilnya: nav bawah menggambar tab setinggi penuh, nav
 * atas menggambar pil. Isinya sama, bentuknya mengikuti tempatnya.
 */
export function MoreMenu({ trigger }: { trigger: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>

      <SheetContent side="bottom" className="mx-auto max-w-md gap-0 rounded-t-3xl p-5 pb-8">
        <SheetHeader className="p-0 text-center">
          <SheetTitle className="text-headline-md">Lainnya</SheetTitle>
          <SheetDescription className="sr-only">
            Halaman lain: pengaturan, bantuan, dan katalog produk.
          </SheetDescription>
        </SheetHeader>

        <nav aria-label="Menu lainnya" className="mt-4 space-y-2">
          {MORE_ITEMS.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                /* Lembarnya ditutup sendiri: navigasi klien tidak melepas komponennya. */
                onClick={() => setOpen(false)}
                className={cn(
                  "text-body-md flex h-14 items-center gap-3 rounded-2xl px-4 font-bold transition-colors",
                  active ? "bg-accent text-primary" : "bg-muted hover:bg-accent",
                )}
              >
                <Icon name={icon} filled={active} className="text-[22px]" />
                {label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Versi desktop: dropdown di bawah pil nav, bukan lembar yang naik dari dasar layar.
 * Lembar bawah di layar lebar menempuh seluruh tinggi layar demi tiga tautan.
 *
 * Radix menutup dropdown-nya sendiri saat itemnya dipilih, jadi tidak ada `setOpen`
 * seperti di `MoreMenu`.
 */
export function MoreDropdown({ trigger }: { trigger: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>

      {/* w-52: `DropdownMenuContent` bawaan menyamakan lebarnya dengan pemicunya, dan
          pil "Lainnya" lebih sempit daripada "Shop Katalog". */}
      <DropdownMenuContent align="end" sideOffset={8} className="w-52 rounded-2xl p-1.5">
        {MORE_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <DropdownMenuItem key={href} asChild>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-body-sm flex h-10 cursor-pointer items-center gap-2.5 rounded-xl px-3 font-bold",
                  active && "text-primary bg-accent",
                )}
              >
                <Icon name={icon} filled={active} className="text-[20px]" />
                {label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
