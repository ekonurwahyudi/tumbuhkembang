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
  { href: "/notifikasi", label: "Notifikasi", icon: "notifications" },
];

export function TopNav({ unread = 0 }: { unread?: number }) {
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
          const badge = href === "/notifikasi" ? unread : 0;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={badge > 0 ? `${label}, ${badge} belum dibaca` : undefined}
                className={pillClass(active)}
              >
                <Icon name={icon} filled={active} className="text-[20px]" />
                {label}
                {badge > 0 && (
                  /* Angkanya tertulis, dan aria-label di atas menyebutkannya:
                     warna bukan satu-satunya penanda. */
                  <span className="bg-destructive text-label-sm grid min-w-[18px] place-items-center rounded-full px-1 font-bold text-white">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
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
