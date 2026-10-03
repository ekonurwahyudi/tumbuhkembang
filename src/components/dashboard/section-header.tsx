import Link from "next/link";
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
}: {
  id: string;
  icon: IconName;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className="text-headline-sm flex items-center gap-1.5">
          <Icon name={icon} className="text-primary text-[18px]" />
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
