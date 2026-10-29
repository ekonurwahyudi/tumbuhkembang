"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";

/**
 * "Hadiah Masuk" — dulu daftar yang selalu terbentang di kaki halaman MyRegistry.
 * Sekarang satu tombol berbadge: daftar klaim bukan hal yang dibaca tiap kali
 * halaman dibuka, tapi hal yang dicek saat ada kabar masuk.
 *
 * Dirancang untuk puluhan klaim, bukan tiga: ada pencarian, saringan status, dan
 * daftar yang bertambah per 10. Tanpa itu, wishlist yang ramai berarti satu dialog
 * sepanjang beberapa layar yang harus digulir untuk mencari satu nama.
 *
 * Tanggalnya diformat di SERVER dan dikirim sebagai string (`when`, `relative`) —
 * `toLocaleString` di klien memakai zona waktu perangkat, dan itu membuat teks
 * hasil render server berbeda dengan klien (hydration mismatch).
 */
export type IncomingGift = {
  id: string;
  itemId: string;
  claimerName: string;
  itemName: string;
  qty: number;
  message: string | null;
  trackingNumber: string | null;
  /** Foto barangnya sendiri; false berarti orang tua belum mengunggah foto. */
  itemHasPhoto: boolean;
  /** Foto bukti kirim dari pengklaim — tidak semua klaim punya. */
  hasProofPhoto: boolean;
  /** "22 Sep 2026, 14.30" — sudah diformat di server. */
  when: string;
  /** "2 jam lalu" — sudah diformat di server. */
  relative: string;
};

/** Sepuluh per tambah: satu layar penuh, bukan gulir tanpa akhir. */
const PAGE_SIZE = 10;

type Filter = "all" | "waiting" | "sent";

const FILTER_LABEL: Record<Filter, string> = {
  all: "Semua",
  waiting: "Menunggu",
  sent: "Dikirim",
};

