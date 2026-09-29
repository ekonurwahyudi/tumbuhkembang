"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { QuickRecordSheet } from "./quick-record-sheet";
import { cn } from "@/lib/utils";

const ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Beranda", icon: "home" },
  { href: "/children", label: "Anak", icon: "child_care" },
  { href: "/growth", label: "Grafik", icon: "trending_up" },
  { href: "/settings", label: "Profil", icon: "person" },
];

/**
 * Nav bawah ala template: dua tab, tombol catat melayang, dua tab.
 *
 * Tombol tengah hanya muncul bila sudah ada anak — tanpa anak, tidak ada yang
 * bisa dicatat, dan tombol yang mengarah ke halaman kosong lebih membingungkan
 * daripada tombol yang absen.
 */
export function BottomNav({
  quickRecordChildren,
}: {
  quickRecordChildren: {
    id: string;
    name: string;
    dateOfBirth: string;
    photoKey: string | null;
  }[];
}) {
  const pathname = usePathname();
  const [left, right] = [ITEMS.slice(0, 2), ITEMS.slice(2)];

  const tab = ({ href, label, icon }: (typeof ITEMS)[number]) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <li key={href} className="flex-1">
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "text-label-sm flex h-full flex-col items-center justify-center gap-0.5 tracking-tight transition-colors",
            active ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon name={icon} filled={active} className="text-[22px]" />
          <span>{label}</span>
        </Link>
      </li>
    );
  };

  return (
    <nav
      aria-label="Navigasi utama"
      className="bg-card/95 fixed inset-x-0 bottom-0 z-40 border-t shadow-[0_-4px_20px_rgb(15_23_42/0.05)] backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex h-16 max-w-md items-stretch px-1">
        {left.map(tab)}

        {quickRecordChildren.length > 0 && (
          // Tombol melayang diangkat lewat translate, bukan menambah tinggi <li>,
          // supaya tinggi baris tetap h-16 dan label sejajar dengan tab lain.
          <li className="relative z-10 flex-1">
            <div className="flex -translate-y-3.5 flex-col items-center justify-center gap-0.5">
              <QuickRecordSheet childrenList={quickRecordChildren} />
              <span className="text-primary text-label-sm font-bold">Catat</span>
            </div>
          </li>
        )}

        {right.map(tab)}
      </ul>
    </nav>
  );
}
