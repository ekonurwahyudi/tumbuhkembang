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
import { DeleteClaimButton, DeleteItemButton } from "@/components/registry/registry-list";
import {
  CategoryBadge,
  ChildStack,
  ChildTag,
  ClaimProgress,
  ItemGallery,
  PriorityBadge,
  StoreLinks,
  formatPriceRange,
  joinNames,
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

  /*
    Chip tujuan kado. Tanpa `childId` barangnya untuk semua anak yang terdaftar —
    satu chip berisi wajah mereka bertumpuk, bukan satu chip per anak.
  */
  const faces = (await listRegistryChildren(user.id)).map((c) => ({
    id: c.id,
    name: c.name,
    photoSrc: c.photoKey
      ? `/children/${c.id}/photo?v=${encodeURIComponent(c.photoKey)}`
      : null,
    age: formatAge(chronologicalAge(c.dateOfBirth)),
  }));
  const target = item.childId ? faces.filter((c) => c.id === item.childId) : faces;

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
          {target.length === 1 ? (
            <ChildTag child={target[0]} />
          ) : target.length > 1 ? (
            <span className="bg-muted text-label-sm inline-flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1 font-bold">
              <ChildStack childList={target} max={3} size="sm" />
              Untuk {joinNames(target)}
            </span>
          ) : null}
          <span className="text-muted-foreground text-label-sm">
            Dibutuhkan {item.desiredQty} unit
            {target.length > 0 && ` · ${target.map((c) => c.age).join(", ")}`}
          </span>
        </div>
      </header>

      {/* `whitespace-pre-line`: tidyText menyisakan satu baris kosong sebagai pemisah paragraf. */}
      {item.description && (
        <p className="text-body-md whitespace-pre-line">{item.description}</p>
      )}

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
                {/*
                  Resi ATAU foto barangnya — dua bentuk bukti yang sama sahnya, jadi
                  yang menentukan statusnya adalah ada-tidaknya salah satu.
                */}
                <p className="text-muted-foreground text-label-sm flex items-center gap-1">
                  <Icon
                    name={c.trackingNumber || c.photoKey ? "check_circle" : "info"}
                    className="text-[14px]"
                  />
                  {c.trackingNumber
                    ? `Sedang dikirim — resi ${c.trackingNumber}`
                    : c.photoKey
                      ? "Sedang dikirim — dengan foto barangnya"
                      : "Menunggu dikirim, belum ada bukti pengiriman"}
                </p>
                {c.photoKey && (
                  <a
                    href={`/registry/klaim/${c.id}/photo`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-accent ring-accent block w-fit overflow-hidden rounded-xl ring-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- route foto bersesi, bukan aset statis untuk next/image */}
                    <img
                      src={`/registry/klaim/${c.id}/photo`}
                      alt={`Foto barang dari ${c.claimerName}`}
                      className="size-24 object-cover"
                    />
                  </a>
                )}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-muted-foreground text-label-sm">
                    Diklaim {formatDateTime(c.createdAt)}
                  </p>
                  {/* Batalkan klaim: yang iseng, atau yang tidak jadi mengirim. */}
                  <DeleteClaimButton claimId={c.id} claimerName={c.claimerName} />
                </div>
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
