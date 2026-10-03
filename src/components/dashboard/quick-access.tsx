import Link from "next/link";
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
};

export function QuickAccess({
  childId,
  registryClaims = 0,
}: {
  childId: string;
  /** Jumlah klaim kado masuk — jadi badge, satu-satunya kabar ke orang tua. */
  registryClaims?: number;
}) {
  const tiles: Tile[] = [
    { label: "Profil Anak", icon: "child_care", href: `/children/${childId}` },
    { label: "Jadwal Vaksin", icon: "vaccines", href: `/children/${childId}#vaksinasi` },
    { label: "Asupan ASI", icon: "water_bottle", href: `/children/${childId}/feeding` },
    { label: "Grafik WHO", icon: "analytics", href: `/children/${childId}/growth` },
    { label: "Shop Katalog", icon: "card_giftcard", href: "/shop" },
    {
      label: "MyRegistry",
      icon: "list_alt",
      href: "/registry",
      badge: registryClaims > 0 ? String(registryClaims) : undefined,
    },
    { label: "Nakes Care", icon: "medical_services", badge: "Siaga" },
    { label: "Babysitter", icon: "family_restroom", badge: "Baru" },
  ];

  return (
    <section className="bg-card rounded-2xl border p-4 shadow-sm" aria-labelledby="akses-cepat">
      <h2 id="akses-cepat" className="text-headline-sm flex items-center gap-1.5">
        <Icon name="apps" className="text-primary text-[18px]" />
        Akses Cepat
      </h2>
      <p className="text-muted-foreground text-body-sm mt-0.5">Layanan utama si kecil</p>

      <ul className="mt-3.5 grid grid-cols-4 gap-2.5">
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

const TILE =
  "bg-muted relative flex h-full min-h-[76px] w-full flex-col items-center justify-center gap-1.5 rounded-xl px-1 py-2.5 text-center transition-transform active:scale-[0.96]";

function TileBody({ label, icon, badge, href }: Tile) {
  return (
    <>
      <span className="bg-card text-primary grid size-9 place-items-center rounded-full shadow-sm">
        <Icon name={icon} className="text-[19px]" />
      </span>
      <span className="text-label-sm block leading-tight font-bold">{label}</span>
      {badge && (
        <span className="bg-[var(--color-butter-pastel)] text-label-sm absolute top-1 right-1 rounded-full px-1.5 font-bold text-[var(--color-on-butter)]">
          {badge}
        </span>
      )}
      {!href && <span className="sr-only">(belum tersedia)</span>}
    </>
  );
}
