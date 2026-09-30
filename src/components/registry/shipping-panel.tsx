import { Icon } from "@/components/ui/icon";
import { CopyAllButton, CopyField } from "./copy-field";
import { BankChip, titled } from "./registry-shared";
import type { PublicShipping } from "@/lib/data/registry";

/**
 * Alamat kirim dan rekening di halaman publik — DUA kartu, bukan satu.
 *
 * Terpisah karena keduanya adalah dua pilihan yang saling menggantikan: kirim
 * barangnya, atau kirim uangnya. Digabung dalam satu kartu keduanya terbaca sebagai
 * satu instruksi berurutan, padahal pembeli hanya perlu salah satu.
 *
 * Server component tanpa `"use client"`: yang menentukan apa yang muncul di sini
 * adalah `findPublicShipping` — token + `registry_public` + `bank_public` diuji di
 * dalam query itu. Panel ini tidak punya cabang otorisasi sendiri; kalau datanya
 * sampai ke sini, ia memang boleh tampil. Tombol salinnya sendiri komponen klien
 * kecil (`copy-field.tsx`), jadi yang menyeberang hanya teks yang sudah tampil.
 */
export function ShippingPanel({ shipping }: { shipping: PublicShipping }) {
  const { bank } = shipping;
  const region = `${titled(shipping.district)}, ${titled(shipping.city)}, ${titled(shipping.province)}`;

  /*
    Satu blok siap tempel ke kolom "Alamat Pengiriman" di Shopee/Tokopedia — itulah
    yang sebenarnya dilakukan pembeli, dan menyalin empat field satu-satu ke satu
    kotak adalah pekerjaan yang tidak perlu.
  */
  const fullAddress = [shipping.name, shipping.phone, shipping.address, region].join("\n");

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <section
        aria-label="Alamat pengiriman kado"
        className="bg-card flex flex-col gap-3 rounded-2xl border p-4 shadow-sm"
      >
        <h2 className="text-headline-sm flex items-center gap-2">
          <span className="bg-accent text-primary grid size-8 shrink-0 place-items-center rounded-full">
            <Icon name="home" filled className="text-[16px]" />
          </span>
          Kirim Barang Ke
        </h2>

        <div className="space-y-2.5">
          <CopyField label="Nama Penerima" value={shipping.name} icon="person" />
          <CopyField
            label="Nomor HP"
            value={shipping.phone}
            icon="smartphone"
            mono
            // tel: supaya kurir bisa langsung menelepon dari HP.
            display={
              <a
                href={`tel:${shipping.phone.replace(/[^\d+]/g, "")}`}
                className="text-primary font-semibold underline-offset-2 hover:underline"
              >
                {shipping.phone}
              </a>
            }
          />
          <CopyField
            label="Alamat Lengkap"
            value={`${shipping.address}\n${region}`}
            icon="list_alt"
            display={
              <>
                {/* whitespace-pre-line: alamat ditulis berbaris dan dirapikan tidyText. */}
                <span className="block whitespace-pre-line">{shipping.address}</span>
                <span className="text-muted-foreground block">{region}</span>
              </>
            }
          />
        </div>

        {/* <div className="mt-auto space-y-2 pt-1">
          <CopyAllButton text={fullAddress} label="Salin Semua (Nama, HP, Alamat)" />
          <p className="text-muted-foreground text-label-sm text-center">
            Tempel langsung ke kolom alamat di Shopee, Tokopedia, atau TikTok Shop.
          </p>
        </div> */}
      </section>

      {bank && (
        <section
          aria-label="Rekening untuk kirim tunai"
          className="bg-card flex flex-col gap-3 rounded-2xl border p-4 shadow-sm"
        >
          <h2 className="text-headline-sm flex items-center gap-2">
            <span className="bg-accent text-primary grid size-8 shrink-0 place-items-center rounded-full">
              <Icon name="card_giftcard" filled className="text-[16px]" />
            </span>
            Kirim Tunai
            <span className="text-muted-foreground text-label-sm font-bold">(opsional)</span>
          </h2>

          <BankChip code={bank.name} />

          <div className="space-y-2.5">
            <CopyField label="Nomor Rekening" value={bank.account} icon="badge" mono />
            <CopyField label="Atas Nama" value={bank.holder} icon="person" />
          </div>

          {/* <p className="text-muted-foreground text-label-sm mt-auto pt-1">
            Untuk yang lebih memilih mengirim uang daripada barang. Tidak wajib — memilih barang di
            daftar bawah sama membantunya.
          </p> */}
        </section>
      )}
    </div>
  );
}
