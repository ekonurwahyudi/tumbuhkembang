import Link from "next/link";
import { RegistryGridCard } from "@/components/registry/registry-shared";
import { SectionHeader } from "@/components/dashboard/section-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { ItemWithClaims } from "@/lib/data/registry";

/**
 * Daftar kado di beranda, grid dua kolom — bentuk yang sama dengan `ShopStrip` di
 * bawahnya lewat kartu `RegistryGridCard` yang juga dipakai /registry, jadi ketiga
 * tempat ini tidak bisa diam-diam berbeda.
 *
 * Maksimal 4 kartu tampak di HP (`hidden sm:block` pada kartu ke-5) — lima kartu
 * di grid dua kolom menyisakan satu kartu sendirian di baris ketiga. Tombol
 * "Lihat List Kado" di bawah grid, khusus HP, jadi jalan ke sisanya tetap jelas
 * tanpa bergantung pada tautan "Lihat semua" yang kecil di judul.
 *
 * Daftar kosong → kartu ajakan, bukan `null`: barang pertama butuh jalan masuk
 * yang jelas, bukan section yang diam-diam hilang.
 */
export function RegistryStrip({
  rows,
  summary,
}: {
  rows: ItemWithClaims[];
  summary: { listed: number; gifted: number };
}) {
  if (rows.length === 0)
    return (
      <EmptyState
        icon="card_giftcard"
        title="Belum ada List Kado"
        description="Ayo tambahkan list kadomu buat si kecil dan bagikan ke bestimu"
        tone="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
        action={
          <Button asChild className="rounded-full">
            <Link href="/registry/new">
              <Icon name="add" className="text-[18px]" />
              Tambah List Kado
            </Link>
          </Button>
        }
      />
    );

  return (
    <section className="space-y-3" aria-labelledby="list-kado">
      <SectionHeader
        id="list-kado"
        icon="card_giftcard"
        title="List Kado"
        href="/registry"
        /* Amber, sewarna ubin MyRegistry di Akses Cepat. */
        tone="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
        action={
          <span className="bg-accent text-primary text-label-sm rounded-full px-2.5 py-1 font-bold">
            {summary.gifted}/{summary.listed} terpenuhi
          </span>
        }
      />

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {rows.map(({ item, claims, claimedQty }, i) => (
          <li key={item.id} className={cn(i >= 4 && "hidden sm:block")}>
            <RegistryGridCard item={item} claimCount={claims.length} claimedQty={claimedQty} />
          </li>
        ))}
      </ul>

      <Button asChild variant="outline" className="w-full rounded-full sm:hidden">
        <Link href="/registry">
          Lihat List Kado
          <Icon name="arrow_forward" className="text-[16px]" />
        </Link>
      </Button>
    </section>
  );
}
