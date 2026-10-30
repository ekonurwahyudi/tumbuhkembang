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
  /*
    Artikel, bukan Notifikasi: yang terakhir dibuka sesekali, sementara artikel
    adalah isi yang memang ingin dibaca berulang.

    Notifikasi TIDAK kehilangan jalan masuk — di HP, lonceng di sapaan beranda
    (lihat `Greeting` di dashboard/page.tsx) menuju ke sana lengkap dengan
    penghitung belum-terbacanya, dan di desktop loncengnya ada di AppHeader.
  */
  { href: "/blog", label: "Artikel", icon: "menu_book" },
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
    return (
      <li key={href} className="flex-1">
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          className={tabClass(active)}
        >
          {/* 26px: sama dengan ikon "add" di tombol Catat. */}
          <Icon name={icon} filled={active} className="text-[26px]" />
          {/* nowrap: "List Kado" akan pecah dua baris dan merusak tinggi h-16. */}
          <span className="leading-none whitespace-nowrap">{label}</span>
        </Link>
      </li>
    );
  };

  return (
    /*
      Melayang, bukan menempel ke tepi bawah: pita selebar layar membagi layar jadi
      dua blok dan terbaca sebagai bagian dari sistem, bukan bagian dari aplikasi.
      Dengan jarak di tiga sisinya, latar halaman terlihat mengalir di belakangnya.

      `inset-x-3` + `rounded-[28px]`: sudutnya dibulatkan penuh mengikuti tinggi
      pitanya sendiri. Bayangannya diperkuat (dari /0.05 ke /0.10) — elemen yang
      melayang butuh bayangan yang menjelaskan ia melayang.

      `bottom` membawa safe-area, bukan `paddingBottom`: pita yang sudah lepas dari
      tepi layar harus naik UTUH di atas home indicator iPhone, bukan menumbuhkan
      padding di dalam dirinya sendiri.
    */
    /*
      Kaca ala iOS. Tiga lapis yang membuatnya terbaca sebagai kaca, bukan sekadar
      panel tembus pandang:

      1. `backdrop-blur-2xl` + `backdrop-saturate-150` — blur saja menghasilkan kabur
         keabuan; saturasi yang dinaikkan membuat warna di belakangnya ikut terbawa,
         dan itulah yang dilakukan material iOS.
      2. `bg-card/70` — cukup tembus untuk terlihat kaca, tapi tetap jadi alas yang
         menjamin kontras labelnya. Di bawah ~60% teks mulai beradu dengan foto
         produk yang lewat di belakangnya.
      3. Tepi terang di dalam (`inset 0 1px 0 rgb(255 255 255/0.6)`) — kaca asli
         menangkap cahaya di tepi atasnya. Tanpa itu pitanya terbaca rata.

      `supports-[backdrop-filter]` menjaga peramban tanpa backdrop-filter tetap
      mendapat latar pekat (`bg-card/95`), bukan pita nyaris transparan.
    */
    <nav
      aria-label="Navigasi utama"
      className="bg-card/95 supports-[backdrop-filter]:bg-card/70 fixed inset-x-3 z-40 rounded-[28px] border border-white/40 shadow-[0_8px_32px_rgb(15_23_42/0.12),inset_0_1px_0_rgb(255_255_255/0.6)] backdrop-blur-2xl backdrop-saturate-150 md:hidden dark:border-white/10 dark:shadow-[0_8px_32px_rgb(0_0_0/0.4),inset_0_1px_0_rgb(255_255_255/0.08)]"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
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
