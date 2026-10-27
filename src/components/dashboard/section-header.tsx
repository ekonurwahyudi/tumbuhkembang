import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icon";

/**
 * Kepala section List Kado dan Shop Katalog — dua section yang sengaja tanpa
 * kartu. Ukurannya mengikuti section beranda lainnya (`text-headline-sm`, 16px),
 * bukan skala tersendiri: dua ukuran judul dalam satu halaman membuat urutannya
 * terbaca sebagai kebetulan.
 *
 * `action` untuk pil hitungan; `href` untuk "Lihat semua". Keduanya opsional dan
 * bisa berdampingan.
 */
export function SectionHeader({
  id,
  icon,
  title,
  subtitle,
  action,
  href,
  hrefLabel = "Lihat semua",
  tone = "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
}: {
  id: string;
  icon: IconName;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  href?: string;
  hrefLabel?: string;
  /** Warna keping ikon; sewarna dengan ubin layanan yang sama di Akses Cepat. */
  tone?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {/* Ikonnya dalam keping berwarna, bukan ikon telanjang: di halaman yang
            judul sectionnya beruntun, keping memberi tiap section jangkar visual
            yang terbaca sebelum teksnya. Warnanya senada dengan ubin layanan yang
            sama di Akses Cepat, jadi "kado" berarti satu warna di seluruh beranda. */}
        <h2 id={id} className="text-headline-sm flex items-center gap-2">
          <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", tone)}>
            <Icon name={icon} filled className="text-[16px]" />
          </span>
          {title}
        </h2>
        {subtitle && <p className="text-muted-foreground text-body-sm mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {action}
        {href && (
          <Link
            href={href}
            className="text-primary text-body-sm inline-flex items-center gap-0.5 font-bold"
          >
            {hrefLabel}
            <Icon name="arrow_forward" className="text-[15px]" />
          </Link>
        )}
      </div>
    </div>
  );
}
