import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { requestOrigin } from "@/lib/request-origin";
import {
  getRegistrySettings,
  getShippingSettings,
  listRegistryChildren,
  listRegistryClaims,
  listRegistryItems,
  registrySummary,
} from "@/lib/data/registry";
import { chronologicalAge, formatAge } from "@/lib/growth/age";
import { EmptyState } from "@/components/empty-state";
import { RegistryList } from "@/components/registry/registry-list";
import { RegistryShareCard } from "@/components/registry/registry-share-card";
import { titled } from "@/components/registry/registry-shared";
import { ShippingDialog } from "@/components/registry/shipping-dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "MyRegistry" };

export default async function RegistryPage() {
  const user = await requireUser();
  const [rows, claims, settings, shipping, childList, origin] = await Promise.all([
    listRegistryItems(user.id),
    listRegistryClaims(user.id),
    getRegistrySettings(user.id),
    getShippingSettings(user.id),
    listRegistryChildren(user.id),
    requestOrigin(),
  ]);

  const summary = registrySummary(rows);

  /*
    Kolomnya nullable supaya akun lama tidak ditolak migrasi, jadi "lengkap" diuji
    di sini — aturan yang sama dengan `findPublicShipping`: alamat separuh tidak
    berguna bagi kurir dan tetap membocorkan tempat tinggal orang.
  */
  const addressComplete = Boolean(
    shipping?.shipName &&
      shipping.shipPhone &&
      shipping.shipProvince &&
      shipping.shipCity &&
      shipping.shipDistrict &&
      shipping.shipAddress,
  );

  /*
    Umur dihitung di server dengan fungsi yang sama seperti child-hero.tsx, jadi
    tanggal lahirnya tidak perlu menyeberang ke klien — hanya labelnya.

    Barang tanpa anak ikut dihitung untuk setiap anak: itu kado untuk semua anak
    yang terdaftar. Anak yang tidak dapat barang apa pun tidak dapat pil penyaring.
  */
  const shared = rows.filter((r) => r.item.childId === null).length;
  const filterChildren = childList
    .map((c) => ({
      id: c.id,
      name: c.name,
      photoSrc: c.photoKey
        ? `/children/${c.id}/photo?v=${encodeURIComponent(c.photoKey)}`
        : null,
      age: formatAge(chronologicalAge(c.dateOfBirth)),
      count: rows.filter((r) => r.item.childId === c.id).length + shared,
    }))
    .filter((c) => c.count > 0);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-headline-lg">MyRegistry</h1>
          <p className="text-muted-foreground text-body-sm mt-0.5">
            Daftar barang impian yang bisa dihadiahi keluarga dan teman.
          </p>
        </div>
        <Button asChild size="sm" className="shrink-0 rounded-full">
          <Link href="/registry/new">
            <Icon name="add" className="text-[16px]" />
            Tambah
          </Link>
        </Button>
      </header>

      <RegistryShareCard
        token={settings?.token ?? null}
        isPublic={settings?.isPublic ?? false}
        ownerName={user.name}
        origin={origin}
        summary={summary}
        shippingAction={<ShippingDialog current={shipping ?? null} complete={addressComplete} />}
      />

      {/*
        Alamat wajib, tapi tidak bisa dipaksa lewat kolom NOT NULL — akun yang sudah
        ada akan ditolak. Jadi diingatkan di sini, di tempat orang tua membagikan
        tautannya: tanpa alamat, yang mengklaim kado tidak punya tujuan kirim.
      */}
      {!addressComplete ? (
        <p className="bg-muted text-body-sm flex items-start gap-2 rounded-2xl p-3">
          <Icon name="info" className="mt-0.5 shrink-0 text-[16px]" />
          <span>
            <strong>Alamat pengiriman belum lengkap.</strong> Pemberi hadiah tidak tahu ke mana
            kadonya dikirim. Isi lewat tombol <strong>Isi Alamat Kirim</strong> di kartu di atas.
          </span>
        </p>
      ) : (
        <p className="bg-accent text-primary text-body-sm flex items-start gap-2 rounded-2xl p-3">
          <Icon name="check_circle" filled className="mt-0.5 shrink-0 text-[16px]" />
          <span>
            Kado dikirim ke <strong>{shipping?.shipName}</strong> —{" "}
            {titled(shipping?.shipDistrict ?? "")}, {titled(shipping?.shipCity ?? "")}
            {shipping?.bankPublic
              ? ". Nomor rekening Anda juga tampil di halaman publik."
              : ". Nomor rekening tidak ditampilkan."}
          </span>
        </p>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon="card_giftcard"
          title="Wishlist masih kosong."
          description="Tambahkan barang yang dibutuhkan si kecil, lalu bagikan tautannya ke keluarga."
          action={
            <Button asChild>
              <Link href="/registry/new">
                <Icon name="add" className="text-[18px]" />
                Tambah Barang
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          {/*
            Tanpa ini, orang tua yang lupa memilih "Untuk Anak" cuma melihat nama
            anaknya tidak muncul di halaman publik tanpa petunjuk apa pun —
            `filterChildren` diam-diam kosong karena tidak ada barang yang merujuk
            anak mana pun.
          */}
          {childList.length > 0 && filterChildren.length === 0 && (
            <p className="bg-muted text-body-sm flex items-start gap-2 rounded-2xl p-3">
              <Icon name="info" className="mt-0.5 shrink-0 text-[16px]" />
              <span>
                Belum ada barang yang ditujukan ke anak tertentu, jadi foto dan nama anak tidak
                tampil di halaman publik. Buka <strong>Ubah</strong> pada barangnya lalu pilih{" "}
                <strong>Untuk Anak</strong>.
              </span>
            </p>
          )}
          <RegistryList rows={rows} childList={filterChildren} />
        </>
      )}

      {/* ponytail: kabar in-app saja; tambah email bila orang tua melewatkan klaim. */}
      {claims.length > 0 && (
        <section className="space-y-2.5" aria-labelledby="hadiah-masuk">
          <h2
            id="hadiah-masuk"
            className="text-muted-foreground text-label-sm font-bold tracking-wider uppercase"
          >
            Hadiah Masuk
          </h2>
          <ul className="space-y-2">
            {claims.map((c) => (
              <li key={c.id} className="bg-card space-y-1 rounded-2xl border p-4 shadow-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-body-md font-bold">{c.claimerName}</span>
                  <span className="text-muted-foreground text-label-sm">
                    {c.qty > 1 ? `${c.qty} unit` : "1 unit"}
                  </span>
                </div>
                <p className="text-body-sm">{c.itemName}</p>
                {c.message && (
                  <p className="bg-muted text-body-sm rounded-xl p-2.5 italic">
                    &ldquo;{c.message}&rdquo;
                  </p>
                )}
                <p className="text-muted-foreground text-label-sm flex items-center gap-1">
                  <Icon
                    name={c.trackingNumber ? "check_circle" : "info"}
                    className="text-[14px]"
                  />
                  {c.trackingNumber
                    ? `Sedang dikirim — resi ${c.trackingNumber}`
                    : "Menunggu dikirim, nomor resi belum diisi"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
