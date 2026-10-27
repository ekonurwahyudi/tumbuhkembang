import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icon";
import { ComingSoon } from "./coming-soon";

/**
 * Ubin layanan di beranda. Yang sudah ada di aplikasi jadi tautan sungguhan;
 * yang belum ditandai "Segera" dan tidak menuju ke mana pun — lebih baik jujur
 * daripada mengirim orang ke halaman kosong.
 */
type Tile = {
  label: string;
  icon: IconName;
  badge?: string;
  /** Tanpa href = mockup, ditampilkan sebagai "Segera". */
  href?: string;
  /** Kelas warna keping ikonnya — lihat `TONE`. */
  tone: string;
};

/**
 * Warna keping ikon per layanan. Delapan ubin biru seragam terbaca sebagai satu
 * blok yang harus dibaca kata per kata; warna berbeda membuat tiap ubin punya
 * bentuk ingatan sendiri, jadi orang tua yang sudah hafal bisa menujunya langsung.
 *
 * Pola `bg-x-100 text-x-700` + `dark:bg-x-900 dark:text-x-300` mengikuti
 * `PRIORITY_TONE` di registry-shared.tsx, bukan sistem baru. Tiap pasangan sudah
 * diuji >= 4,5:1 (AA) di kedua mode — nilai terendah amber/oranye 4,51:1. Ikonnya
 * `x-700`, BUKAN `x-600`: amber-600 di atas amber-100 hanya 2,86:1, di bawah
 * ambang 3:1 untuk elemen non-teks.
 *
 * Warna di sini HANYA pembeda tempat, bukan penanda status: labelnya selalu
 * tertulis di bawah ikon, jadi tidak ada makna yang hilang bila warnanya tidak
 * terbedakan.
 */
const TONE = {
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  teal: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
  fuchsia: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900 dark:text-fuchsia-300",
} as const;

export function QuickAccess({
  childId,
  registryClaims = 0,
}: {
  childId: string;
  /** Jumlah klaim kado masuk — jadi badge, satu-satunya kabar ke orang tua. */
  registryClaims?: number;
}) {
  const tiles: Tile[] = [
    { label: "Profil Anak", icon: "child_care", href: `/children/${childId}`, tone: TONE.sky },
    {
      // "Vaksin", bukan "Jadwal Vaksin": pada ubin selebar ~73px label dua kata
      // membungkus, dan grid menyamakan tinggi baris — satu label yang membungkus
      // membuat SEMUA ubin di barisnya lebih tinggi dan menyisakan ruang kosong.
      label: "Vaksin",
      icon: "vaccines",
      href: `/children/${childId}#vaksinasi`,
      tone: TONE.emerald,
    },
    {
      label: "Asupan ASI",
      icon: "water_bottle",
      href: `/children/${childId}/feeding`,
      tone: TONE.violet,
    },
    {
      label: "Grafik WHO",
      icon: "analytics",
      href: `/children/${childId}/growth`,
      tone: TONE.orange,
    },
    { label: "Katalog", icon: "card_giftcard", href: "/shop", tone: TONE.rose },
    {
      label: "MyRegistry",
      icon: "list_alt",
      href: "/registry",
      badge: registryClaims > 0 ? String(registryClaims) : undefined,
      tone: TONE.amber,
    },
    { label: "Nakes Care", icon: "medical_services", badge: "Siaga", tone: TONE.teal },
    { label: "Babysitter", icon: "family_restroom", badge: "Baru", tone: TONE.fuchsia },
  ];

  return (
    <section className="bg-card rounded-2xl p-4 shadow-sm" aria-labelledby="akses-cepat">
      <h2 id="akses-cepat" className="text-headline-sm flex items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300">
          <Icon name="apps" filled className="text-[16px]" />
        </span>
        Akses Cepat
      </h2>
      <p className="text-muted-foreground text-body-sm mt-0.5">Layanan utama si kecil</p>

      {/* `gap-1` di bawah 360px: dengan gap 10px, tiga celah memakan 30px dari
          ~288px ruang isi dan menyisakan ubin ~59px — terlalu sempit untuk
          "Profil Anak". Celah yang lebih rapat mengembalikan ~6px per ubin. */}
      <ul className="mt-3.5 grid grid-cols-4 gap-1 min-[360px]:gap-2.5">
        {tiles.map((tile) => (
          <li key={tile.label}>
            {tile.href ? (
              <Link href={tile.href} className={TILE}>
                <TileBody {...tile} />
              </Link>
            ) : (
              <ComingSoon label={tile.label} className={TILE}>
                <TileBody {...tile} />
              </ComingSoon>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* Latar `bg-muted` dilepas: dengan keping ikon yang kini berwarna, latar abu di
   belakangnya membuat tiap ubin jadi dua lapis kotak. Warnanya yang jadi bentuk
   ubinnya.

   `pt-4` menyisakan jalur untuk badge "Siaga"/"Baru" di sudut — tanpa itu badge
   menindih keping ikon. Tanpa `min-h`: tingginya ditentukan isinya, dan isinya
   selalu setinggi sama karena tiap label dijaga satu baris. */
const TILE =
  "relative flex h-full w-full flex-col items-center justify-start gap-1.5 rounded-2xl px-0.5 pt-4 pb-2.5 text-center transition-all hover:bg-muted active:scale-[0.96]";

function TileBody({ label, icon, badge, href, tone }: Tile) {
  return (
    <>
      {/* `rounded-lg` (8px), bukan bulat penuh: keping kotak-membulat terbaca sebagai
          ikon aplikasi, dan bentuknya membedakan ubin layanan dari avatar anak yang
          memang lingkaran. Tanpa shadow — di atas tint lembut, bayangan membuat
          kepingnya tampak mengambang. */}
      <span className={cn("grid size-11 place-items-center rounded-lg", tone)}>
        <Icon name={icon} filled className="text-[22px]" />
      </span>
      {/* `truncate`, bukan membungkus: label yang membungkus memaksa seluruh baris
          jadi lebih tinggi. Ukurannya 12px (naik dari 11px); BUKAN 13px, karena
          "Grafik WHO" butuh 73px sementara ruangnya 70px. Di bawah 360px turun ke
          10px — di sana ubinnya hanya ~59px. Semua angka ini diukur, bukan ditebak. */}
      <span className="block w-full truncate text-[10px] leading-[14px] font-bold min-[360px]:text-[12px] min-[360px]:leading-[16px]">
        {label}
      </span>
      {badge && (
        /* `top-0` di jalur `pt-4` yang baru: badge duduk di pitanya sendiri di atas
           keping ikon, bukan menindihnya. */
        <span className="bg-[var(--color-butter-pastel)] text-label-sm absolute top-0 right-0.5 rounded-full px-1.5 font-bold text-[var(--color-on-butter)]">
          {badge}
        </span>
      )}
      {!href && <span className="sr-only">(belum tersedia)</span>}
    </>
  );
}
