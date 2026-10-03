"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { QuickRecordSheet } from "./quick-record-sheet";
import { MoreMenu, isMorePath } from "./more-menu";
import { cn } from "@/lib/utils";

/**
 * Tiga tab tautan; slot keempat bukan tautan melainkan pembuka menu "Lainnya".
 * "Profil" dulu menempatinya, dan nama itu menyembunyikan Pengaturan di balik kata
 * yang tidak menyebutkannya — sementara Bantuan dan Shop Katalog tidak punya jalan
 * masuk sama sekali selain dari beranda.
 */
const ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/registry", label: "List Kado", icon: "card_giftcard" },
  { href: "/notifikasi", label: "Notifikasi", icon: "notifications" },
];

/**
 * Nav bawah ala template: dua tab, tombol catat melayang, satu tab, lalu "Lainnya".
 *
 * Tombol tengah hanya muncul bila sudah ada anak — tanpa anak, tidak ada yang
 * bisa dicatat, dan tombol yang mengarah ke halaman kosong lebih membingungkan
 * daripada tombol yang absen.
 */
export function BottomNav({
  quickRecordChildren,
  unread = 0,
}: {
  quickRecordChildren: {
    id: string;
    name: string;
    dateOfBirth: string;
    photoKey: string | null;
  }[];
  /** Jumlah pemberitahuan belum terbaca; jadi titik di tab Notifikasi. */
  unread?: number;
}) {
  const pathname = usePathname();
  const [left, right] = [ITEMS.slice(0, 2), ITEMS.slice(2)];

  /* Dipakai tab tautan DAN pembuka "Lainnya": keduanya harus setinggi dan sebesar sama,
     kalau tidak slot keempat terbaca sebagai sesuatu yang bukan tab. */
  const tabClass = (active: boolean) =>
    cn(
      // 13px, bukan token --text-label-sm (11px): token itu dipakai di
      // banyak tempat lain, jadi ukurannya dipatok di sini saja.
      "flex h-full w-full flex-col items-center justify-center gap-1.5 text-[13px] tracking-tight transition-colors",
      active ? "text-primary" : "text-muted-foreground hover:text-foreground",
    );

  const tab = ({ href, label, icon }: (typeof ITEMS)[number]) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    const badge = href === "/notifikasi" ? unread : 0;
    return (
      <li key={href} className="flex-1">
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          aria-label={badge > 0 ? `${label}, ${badge} belum dibaca` : undefined}
          className={tabClass(active)}
        >
          {/* flex+leading-none: <span> pembungkus badge kalau tidak akan membawa
              line-height teks dan menambah ruang mati di bawah ikon. */}
          <span className="relative flex leading-none">
            {/* 26px: sama dengan ikon "add" di tombol Catat. */}
            <Icon name={icon} filled={active} className="text-[26px]" />
            {badge > 0 && (
              /* Angkanya tertulis, bukan titik polos, dan aria-label di atas
                 menyebutkannya: warna bukan satu-satunya penanda. */
              <span className="bg-destructive text-label-sm ring-card absolute -top-1.5 -right-2 grid min-w-[18px] place-items-center rounded-full px-1 leading-[16px] text-white ring-2">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </span>
          {/* nowrap: "Notifikasi" akan pecah dua baris dan merusak tinggi h-16. */}
          <span className="leading-none whitespace-nowrap">{label}</span>
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
            <div className="flex -translate-y-3.5 flex-col items-center justify-center gap-1.5">
              <QuickRecordSheet childrenList={quickRecordChildren} />
              {/* Sengaja 13px, lebih besar dari label tab: ini aksi utamanya. */}
              <span className="text-primary text-body-sm font-bold leading-none whitespace-nowrap">
                Catat
              </span>
            </div>
          </li>
        )}

        {right.map(tab)}

        {/* Slot keempat: pembuka lembar, bukan tautan. Dibuat aktif saat halaman yang
            sedang dibuka ada di dalam menunya — kalau tidak, membuka /settings membuat
            seluruh nav terlihat tanpa tab aktif. */}
        <li className="flex-1">
          <MoreMenu
            trigger={
              <button type="button" className={tabClass(isMorePath(pathname))}>
                <span className="flex leading-none">
                  <Icon name="apps" filled={isMorePath(pathname)} className="text-[26px]" />
                </span>
                <span className="leading-none whitespace-nowrap">Lainnya</span>
              </button>
            }
          />
        </li>
      </ul>
    </nav>
  );
}
