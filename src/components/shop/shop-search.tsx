"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ShopPrice } from "@/components/shop/shop-price";
import { matchSuggestions, nextActive } from "@/components/shop/shop-search-logic";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { ShopSuggestion } from "@/lib/data/shop";

/**
 * Kotak cari katalog dengan saran bergambar.
 *
 * Dulu `<datalist>`: tanpa JS sama sekali, tapi ia hanya bisa menampilkan teks — tidak
 * ada tempat untuk thumbnail dan harga di dalamnya. Itulah satu-satunya alasan berkas
 * ini jadi pulau klien.
 *
 * Yang TIDAK ikut jadi klien: daftarnya. Seluruh nama produk terbit dikirim sekali saat
 * halaman dirender dan disaring di browser — tidak ada endpoint saran, tidak ada
 * debounce, tidak ada keadaan memuat yang harus digambar.
 *
 * ponytail: naikkan ke endpoint saran bila katalognya melewati beberapa ratus produk;
 * `listShopSuggestions` sudah membatasi di 200 baris, dan di atas itu daftarnya mulai
 * membebani setiap render halaman.
 *
 * Formnya tetap `method="get"` yang sungguhan: Enter tanpa memilih saran tetap
 * men-submit pencarian biasa, dan hasilnya tetap bisa di-bookmark. Saran hanya jalan
 * pintas ke halaman produknya.
 */
export function ShopSearch({
  defaultValue,
  suggestions,
  favorit,
  children,
}: {
  defaultValue: string;
  suggestions: ShopSuggestion[];
  /** Submit di tab Favorit harus tetap di tab Favorit. */
  favorit: boolean;
  /** Pemilih kategori, dirender server dan diselipkan di dalam form yang sama. */
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = matchSuggestions(suggestions, term);
  const show = open && matches.length > 0;

  const go = (id: string) => {
    setOpen(false);
    router.push(`/shop/${id}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") return setOpen(false);
    if (!show) return;

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => nextActive(i, step, matches.length));
      return;
    }

    // Enter dengan satu saran tersorot membuka produknya; tanpa sorotan, form submit.
    if (e.key === "Enter" && active >= 0 && active < matches.length) {
      e.preventDefault();
      go(matches[active].id);
    }
  };

  return (
    <form method="get" className="relative flex min-w-0 flex-1 items-center gap-2" role="search">
      {favorit && <input type="hidden" name="favorit" value="1" />}

      <div className="relative min-w-0 flex-1">
        <input
          type="search"
          name="q"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          /*
            Ketukan pada saran mencabut fokus dari input SEBELUM `onClick`-nya jalan,
            jadi menutup seketika di `onBlur` akan membatalkan ketukannya. Jeda sesaat
            memberi klik itu kesempatan lebih dulu.
          */
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={onKeyDown}
          placeholder="Cari produk"
          aria-label="Cari produk"
          role="combobox"
          aria-expanded={show}
          aria-controls="shop-suggestions"
          aria-activedescendant={active >= 0 && show ? `shop-suggestion-${active}` : undefined}
          autoComplete="off"
          className="bg-card border-border text-body-sm focus-visible:ring-ring h-10 w-full min-w-0 rounded-xl border px-3.5 shadow-sm outline-none focus-visible:ring-2"
        />

        {show && (
          /* `div`, bukan `ul`: anak sah satu-satunya `<ul>` adalah `<li>`. */
          <div
            id="shop-suggestions"
            role="listbox"
            aria-label="Saran produk"
            className="bg-card absolute inset-x-0 top-full z-20 mt-1.5 max-h-80 overflow-y-auto rounded-xl border py-1 shadow-lg"
          >
            {/*
              `div role="option"`, bukan `<button>`: `ShopPrice` menggambar elemen blok,
              dan elemen blok di dalam tombol itu HTML tak sah. Opsi memang tidak perlu
              jadi perhentian Tab — pola combobox ARIA menyimpan fokus di input dan
              menunjuk opsi aktifnya lewat `aria-activedescendant`, yang dipasang di atas.
            */}
            {matches.map((s, i) => (
              <div
                key={s.id}
                id={`shop-suggestion-${i}`}
                role="option"
                aria-selected={i === active}
                /* `onMouseDown` mendahului `onBlur`-nya input; `onClick` tidak. */
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                  go(s.id);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 px-2.5 py-2 text-left transition-colors",
                  i === active && "bg-accent",
                )}
              >
                <span className="bg-accent text-primary grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg">
                  {s.hasPhoto ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- route foto berotorisasi, bukan aset statis untuk next/image */
                    <img
                      src={`/shop/${s.id}/photo?i=0`}
                      alt=""
                      className="size-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <Icon name="card_giftcard" filled className="text-[18px]" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-body-sm line-clamp-2 font-bold">{s.name}</p>
                  <ShopPrice price={s.priceIdr} original={s.priceOriginalIdr} className="mt-0.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {children}
    </form>
  );
}
