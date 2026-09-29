"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_SECTIONS, adminHref } from "@/lib/admin-nav";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Nav modul superadmin. Satu baris yang bisa di-scroll mendatar, bukan nav bawah:
 * modulnya enam dan akan bertambah, sementara nav bawah hanya muat empat tab.
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi superadmin"
      className="border-b bg-card/90 supports-[backdrop-filter]:bg-card/80 sticky top-16 z-30 backdrop-blur-xl"
    >
      <ul className="mx-auto flex max-w-4xl items-center gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <li>
          <NavLink href="/admin" icon="analytics" label="Dashboard" active={pathname === "/admin"} />
        </li>
        {ADMIN_SECTIONS.map((s) => {
          const href = adminHref(s);
          return (
            <li key={s.slug}>
              <NavLink
                href={href}
                icon={s.icon}
                label={s.label}
                active={pathname === href || pathname.startsWith(`${href}/`)}
              />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function NavLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "text-body-sm flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold transition-colors",
        active
          ? "bg-accent text-primary shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
      )}
    >
      <Icon name={icon} filled={active} className="text-[16px]" />
      {label}
    </Link>
  );
}
