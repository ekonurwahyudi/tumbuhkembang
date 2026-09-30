import type { Metadata } from "next";
import Link from "next/link";
import {
  findPublicItem,
  listPublicChildren,
  listPublicItems,
  remainingQty,
} from "@/lib/data/registry";
import { chronologicalAge, formatAge } from "@/lib/growth/age";
import { requestOrigin } from "@/lib/request-origin";
import { ClaimButton } from "@/components/registry/claim-form";
import {
  CategoryBadge,
  ChildFace,
  ChildStack,
  ClaimProgress,
  ItemGallery,
  ItemPhoto,
  PriorityBadge,
  StoreLinks,
  formatPriceRange,
  joinNames,
} from "@/components/registry/registry-shared";
import { sortRows } from "@/components/registry/sort";
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

  const [childList, origin, siblings] = await Promise.all([
    listPublicChildren(token),
    requestOrigin(),
    /*
      Kado lain dari wishlist yang sama. `registry.userId` datang dari
      `findPublicItem`, yang sudah menguji token + `registry_public` di dalam
      query-nya — jadi tidak ada cabang otorisasi baru di sini, dan
      `listPublicItems` sendiri hanya mengembalikan barang `is_public`.
    */
    listPublicItems(registry.userId),
  ]);

  // Umur diformat di server; tanggal lahir mentah tidak ikut dirender.
  const faces = childList.map((c) => ({
    id: c.id,
    name: c.name,
    photoSrc: c.photoKey ? `/kado/${token}/anak/${c.id}` : null,
    age: formatAge(chronologicalAge(c.dateOfBirth)),
  }));
  const target = item.childId ? faces.filter((c) => c.id === item.childId) : faces;

  // Barang ini sendiri dibuang; yang belum terpenuhi naik ke depan.
  const others = sortRows(
    siblings.filter((r) => r.item.id !== item.id),
    "priority",
  ).toSorted((a, b) => Number(remainingQty(a) === 0) - Number(remainingQty(b) === 0));

  return (
    <main className="bg-background min-h-dvh px-4 pt-6 pb-10">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <Link
          href={`/kado/${token}`}
          className="text-muted-foreground hover:text-foreground text-body-sm inline-flex w-fit items-center gap-1"
        >
          <Icon name="arrow_back" className="text-[16px]" />
          Wishlist {registry.ownerName}
        </Link>

        {/*
          Dua kolom di layar lebar: foto di kiri, keputusan "hadiahi atau tidak" di
          kanan supaya tidak perlu digulir. Di HP keduanya bertumpuk apa adanya.
        */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
          <div className="lg:sticky lg:top-6">
            <ItemGallery count={item.photoKeys.length} src={photoSrc} name={item.name} />
          </div>

          <div className="space-y-4">
            <header className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <PriorityBadge priority={item.priority} />
                <CategoryBadge category={item.category} />
                {remaining === 0 && (
                  <span className="bg-primary text-primary-foreground text-label-sm inline-flex items-center gap-1 rounded-full px-2 py-1 font-bold">
                    <Icon name="check_circle" filled className="text-[14px]" />
                    Sudah Dihadiahi
                  </span>
                )}
              </div>
              <h1 className="text-headline-lg">{item.name}</h1>
              {price && <p className="text-metric text-primary tabular-nums">{price}</p>}
            </header>

            {/*
              Untuk siapa kadonya — foto anaknya, bukan cuma namanya. Barang tanpa
              anak tertentu adalah kado untuk semua anak yang terdaftar: wajahnya
              bertumpuk dalam satu kelompok, bukan satu kotak per anak.
            */}
            {target.length > 0 && (
              <div className="bg-accent flex items-center gap-3 rounded-2xl p-3">
                {target.length === 1 ? (
                  <ChildFace
                    child={target[0]}
                    size="lg"
                    className="ring-background size-12 shrink-0 ring-2"
                  />
                ) : (
                  <ChildStack childList={target} max={3} size="lg" />
                )}
                <div className="min-w-0">
                  <p className="text-primary text-label-sm font-bold">Kado untuk</p>
                  <p className="text-primary text-body-md truncate font-bold">
                    {joinNames(target)}
                  </p>
                  <p className="text-primary/70 text-label-sm">
                    {target.map((c) => c.age).join(", ")}
                  </p>
                </div>
              </div>
            )}

            {(item.description || item.note) && (
              <div className="bg-card space-y-3 rounded-2xl border p-4 shadow-sm">
                {/* `whitespace-pre-line`: tidyText menyisakan satu baris kosong sebagai pemisah paragraf. */}
                {item.description && (
                  <p className="text-body-md whitespace-pre-line">{item.description}</p>
                )}
                {item.note && (
                  <p className="border-primary/30 text-body-sm border-l-2 pl-3 italic">
                    &ldquo;{item.note}&rdquo;
                  </p>
                )}
              </div>
            )}

            <section className="bg-card space-y-3 rounded-2xl border p-4 shadow-sm">
              <h2 className="text-label-sm flex items-center gap-1.5 font-bold">
                <Icon name="card_giftcard" className="text-primary text-[16px]" />
                Cara Menghadiahi
              </h2>
              <p className="text-muted-foreground text-label-sm">
                Dibutuhkan {item.desiredQty} unit
                {item.allowGroup && item.desiredQty > 1 && " · boleh patungan"}
                {remaining > 0 && ` · ${remaining} belum terpenuhi`}
              </p>

              {(item.urlShopee || item.urlTokopedia || item.urlTiktok) && (
                <>
                  <p className="text-muted-foreground text-label-sm">Beli di:</p>
                  <StoreLinks
                    shopee={item.urlShopee}
                    tokopedia={item.urlTokopedia}
                    tiktok={item.urlTiktok}
                  />
                </>
              )}

              {item.allowGroup && claimedQty > 0 && (
                <ClaimProgress claimed={claimedQty} desired={item.desiredQty} />
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
            </section>

            {claims.length > 0 && (
              <section className="space-y-1.5">
                <h2 className="text-label-sm text-muted-foreground font-bold">
                  Sudah dihadiahi oleh
                </h2>
                <ul className="space-y-1.5">
                  {claims.map((c) => (
                    <li
                      key={c.id}
                      className="bg-muted/60 text-body-sm flex items-start gap-2 rounded-xl p-2.5"
                    >
                      {/* Netral: yang sudah dihadiahi tidak perlu warna merek. */}
                      <Icon
                        name="check_circle"
                        filled
                        className="text-muted-foreground mt-0.5 text-[16px]"
                      />
                      <span className="min-w-0">
                        <strong>{c.claimerName}</strong>
                        {c.qty > 1 && ` (${c.qty} unit)`}
                        {" — "}
                        {/* Bukti apa pun bentuknya hanya jadi status di sini. */}
                        {c.trackingNumber || c.photoKey ? "sudah dikirim" : "menunggu dikirim"}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>

        {/*
          Kado lain dari wishlist yang sama. Halaman ini sebelumnya berakhir di satu
          barang — yang membukanya dari WhatsApp tidak punya jalan lain selain tombol
          kembali, padahal barang di sebelahnya justru yang mungkin ia pilih.

          Yang belum dihadiahi didahulukan lalu diurut prioritas: yang sudah terpenuhi
          tidak butuh pembeli lagi, jadi tempatnya di belakang, bukan hilang — hilang
          membuat daftarnya terbaca lebih pendek daripada yang sebenarnya.
        */}
        {others.length > 0 && (
          <section aria-label="Kado lain di wishlist ini" className="space-y-3 pt-2">
            <div className="flex items-end justify-between gap-2">
              <h2 className="text-headline-sm">Kado Lain yang Dibutuhkan</h2>
              <Link
                href={`/kado/${token}`}
                className="text-primary text-body-sm inline-flex shrink-0 items-center gap-1 font-bold"
              >
                Lihat semua ({others.length})
                <Icon name="arrow_forward" className="text-[16px]" />
              </Link>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {others.slice(0, 8).map((r) => {
                const done = remainingQty(r) === 0;
                const otherPrice = formatPriceRange(r.item.priceMinIdr, r.item.priceMaxIdr);
                return (
                  <li key={r.item.id}>
                    <Link
                      href={`/kado/${token}/barang/${r.item.id}`}
                      className="bg-card hover:border-primary/40 block space-y-2 rounded-2xl border p-3 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <ItemPhoto
                        count={r.item.photoKeys.length}
                        src={(i) => `/kado/${token}/foto/${r.item.id}?i=${i}`}
                        name={r.item.name}
                        priority={r.item.priority}
                        category={r.item.category}
                        fulfilled={done}
                      />
                      <h3 className="text-body-md line-clamp-2 font-bold">{r.item.name}</h3>
                      {otherPrice && (
                        <p className="text-body-sm text-primary tabular-nums">{otherPrice}</p>
                      )}
                      <p className="text-muted-foreground text-label-sm">
                        {done ? "Sudah dihadiahi" : `${remainingQty(r)} unit belum terpenuhi`}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
