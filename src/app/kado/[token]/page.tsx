import type { Metadata } from "next";
import {
  findPublicRegistry,
  findPublicShipping,
  listPublicChildren,
  listPublicItems,
} from "@/lib/data/registry";
import { chronologicalAge, formatAge } from "@/lib/growth/age";
import { requestOrigin } from "@/lib/request-origin";
import { PublicRegistryList } from "@/components/registry/public-registry-list";
import { toPublicRow } from "@/components/registry/registry-shared";
import { ShippingPanel } from "@/components/registry/shipping-panel";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Wishlist Kado" };

/**
 * Halaman publik wishlist — di luar semua route group, jadi tanpa header dan
 * bottom-nav, mengikuti /invite/[token].
 *
 * Token yang mati (tidak dikenal, atau wishlist dijadikan privat lagi) dijawab
 * halaman ramah, bukan `notFound()`: yang membukanya adalah orang yang dikirimi
 * tautan, bukan orang yang salah mengetik URL.
 *
 * Data anak yang tampil di sini sengaja dibatasi tiga hal — foto, nama, dan label
 * umur — supaya pemberi hadiah tahu kadonya untuk siapa. Tanggal lahir mentah
 * tidak pernah dikirim, dan hanya anak yang punya barang publik yang muncul
 * (lihat `listPublicChildren`). Tidak ada pengukuran, riwayat, atau data medis.
 */
export default async function PublicRegistryPage({ params }: PageProps<"/kado/[token]">) {
  const { token } = await params;
  const registry = await findPublicRegistry(token);

  if (!registry) return <NotFoundCard />;

  const [rows, childList, shipping, origin] = await Promise.all([
    listPublicItems(registry.userId),
    listPublicChildren(token),
    findPublicShipping(token),
    requestOrigin(),
  ]);

  /*
    Umur dihitung di server; hanya labelnya yang menyeberang ke klien.

    Barang tanpa anak ikut dihitung untuk setiap anak: itu kado untuk semua anak
    yang terdaftar, bukan kado tanpa tujuan. Tanpa ini registry yang barangnya
    tidak ditujukan ke anak tertentu tidak memunculkan nama anak sama sekali.
  */
  const shared = rows.filter((r) => r.item.childId === null).length;
  const filterChildren = childList.map((c) => ({
    id: c.id,
    name: c.name,
    photoSrc: c.photoKey ? `/kado/${token}/anak/${c.id}` : null,
    age: formatAge(chronologicalAge(c.dateOfBirth)),
    count: rows.filter((r) => r.item.childId === c.id).length + shared,
  }));

  return (
    <main className="bg-background min-h-dvh px-4 pt-6 pb-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="flex items-center gap-2.5">
          <span className="bg-accent text-primary grid size-10 shrink-0 place-items-center rounded-full">
            <Icon name="card_giftcard" filled className="text-[22px]" />
          </span>
          <div className="min-w-0">
            <h1 className="text-headline-sm truncate">Wishlist {registry.ownerName}</h1>
            <p className="text-muted-foreground text-label-sm">
              Pilih barang yang ingin Anda hadiahi. Tidak perlu membuat akun.
            </p>
          </div>
        </header>

        {rows.length === 0 ? (
          <p className="text-muted-foreground text-body-sm bg-card rounded-2xl border p-6 text-center shadow-sm">
            Belum ada barang di wishlist ini.
          </p>
        ) : (
          <PublicRegistryList
            rows={rows.map(toPublicRow)}
            childList={filterChildren}
            ownerName={registry.ownerName}
            token={token}
            origin={origin}
            shippingPanel={shipping ? <ShippingPanel shipping={shipping} /> : null}
          />
        )}
      </div>
    </main>
  );
}

function NotFoundCard() {
  return (
    <main className="bg-background flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="bg-card flex size-16 items-center justify-center rounded-2xl shadow-sm">
        <Icon name="card_giftcard" className="text-muted-foreground text-[32px]" />
      </div>
      <h1 className="text-headline-md mt-4">Wishlist Tidak Ditemukan</h1>
      <p className="text-muted-foreground text-body-sm mt-1 max-w-xs">
        Tautan ini sudah tidak dibagikan atau tidak dikenal. Minta tautan baru dari orang tua yang
        mengirimkannya.
      </p>
    </main>
  );
}
