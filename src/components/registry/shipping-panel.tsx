"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { CopyField } from "./copy-field";
import { BankChip, titled } from "./registry-shared";
import type { PublicShipping } from "@/lib/data/registry";

/**
 * Alamat kirim DAN rekening dalam satu modal, dibuka dari tombol "Lihat Alamat" di
 * samping tombol WhatsApp.
 *
 * Dulu dua kartu sejajar yang selalu terbuka di atas daftar barang. Keduanya memakan
 * satu layar penuh di HP sebelum barang pertama terlihat — padahal alamat hanya
 * dibutuhkan SETELAH orang memilih kado, bukan sebelumnya. Di dalam modal keduanya
 * tetap bisa dibaca utuh tanpa menunda yang dicari orang.
 *
 * Tetap dua bagian DI DALAM modal, bukan satu daftar panjang: kirim barang dan kirim
 * uang adalah dua pilihan yang saling menggantikan, jadi menggabungnya jadi satu
 * kolom akan terbaca sebagai satu instruksi berurutan.
 *
 * Kini `"use client"` karena Dialog butuh state. Yang menentukan APA yang sampai ke
 * sini tetap `findPublicShipping` di server — token + `registry_public` + `bank_public`
 * diuji di dalam query itu, jadi komponen ini tidak punya cabang otorisasi sendiri.
 */
export function ShippingPanel({ shipping }: { shipping: PublicShipping }) {
  const { bank } = shipping;
  const region = `${titled(shipping.district)}, ${titled(shipping.city)}, ${titled(shipping.province)}`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {/* Tinggi dan bentuknya mengikuti tombol WhatsApp di sebelahnya (h-10, pil,
            12px) supaya keduanya terbaca sebagai satu pasang, bukan dua gaya. */}
        <button
          type="button"
          className="bg-primary text-primary-foreground inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-semibold whitespace-nowrap shadow-sm transition-colors hover:bg-[#1C74CC] active:scale-95"
        >
          <Icon name="home" className="text-[16px]" />
          Lihat Alamat
        </button>
      </DialogTrigger>

      {/* `max-h` + `overflow-y-auto`: di HP pendek, alamat tiga baris plus rekening
          melebihi tinggi layar, dan modal yang isinya terpotong tanpa bisa digulir
          membuat nomor rekening tidak pernah terbaca. */}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alamat &amp; Rekening</DialogTitle>
          <DialogDescription>
            Kirim barangnya ke alamat di bawah, atau kirim tunai ke rekeningnya — pilih salah satu.
          </DialogDescription>
        </DialogHeader>

        {/* Tiap bagian jadi panel bernada sendiri, BUKAN dipisah `border-t`: garis
            itu tak terlihat lagi sejak `--border` dibuat transparan di seluruh
            aplikasi, jadi alamat dan rekening akan mengalir jadi satu daftar panjang
            — padahal keduanya dua pilihan yang saling menggantikan. */}
        <section aria-label="Alamat pengiriman kado" className="bg-muted/50 space-y-2 rounded-2xl p-3">
          {/* Judul bagian 13px, sejajar dengan skala kartu di seluruh aplikasi —
              11px membuatnya terbaca sebagai keterangan, bukan kepala bagian. */}
          <h3 className="text-body-sm flex items-center gap-2 font-bold">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-300">
              <Icon name="home" filled className="text-[16px]" />
            </span>
            Kirim Barang Ke
          </h3>

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
        </section>

        {bank && (
          <section
            aria-label="Rekening untuk kirim tunai"
            className="bg-muted/50 space-y-2 rounded-2xl p-3"
          >
            <h3 className="text-body-sm flex items-center gap-2 font-bold">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
                <Icon name="card_giftcard" filled className="text-[16px]" />
              </span>
              Kirim Tunai
              <span className="text-muted-foreground text-label-sm font-normal">(opsional)</span>
            </h3>

            {/* Dibungkus keping berlatar kartu seperti baris `CopyField` di bawahnya:
                berdiri telanjang di atas panel bernada, logo banknya (yang memang
                berlatar putih sendiri) terbaca sebagai kotak kosong yang mengambang. */}
            <div className="bg-card rounded-xl p-2.5">
              <BankChip code={bank.name} />
            </div>

            <CopyField label="Nomor Rekening" value={bank.account} icon="badge" mono />
            <CopyField label="Atas Nama" value={bank.holder} icon="person" />
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}
