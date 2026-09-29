"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Beranda", icon: "home" },
  { href: "/children", label: "Anak", icon: "child_care" },
  { href: "/growth", label: "Grafik", icon: "trending_up" },
  { href: "/settings", label: "Profil", icon: "person" },
];

export function TopNav() {
  const pathname = usePathname();
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
                className={cn(
                  "text-body-sm flex items-center gap-1.5 rounded-full px-3.5 py-2 font-semibold transition-colors",
                  active
                    ? "text-primary bg-card shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon name={icon} filled={active} className="text-[18px]" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
