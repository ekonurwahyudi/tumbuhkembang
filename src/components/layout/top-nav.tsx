"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { MoreDropdown, isMorePath } from "./more-menu";
import { cn } from "@/lib/utils";

/** Pil keempat bukan tautan melainkan pembuka "Lainnya" — sama dengan nav bawah. */
const ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/registry", label: "My Kado", icon: "card_giftcard" },
  /* Artikel menggantikan Notifikasi — seragam dengan nav bawah. Notifikasi pindah
     ke lonceng tersendiri di AppHeader, di sebelah menu akun. */
  { href: "/blog", label: "Artikel", icon: "menu_book" },
];

export function TopNav() {
  const pathname = usePathname();

  /* Dipakai pil tautan DAN pembuka "Lainnya": keduanya harus sebentuk. */
  const pillClass = (active: boolean) =>
    cn(
      // text-label-sm (11px), seragam dengan nav bawah.
      "text-label-sm flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 font-bold transition-colors",
      active ? "text-primary bg-card shadow-sm" : "text-muted-foreground hover:text-foreground",
    );

  return (
    <nav aria-label="Navigasi utama" className="hidden md:block">
      <ul className="bg-muted flex items-center gap-1 rounded-full p-1">
        {ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={pillClass(active)}
              >
                <Icon name={icon} filled={active} className="text-[20px]" />
                {label}
              </Link>
            </li>
          );
        })}

        <li>
          <MoreDropdown
            trigger={
              <button type="button" className={pillClass(isMorePath(pathname))}>
                <Icon name="apps" filled={isMorePath(pathname)} className="text-[20px]" />
                Lainnya
              </button>
            }
          />
        </li>
      </ul>
    </nav>
  );
}
