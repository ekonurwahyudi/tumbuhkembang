import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  getRegistryItemWithClaims,
  listRegistryChildren,
  remainingQty,
} from "@/lib/data/registry";
import { chronologicalAge, formatAge } from "@/lib/growth/age";
import { formatDateTime } from "@/lib/format";
import { DeleteItemButton } from "@/components/registry/registry-list";
import {
  CategoryBadge,
  ChildTag,
  ClaimProgress,
  ItemGallery,
  PriorityBadge,
  StoreLinks,
  formatPriceRange,
} from "@/components/registry/registry-shared";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export async function generateMetadata({
  params,
}: PageProps<"/registry/[itemId]">): Promise<Metadata> {
  const user = await requireUser();
  const { itemId } = await params;
  const row = await getRegistryItemWithClaims(user.id, itemId);
  return { title: row ? row.item.name : "Barang Impian" };
}

/**
 * Detail barang sisi pemilik. Di sini semuanya terlihat — termasuk pesan pribadi
 * pengklaim dan nomor resinya, yang tidak ditampilkan di halaman publik.
 *
 * Barang milik orang lain sama saja dengan tidak ada: 404, bukan pesan lain.
 */
export default async function RegistryItemPage({ params }: PageProps<"/registry/[itemId]">) {
  const user = await requireUser();
  const { itemId } = await params;

  const row = await getRegistryItemWithClaims(user.id, itemId);
  if (!row) notFound();

  const { item, claims, claimedQty } = row;
  const remaining = remainingQty(row);
  const price = formatPriceRange(item.priceMinIdr, item.priceMaxIdr);
  const photoSrc = (i: number) => `/registry/${item.id}/photo?i=${i}`;

  // Satu query anak hanya untuk chip tujuan; tanpa childId tidak perlu sama sekali.
  const child = item.childId
    ? ((await listRegistryChildren(user.id)).find((c) => c.id === item.childId) ?? null)
    : null;

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Link
        href="/registry"
        className="text-muted-foreground hover:text-foreground text-body-sm inline-flex w-fit items-center gap-1"
      >
        <Icon name="arrow_back" className="text-[16px]" />
        Kembali ke MyRegistry
      </Link>

      <ItemGallery count={item.photoKeys.length} src={photoSrc} name={item.name} />

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <PriorityBadge priority={item.priority} />
          <CategoryBadge category={item.category} />
          {!item.isPublic && (
            <span className="text-muted-foreground text-label-sm inline-flex items-center gap-1 rounded-full border px-2 py-1 font-bold">
              <Icon name="visibility_off" className="text-[14px]" />
              Privat
            </span>
          )}
        </div>
        <h1 className="text-headline-lg">{item.name}</h1>
        {price && <p className="text-metric text-primary tabular-nums">{price}</p>}
        <div className="flex flex-wrap items-center gap-2">
          {child && (
            <ChildTag
              child={{
                name: child.name,
                photoSrc: child.photoKey
                  ? `/children/${child.id}/photo?v=${encodeURIComponent(child.photoKey)}`
                  : null,
              }}
            />
          )}
          <span className="text-muted-foreground text-label-sm">
            Dibutuhkan {item.desiredQty} unit
            {child && ` · ${formatAge(chronologicalAge(child.dateOfBirth))}`}
          </span>
        </div>
      </header>

      {item.description && <p className="text-body-md">{item.description}</p>}

      {item.note && (
        <p className="bg-muted text-body-sm rounded-xl p-3 italic">&ldquo;{item.note}&rdquo;</p>
      )}

      <StoreLinks shopee={item.urlShopee} tokopedia={item.urlTokopedia} tiktok={item.urlTiktok} />

      <section className="space-y-2.5" aria-labelledby="pemenuhan">
        <h2
          id="pemenuhan"
          className="text-muted-foreground text-label-sm font-bold tracking-wider uppercase"
        >
          Pemenuhan
        </h2>
        <div className="bg-card space-y-3 rounded-2xl border p-4 shadow-sm">
          <ClaimProgress claimed={claimedQty} desired={item.desiredQty} />
          <p className="text-muted-foreground text-label-sm">
            {remaining === 0
              ? "Sudah terpenuhi seluruhnya."
              : `Sisa ${remaining} unit belum ada yang mengambil.`}
            {item.allowGroup ? " Patungan diizinkan." : " Satu pemberi mengambil seluruhnya."}
          </p>
        </div>
      </section>

      <section className="space-y-2.5" aria-labelledby="pengklaim">
        <h2
          id="pengklaim"
          className="text-muted-foreground text-label-sm font-bold tracking-wider uppercase"
        >
          Pemberi Hadiah ({claims.length})
        </h2>

        {claims.length === 0 ? (
          <p className="text-muted-foreground text-body-sm bg-card rounded-2xl border p-4 shadow-sm">
            Belum ada yang mengklaim barang ini.
          </p>
        ) : (
          <ul className="space-y-2">
            {claims.map((c) => (
              <li key={c.id} className="bg-card space-y-1.5 rounded-2xl border p-4 shadow-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-body-md font-bold">{c.claimerName}</span>
                  <span className="text-muted-foreground text-label-sm">
                    {c.qty > 1 ? `${c.qty} unit` : "1 unit"}
                  </span>
                </div>
                {/* Pesan pribadi pengklaim: hanya di sini, tidak di halaman publik. */}
                {c.message && (
                  <p className="bg-muted text-body-sm rounded-xl p-2.5 italic">
                    &ldquo;{c.message}&rdquo;
                  </p>
                )}
                <p className="text-muted-foreground text-label-sm flex items-center gap-1">
                  <Icon name={c.trackingNumber ? "check_circle" : "info"} className="text-[14px]" />
                  {c.trackingNumber
                    ? `Sedang dikirim — resi ${c.trackingNumber}`
                    : "Menunggu dikirim, nomor resi belum diisi"}
                </p>
                <p className="text-muted-foreground text-label-sm">
                  Diklaim {formatDateTime(c.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex items-center justify-between gap-2 border-t pt-4">
        <Button asChild variant="outline" size="sm">
          <Link href={`/registry/${item.id}/edit`}>
            <Icon name="edit" className="text-[16px]" />
            Ubah Barang
          </Link>
        </Button>
        <DeleteItemButton
          itemId={item.id}
          name={item.name}
          hasClaims={claims.length > 0}
          redirectTo="/registry"
        />
      </div>
    </div>
  );
}