export function IncomingGifts({ gifts }: { gifts: IncomingGift[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [shown, setShown] = useState(PAGE_SIZE);

  // Yang belum punya resi = yang masih perlu ditunggu; itu angka yang berguna
  // di tombol, bukan jumlah total yang tidak berubah lagi setelah dibaca.
  const waiting = gifts.filter((g) => !g.trackingNumber).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return gifts.filter((g) => {
      if (filter === "waiting" && g.trackingNumber) return false;
      if (filter === "sent" && !g.trackingNumber) return false;
      if (!q) return true;
      // Nama pengklaim DAN nama barang: orang tua mencari lewat keduanya —
      // "siapa yang ngasih" dan "stroller-nya siapa yang ambil".
      return (
        g.claimerName.toLowerCase().includes(q) ||
        g.itemName.toLowerCase().includes(q) ||
        (g.trackingNumber?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [gifts, query, filter]);

  if (gifts.length === 0) return null;

  const page = visible.slice(0, shown);
  const reset = () => setShown(PAGE_SIZE);

  return (
    <Dialog onOpenChange={(open) => !open && reset()}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-auto w-full justify-start gap-3 rounded-2xl p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
            <Icon name="card_giftcard" filled className="text-[20px]" />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="text-body-md block font-bold">Hadiah Masuk</span>
            <span className="text-muted-foreground text-label-sm block font-normal">
              {gifts.length} klaim
              {waiting > 0 ? ` • ${waiting} menunggu dikirim` : " • semuanya sudah dikirim"}
            </span>
          </span>
          <Icon name="chevron_right" className="text-muted-foreground shrink-0 text-[18px]" />
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[85dvh] flex-col gap-3 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hadiah Masuk</DialogTitle>
          <DialogDescription>
            Siapa yang mengambil barang mana, dan kapan klaimnya masuk.
          </DialogDescription>
        </DialogHeader>

        {/* Pencarian dan saringan hanya muncul saat daftarnya memang panjang:
            pada tiga klaim, dua kendali ini lebih memakan ruang daripada
            daftarnya sendiri. */}
        {gifts.length > PAGE_SIZE && (
          <div className="space-y-2">
            <Input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                reset();
              }}
              placeholder="Cari nama, barang, atau resi..."
              aria-label="Cari hadiah masuk"
            />
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(FILTER_LABEL) as Filter[]).map((f) => {
                const count =
                  f === "all"
                    ? gifts.length
                    : gifts.filter((g) => (f === "sent" ? g.trackingNumber : !g.trackingNumber))
                        .length;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      setFilter(f);
                      reset();
                    }}
                    aria-pressed={filter === f}
                    className={`text-label-sm rounded-full px-3 py-1.5 font-bold transition-colors ${
                      filter === f
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {FILTER_LABEL[f]} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Hanya daftarnya yang bergulir: pencarian dan saringan tetap terlihat
            sambil menggulir puluhan klaim. */}
        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          {page.length === 0 ? (
            <p className="text-muted-foreground text-body-sm py-6 text-center">
              Tidak ada klaim yang cocok.
            </p>
          ) : (
            <ul className="space-y-2">
              {page.map((g) => (
                <li key={g.id} className="bg-muted rounded-2xl p-3">
                  <div className="flex gap-3">
                    {/* Thumbnail barangnya: pada daftar panjang, foto jauh lebih
                        cepat dikenali daripada nama barang yang mirip-mirip. */}
                    <Link
                      href={`/registry/${g.itemId}`}
                      className="bg-card ring-rule grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl ring-1"
                      aria-label={`Buka ${g.itemName}`}
                    >
                      {g.itemHasPhoto ? (
                        /* eslint-disable-next-line @next/next/no-img-element -- route foto berotorisasi, bukan aset yang bisa dioptimalkan next/image */
                        <img
                          src={`/registry/${g.itemId}/photo?i=0`}
                          alt=""
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      ) : (
                        <Icon
                          name="card_giftcard"
                          filled
                          className="text-muted-foreground text-[24px]"
                        />
                      )}
                    </Link>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-body-md truncate font-bold">{g.claimerName}</span>
                        <span className="text-muted-foreground text-label-sm shrink-0">
                          {g.qty > 1 ? `${g.qty} unit` : "1 unit"}
                        </span>
                      </div>
                      <p className="text-body-sm line-clamp-2">{g.itemName}</p>
                      {/* Waktu lengkap di `title`: yang relatif lebih cepat dibaca,
                          yang persis tetap bisa dilihat saat perlu memastikan. */}
                      <p className="text-muted-foreground text-label-sm flex items-center gap-1">
                        <Icon name="schedule" className="text-[13px]" />
                        <time title={g.when}>{g.relative}</time>
                      </p>
                    </div>
                  </div>

                  {g.message && (
                    <p className="bg-card text-body-sm mt-2 rounded-xl p-2.5 italic">
                      &ldquo;{g.message}&rdquo;
                    </p>
                  )}

                  <div className="mt-2 flex items-start gap-2">
                    <p className="text-body-sm flex min-w-0 flex-1 items-center gap-1">
                      <Icon
                        name={g.trackingNumber ? "check_circle" : "info"}
                        filled={Boolean(g.trackingNumber)}
                        className={`shrink-0 text-[14px] ${
                          g.trackingNumber
                            ? "text-[var(--color-status-normal-text)]"
                            : "text-muted-foreground"
                        }`}
                      />
                      {g.trackingNumber ? (
                        <span className="truncate">
                          Resi <strong className="font-semibold">{g.trackingNumber}</strong>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Menunggu dikirim</span>
                      )}
                    </p>

                    {/* Foto bukti kirim dibuka di tab baru, bukan dipajang di
                        daftar: ia bukti yang sesekali diperiksa, dan pada 20 klaim
                        20 foto besar membuat dialognya berat. */}
                    {g.hasProofPhoto && (
                      <a
                        href={`/registry/klaim/${g.id}/photo`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-label-sm text-primary inline-flex shrink-0 items-center gap-1 font-bold"
                      >
                        <Icon name="visibility" className="text-[14px]" />
                        Bukti kirim
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {shown < visible.length && (
            <Button
              type="button"
              variant="outline"
              className="mt-2 w-full rounded-full"
              onClick={() => setShown(shown + PAGE_SIZE)}
            >
              Tampilkan {Math.min(PAGE_SIZE, visible.length - shown)} lagi
              <span className="text-muted-foreground">
                ({shown} dari {visible.length})
              </span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
