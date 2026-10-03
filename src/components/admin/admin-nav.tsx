"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_GROUPS, HELPDESK, adminHref, type AdminGroup } from "@/lib/admin-nav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Nav superadmin di dalam header, sejajar <TopNav> milik orang tua: Dashboard
 * sebagai tautan langsung, lalu tiga dropdown (Master Data, Tips & Trik, Layanan).
 *
 * Dropdown, bukan satu baris panjang yang bisa di-scroll seperti sebelumnya:
 * modulnya sepuluh sekarang, dan baris yang harus digeser menyembunyikan menu
 * tanpa memberi tahu bahwa ada yang tersembunyi.
 *
 * Label disembunyikan di bawah `sm`, bukan nav terpisah untuk HP: satu jalur render
 * saja, dan tiap pemicu tetap punya aria-label sendiri sehingga ikon yang berdiri
 * sendiri tetap punya nama.
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigasi superadmin">
      <ul className="bg-muted flex items-center gap-1 rounded-full p-1">
        <li>
          <Link
            href="/admin"
            aria-current={pathname === "/admin" ? "page" : undefined}
            aria-label="Dashboard"
            className={cn(PILL, pathname === "/admin" ? PILL_ACTIVE : PILL_IDLE)}
          >
            <Icon name="analytics" filled={pathname === "/admin"} className="text-[18px]" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </li>
        {ADMIN_GROUPS.map((group) => (
          <li key={group.label}>
            <GroupMenu group={group} pathname={pathname} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

const PILL =
  "text-label-sm flex items-center gap-1.5 rounded-full px-2.5 py-2 font-bold whitespace-nowrap transition-colors sm:px-3";
const PILL_ACTIVE = "text-primary bg-card shadow-sm";
const PILL_IDLE = "text-muted-foreground hover:text-foreground";

function GroupMenu({ group, pathname }: { group: AdminGroup; pathname: string }) {
  // Grup ikut menyala saat salah satu modulnya terbuka — tanpa ini, membuka
  // /admin/parents membuat seluruh nav terlihat tidak aktif.
  const active = group.sections.some(
    (s) => pathname === adminHref(s) || pathname.startsWith(`${adminHref(s)}/`),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={group.label}
        className={cn(PILL, active ? PILL_ACTIVE : PILL_IDLE)}
      >
        <Icon name={group.icon} filled={active} className="text-[18px]" />
        <span className="hidden sm:inline">{group.label}</span>
        <Icon name="expand_more" className="text-[16px]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {group.sections.map((s) => {
          const href = adminHref(s);
          return (
            <DropdownMenuItem key={s.slug} asChild>
              <Link
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className="gap-2"
              >
                <Icon name={s.icon} className="text-[16px]" />
                <span className="flex-1 truncate">{s.label}</span>
                {/* "SEGERA" ditulis, bukan item yang diredupkan: modul yang belum
                    siap tetap bisa dibuka dan halamannya menjelaskan kenapa. */}
                {!s.ready && (
                  <span className="bg-muted text-muted-foreground text-label-sm shrink-0 rounded px-1 font-bold">
                    SEGERA
                  </span>
                )}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Helpdesk berdiri sendiri di sebelah avatar — pintu keluar, bukan modul biasa. */
export function AdminHelpdeskLink() {
  const pathname = usePathname();
  const href = adminHref(HELPDESK);
  const active = pathname === href;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-label={HELPDESK.label}
      title={HELPDESK.label}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full transition-colors",
        active ? "bg-accent text-primary" : "text-muted-foreground hover:bg-muted",
      )}
    >
      <Icon name={HELPDESK.icon} filled={active} className="text-[20px]" />
    </Link>
  );
}
