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
 * Kepingnya kaca berwarna: tint `x-100/70` ditimpa gradien putih miring (lihat
 * `GLASS` di bawah), bukan warna padat.
 *
 * Ikonnya `x-600`, satu langkah lebih lembut dari `x-700`. Kontras diuji pada warna
 * hasil PENUMPUKAN (tint 70% + kilau putih 25% di atas kartu putih), bukan pada tint
 * mentahnya: pada x-600 nilai terendah 3,01:1 (amber) — masih lolos ambang 3:1 untuk
 * elemen non-teks, tapi nyaris. Jangan dilembutkan lagi: pada `x-500` lima dari
 * delapan warna jatuh di bawah ambang (amber 2,03:1, teal 2,34:1).
 *
 * Warna di sini HANYA pembeda tempat, bukan penanda status: labelnya selalu
 * tertulis di bawah ikon, jadi tidak ada makna yang hilang bila warnanya tidak
 * terbedakan.
 */
const TONE = {
  sky: "bg-sky-100/70 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300",
  emerald: "bg-emerald-100/70 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
  violet: "bg-violet-100/70 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
  orange: "bg-orange-100/70 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300",
  rose: "bg-rose-100/70 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
  amber: "bg-amber-100/70 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
  teal: "bg-teal-100/70 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300",
  fuchsia: "bg-fuchsia-100/70 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-300",
} as const;

/**
 * Lapisan kaca di atas tint berwarna: gradien putih miring + tepi terang di sisi
 * atas, aturan yang sama dengan nav bawah dan strip asupan — satu bahasa kaca di
 * seluruh aplikasi, bukan tiga racikan berbeda.
 *
 * `backdrop-blur-sm` ikut dipasang meski keping ini duduk di atas kartu putih polos
 * (tidak ada yang bisa diburamkan): membuatnya tetap benar bila kartunya suatu saat
 * berlatar foto atau warna.
 */
const GLASS =
  "relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/60 before:via-white/15 before:to-transparent before:content-[''] shadow-[inset_0_1px_0_rgb(255_255_255/0.7)] backdrop-blur-sm dark:before:from-white/15 dark:before:via-white/5 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]";

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
      // Nama panjangnya kembali: sebagai carousel lebar ubin tidak lagi terkunci
      // seperempat layar, jadi dua baris label tidak memaksa ubin lain ikut tinggi.
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
    { label: "Shop", icon: "card_giftcard", href: "/shop", tone: TONE.rose },
    {
      label: "List Kado",
      icon: "list_alt",
      href: "/registry",
      // badge: registryClaims > 0 ? String(registryClaims) : undefined,
      tone: TONE.amber,
    },
    { label: "Nakes Care", icon: "medical_services", badge: "Soon", tone: TONE.teal },
    { label: "Babysitter", icon: "family_restroom", badge: "Soon", tone: TONE.fuchsia },
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

      {/* Grid 4 kolom, dua baris — semua layanan terlihat sekaligus tanpa digeser.
          `gap-1` di bawah 360px: dengan celah 10px, tiga celah memakan 30px dari
          ~288px ruang isi dan menyisakan ubin ~59px, terlalu sempit untuk labelnya. */}
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
   menindih keping ikon.

   `w-full`: lebarnya ditentukan kolom grid, bukan ubinnya sendiri. */
const TILE =
  "relative flex h-full w-full flex-col items-center justify-start gap-1.5 rounded-2xl px-0.5 pt-4 pb-2.5 text-center transition-all hover:bg-muted active:scale-[0.96]";

function TileBody({ label, icon, badge, href, tone }: Tile) {
  return (
    <>
      {/* `rounded-lg` (8px), bukan bulat penuh: keping kotak-membulat terbaca sebagai
          ikon aplikasi, dan bentuknya membedakan ubin layanan dari avatar anak yang
          memang lingkaran. Tanpa shadow — di atas tint lembut, bayangan membuat
          kepingnya tampak mengambang. */}
      {/* Keping 60px, glyph 36px: ~12px napas di tiap sisi. 60px adalah batas atas
          yang muat — di layar 320px ubinnya hanya ~65px setelah padding, jadi
          kepingnya menyisakan ~2px di kiri-kanan. Jangan dibesarkan lagi tanpa
          mengubah grid-nya dulu. */}
      <span className={cn("grid size-[60px] place-items-center rounded-xl", tone, GLASS)}>
        {/* `relative` supaya ikonnya di ATAS lapisan kilau (`before`), bukan tertutup. */}
        <Icon name={icon} filled className="relative text-[36px]" />
      </span>
      {/* `font-normal` (400), bukan bold: di baris ubin yang semuanya tebal, tidak ada
          yang menonjol dan seluruh barisnya terbaca "berteriak" — berat normal membuat
          ikonnya yang memimpin, teks tinggal menamainya. 500 pun masih terbaca tebal
          di sini, jadi turun satu langkah lagi ke 400.

          Kembali ke grid berarti lebar ubin kembali terkunci seperempat layar: 13px
          muat di 390px, tapi di 320px ubinnya hanya ~59px dan "Babysitter" terpotong.
          Jadi 11px di bawah 360px, 13px di atasnya — diukur, bukan ditebak. */}
      <span className="block w-full text-[11px] leading-[15px] font-normal min-[360px]:text-[13px] min-[360px]:leading-[17px]">
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
