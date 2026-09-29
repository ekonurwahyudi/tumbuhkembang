import type { Metadata } from "next";
import Link from "next/link";
import { findPublicItem, listPublicChildren, remainingQty } from "@/lib/data/registry";
import { chronologicalAge, formatAge } from "@/lib/growth/age";
import { requestOrigin } from "@/lib/request-origin";
import { ClaimButton } from "@/components/registry/claim-form";
import {
  CategoryBadge,
  ChildTag,
  ClaimProgress,
  ItemGallery,
  PriorityBadge,
  StoreLinks,
  formatPriceRange,
} from "@/components/registry/registry-shared";
import { Icon } from "@/components/ui/icon";

export async function generateMetadata({
  params,
}: PageProps<"/kado/[token]/barang/[itemId]">): Promise<Metadata> {
  const { token, itemId } = await params;
  const found = await findPublicItem(token, itemId);
  return { title: found ? found.row.item.name : "Wishlist Kado" };
}

/**
 * Detail barang sisi publik.
 *
 * Bedanya dengan halaman pemilik bukan soal tata letak: pesan pribadi pengklaim
 * dan nomor resinya tidak ada di sini sama sekali. Nama pengklaim ikut supaya
 * tidak ada dua orang membeli hal yang sama.
 *
 * Barang yang dijadikan privat, atau wishlist yang ditutup, diberi halaman ramah
 * bukan `notFound()` — yang membukanya adalah orang yang dikirimi tautan.
 */
export default async function PublicItemPage({
  params,
}: PageProps<"/kado/[token]/barang/[itemId]">) {
  const { token, itemId } = await params;
  const found = await findPublicItem(token, itemId);

  if (!found)
    return (
      <main className="bg-background flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <div className="bg-card flex size-16 items-center justify-center rounded-2xl shadow-sm">
          <Icon name="card_giftcard" className="text-muted-foreground text-[32px]" />
        </div>
        <h1 className="text-headline-md mt-4">Barang Tidak Ditemukan</h1>
        <p className="text-muted-foreground text-body-sm mt-1 max-w-xs">
          Barang ini sudah tidak dibagikan, atau wishlist-nya kembali privat.
        </p>
        <Link
          href={`/kado/${token}`}
          className="text-primary text-body-sm mt-4 inline-flex items-center gap-1 font-bold"
        >
          <Icon name="arrow_back" className="text-[16px]" />
          Lihat wishlist
        </Link>
      </main>
    );

  const { registry, row } = found;
  const { item, claims, claimedQty } = row;
  const remaining = remainingQty(row);
  const price = formatPriceRange(item.priceMinIdr, item.priceMaxIdr);
  const photoSrc = (i: number) => `/kado/${token}/foto/${item.id}?i=${i}`;

  const [childList, origin] = await Promise.all([listPublicChildren(token), requestOrigin()]);
  const child = item.childId ? (childList.find((c) => c.id === item.childId) ?? null) : null;

  return (
    <main className="bg-background min-h-dvh px-4 pt-6 pb-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <Link
          href={`/kado/${token}`}
          className="text-muted-foreground hover:text-foreground text-body-sm inline-flex w-fit items-center gap-1"
        >
          <Icon name="arrow_back" className="text-[16px]" />
          Wishlist {registry.ownerName}
        </Link>

        <ItemGallery count={item.photoKeys.length} src={photoSrc} name={item.name} />

        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <PriorityBadge priority={item.priority} />
            <CategoryBadge category={item.category} />
          </div>
          <h1 className="text-headline-lg">{item.name}</h1>
          {price && <p className="text-metric text-primary tabular-nums">{price}</p>}
          <div className="flex flex-wrap items-center gap-2">
            {child && (
              <ChildTag
                child={{
                  name: child.name,
                  photoSrc: child.photoKey ? `/kado/${token}/anak/${child.id}` : null,
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
          <p className="bg-muted text-body-sm rounded-xl p-3 italic">
            &ldquo;{item.note}&rdquo;
          </p>
        )}

        <StoreLinks
          shopee={item.urlShopee}
          tokopedia={item.urlTokopedia}
          tiktok={item.urlTiktok}
        />

        {item.allowGroup && claimedQty > 0 && (
          <ClaimProgress claimed={claimedQty} desired={item.desiredQty} />
        )}

        {claims.length > 0 && (
          <ul className="space-y-1.5">
            {claims.map((c) => (
              <li
                key={c.id}
                className="bg-accent text-primary text-body-sm flex items-start gap-2 rounded-xl p-2.5"
              >
                <Icon name="check_circle" filled className="mt-0.5 text-[16px]" />
                <span className="min-w-0">
                  Dibelikan oleh <strong>{c.claimerName}</strong>
                  {c.qty > 1 && ` (${c.qty} unit)`}
                  {" — "}
                  {c.trackingNumber ? "sedang dikirim via kurir" : "menunggu dikirim"}
                </span>
              </li>
            ))}
          </ul>
        )}

        {remaining > 0 ? (
          <ClaimButton
            token={token}
            itemId={item.id}
            itemName={item.name}
            remaining={remaining}
            allowGroup={item.allowGroup}
            origin={origin}
          />
        ) : (
          <p className="text-muted-foreground text-label-sm text-center font-bold">
            Sudah terpenuhi — terima kasih!
          </p>
        )}
      </div>
    </main>
  );
}
