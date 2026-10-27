"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { REGISTRY_CATEGORIES } from "@/schemas/registry";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ChildPills, type FilterChild } from "./child-rail";
import { ClaimButton } from "./claim-form";
import { FilterPill, SortSelect } from "./registry-list";
import {
  CATEGORY_LABEL,
  ChildFace,
  ChildStack,
  ChildTag,
  ClaimProgress,
  ItemPhoto,
  StoreRow,
  formatPriceRange,
  joinNames,
  type PublicRow,
  type RegistryChild,
} from "./registry-shared";
import { nextActive } from "@/components/shop/shop-search-logic";
import { PRICE_TONE } from "@/components/shop/shop-price";
import { sortRows, type SortKey } from "./sort";
import type { RegistryCategory } from "@/db/schema";

/**
 * Daftar barang di halaman publik. Klien karena penyaring anak dan pengurut
 * hidup di sini; datanya sudah disaring server (`listPublicItems` hanya
 * mengembalikan barang publik), dan `toPublicRow` di registry-shared.tsx sudah
 * membuang pesan pribadi serta nomor resi sebelum menyeberang ke sini.
 */
export function PublicRegistryList({
  rows,
  childList,
  ownerName,
  token,
  origin,
  shippingPanel,
}: {
  rows: PublicRow[];
  childList: FilterChild[];
  ownerName: string;
  token: string;
  origin: string;
  /**
   * Panel alamat + rekening, dirender di SERVER dan diteruskan sebagai node.
   *
   * Prop, bukan impor: komponennya server component dan berkas ini `"use client"`.
   * Letaknya di sini — tepat di atas pil penyaring anak — karena itu yang diminta,
   * dan memang di situ tempatnya: alamat dibaca sekali sebelum memilih barang.
   */
  shippingPanel?: React.ReactNode;
}) {
  const [childId, setChildId] = useState<string | null>(null);
  const [category, setCategory] = useState<RegistryCategory | null>(null);
  const [status, setStatus] = useState<"all" | "open" | "done">("all");
  const [sort, setSort] = useState<SortKey>("priority");
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActive] = useState(-1);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const done = (r: PublicRow) => r.claimedQty >= r.item.desiredQty;
  // Barang tanpa anak ikut di tiap pilihan anak — itu kado untuk mereka semua,
  // jadi menyaring ke satu anak tidak boleh menyembunyikannya.
  const byChild = rows.filter(
    (r) => !childId || r.item.childId === childId || r.item.childId === null,
  );
  const byStatus = byChild.filter((r) =>
    status === "all" ? true : status === "done" ? done(r) : !done(r),
  );
  /*
    Pencarian disaring di browser, bukan lewat URL seperti `/shop`: seluruh barang
    wishlist sudah ada di memori (daftarnya puluhan, bukan ribuan), jadi tidak ada
    yang perlu diambil ulang dari server. Nama DAN catatan ikut dicari — orang tua
    sering menulis merek atau ukuran di catatan, bukan di nama barangnya.
  */
  const q = term.trim().toLowerCase();
  const bySearch = q
    ? byStatus.filter(
        (r) =>
          r.item.name.toLowerCase().includes(q) || (r.item.note ?? "").toLowerCase().includes(q),
      )
    : byStatus;
  const visible = sortRows(
    bySearch.filter((r) => (category ? r.item.category === category : true)),
    sort,
  );

  /*
    Saran untuk dropdown: dicocokkan dari NAMA saja (bukan catatan seperti `bySearch`),
    karena yang ditampilkan di tiap barisnya adalah namanya — saran yang cocok lewat
    catatan tersembunyi akan terbaca seperti hasil yang keliru. Delapan sudah melebihi
    tinggi layar HP, sama dengan batas di `/shop`.
  */
  const matches = q ? byChild.filter((r) => r.item.name.toLowerCase().includes(q)).slice(0, 8) : [];
  const showSuggest = open && matches.length > 0;

  /** Memilih saran mengisi kotak carinya — daftarnya ada di halaman ini juga. */
  const pick = (name: string) => {
    setTerm(name);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") return setOpen(false);
    if (!showSuggest) return;

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => nextActive(i, e.key === "ArrowDown" ? 1 : -1, matches.length));
      return;
    }

    if (e.key === "Enter" && activeIdx >= 0 && activeIdx < matches.length) {
      e.preventDefault();
      pick(matches[activeIdx].item.name);
    }
  };

  const usedCategories = REGISTRY_CATEGORIES.filter((c) =>
    byChild.some((r) => r.item.category === c),
  );
  const childById = new Map(childList.map((c) => [c.id, c]));

  const listed = byChild.length;
  const gifted = byChild.filter(done).length;
  const waiting = listed - gifted;

  return (
    <div className="space-y-4">
      <PublicHero
        childList={childList}
        value={childId}
        ownerName={ownerName}
        token={token}
        origin={origin}
        listed={listed}
        gifted={gifted}
        waiting={waiting}
        shippingPanel={shippingPanel}
      />

      {/* <ChildPills childList={childList} value={childId} onChange={setChildId} total={rows.length} /> */}

      {/*
        Satu baris kendali seperti `/shop`: kotak cari yang melebar + kategori sebagai
        dropdown. Sebelumnya kategori berupa deret pil yang digeser mendatar — enam
        kategori tidak muat sebaris di HP, jadi sebagiannya tersembunyi di luar layar
        tanpa penanda apa pun.

        Beda dari `/shop`, ini TIDAK lewat `<form method=get>`: halaman publik disaring
        di browser (lihat `bySearch`), jadi hasil ketikan langsung terlihat tanpa muat
        ulang — dan tanpa menaruh isi wishlist orang di URL yang bisa ikut tersalin
        saat tautannya diteruskan.
      */}
      <div className="flex items-center gap-2">
        {/*
          Combobox dengan saran bergambar, pola yang sama dengan `ShopSearch` di
          `/shop`: mengetik membuka dropdown berisi foto + nama + harga, panah
          atas/bawah menyorot, Enter membuka barangnya. `nextActive` dipakai ulang
          dari `shop-search-logic.ts` — bukan ditulis ulang, supaya perilaku panahnya
          tidak bisa berbeda diam-diam antara dua halaman.

          Bedanya: memilih saran di sini TIDAK pindah halaman melainkan mengisi kotak
          carinya, karena daftar kadonya memang ada di halaman ini juga.
        */}
        <div className="relative min-w-0 flex-1">
          <label className="bg-card focus-within:ring-ring flex h-10 items-center gap-2 rounded-xl px-3 shadow-sm focus-within:ring-2">
            {/* Tanpa ikon: font ikon di repo ini subset dan TIDAK memuat glyph
                `search`, sementara `list_alt` sebagai gantinya justru terbaca sebagai
                "daftar", bukan "cari". Placeholder-nya sudah menyebut maksudnya, dan
                ruang yang dihemat jadi lebar ketik. */}
            <span className="sr-only">Cari kado</span>
            <input
              type="search"
              value={term}
              onChange={(e) => {
                setTerm(e.target.value);
                setOpen(true);
                setActive(-1);
              }}
              onFocus={() => setOpen(true)}
              /* Ketukan pada saran mencabut fokus SEBELUM `onClick`-nya jalan, jadi
                 menutup seketika di `onBlur` akan membatalkan ketukannya. */
              onBlur={() => {
                blurTimer.current = setTimeout(() => setOpen(false), 120);
              }}
              onKeyDown={onKeyDown}
              placeholder="Cari kado..."
              role="combobox"
              aria-expanded={showSuggest}
              aria-controls="kado-suggestions"
              aria-activedescendant={
                activeIdx >= 0 && showSuggest ? `kado-suggestion-${activeIdx}` : undefined
              }
              autoComplete="off"
              className="text-body-sm min-w-0 flex-1 bg-transparent outline-none"
            />
            {term && (
              <button
                type="button"
                onClick={() => {
                  setTerm("");
                  setOpen(false);
                }}
                aria-label="Hapus pencarian"
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <Icon name="close" className="text-[16px]" />
              </button>
            )}
          </label>

          {showSuggest && (
            /* `div`, bukan `ul`: anak sah satu-satunya `<ul>` adalah `<li>`. */
            <div
              id="kado-suggestions"
              role="listbox"
              aria-label="Saran kado"
              className="bg-card absolute inset-x-0 top-full z-20 mt-1.5 max-h-80 overflow-y-auto rounded-xl py-1 shadow-lg"
            >
              {matches.map((r, i) => {
                const sPrice = formatPriceRange(r.item.priceMinIdr, r.item.priceMaxIdr);
                return (
                  <div
                    key={r.item.id}
                    id={`kado-suggestion-${i}`}
                    role="option"
                    aria-selected={i === activeIdx}
                    /* `onMouseDown` mendahului `onBlur`-nya input; `onClick` tidak. */
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (blurTimer.current) clearTimeout(blurTimer.current);
                      pick(r.item.name);
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 px-2.5 py-2 text-left transition-colors",
                      i === activeIdx && "bg-accent",
                    )}
                  >
                    <span className="bg-accent text-primary grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg">
                      {r.item.photoKeys.length > 0 ? (
                        /* eslint-disable-next-line @next/next/no-img-element -- route foto bertoken, bukan aset statis untuk next/image */
                        <img
                          src={`/kado/${token}/foto/${r.item.id}?i=0`}
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
                      <p className="text-body-sm line-clamp-2 font-bold">{r.item.name}</p>
                      {sPrice && (
                        <p className={cn("text-label-sm mt-0.5", PRICE_TONE)}>{sPrice}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Kategori sebagai SATU ikon, persis pola `CategorySelect` di `/shop`:
            `<select>` bawaan dibuat transparan dan dibentangkan menutupi ikonnya, jadi
            ketukan di ikon membuka picker asli sistem. Labelnya dihapus supaya kotak
            cari di sebelahnya mendapat seluruh sisa lebar — itulah tujuannya.

            Ikonnya menyala + titik penanda saat ada kategori terpilih. Itu wajib,
            bukan hiasan: tanpa label, itu satu-satunya petunjuk bahwa daftar sedang
            disaring. */}
        {usedCategories.length > 1 && (
          <span
            className={cn(
              "bg-card focus-within:ring-ring relative grid size-10 shrink-0 place-items-center rounded-xl shadow-sm focus-within:ring-2",
              category ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon name="apps" filled={category !== null} className="text-[18px]" />

            {category && (
              <span className="bg-primary absolute top-1 right-1 size-1.5 rounded-full" aria-hidden />
            )}

            <select
              value={category ?? ""}
              aria-label="Saring menurut kategori"
              onChange={(e) => setCategory((e.target.value || null) as RegistryCategory | null)}
              className="text-body-sm absolute inset-0 size-full cursor-pointer opacity-0 outline-none"
            >
              <option value="">Semua Kategori</option>
              {usedCategories.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </span>
        )}

        <SortSelect value={sort} onChange={setSort} />
      </div>

      {/* Status tetap pil: hanya tiga, muat sebaris, dan angkanya yang dibaca orang. */}
      <div
        role="tablist"
        aria-label="Saring menurut status"
        className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4"
      >
        <FilterPill
          active={status === "all"}
          onClick={() => setStatus("all")}
          label={`Semua Barang (${byChild.length})`}
        />
        <FilterPill
          active={status === "open"}
          onClick={() => setStatus("open")}
          label={`Belum Dihadiahi (${waiting})`}
        />
        <FilterPill
          active={status === "done"}
          onClick={() => setStatus("done")}
          label={`Sudah Ada (${gifted})`}
        />
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground text-body-sm bg-card rounded-2xl border p-6 text-center shadow-sm">
          Tidak ada barang pada kelompok ini.
        </p>
      ) : (
        // 2 kolom sejak HP, sama dengan grid List Kado dan Shop Katalog di beranda —
        // sebelumnya 1 kolom di bawah `sm`, jadi kartu selebar layar penuh dan orang
        // harus menggulir jauh untuk melihat barang kelima.
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((row) => (
            <PublicCard
              key={row.item.id}
              row={row}
              child={row.item.childId ? (childById.get(row.item.childId) ?? null) : null}
              allChildren={childList}
              token={token}
              origin={origin}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Hero publik: siapa anaknya, dan sejauh mana kebutuhannya sudah terpenuhi.
 *
 * Wajah anak inilah inti panel ini — dua anak berarti dua foto bertumpuk, jadi
 * pemberi hadiah langsung tahu kadonya untuk siapa (kembar pun kelihatan dua).
 * Memilih satu anak menggantinya dengan foto besar + nama + label umur anak itu.
 */
function PublicHero({
  childList,
  value,
  ownerName,
  token,
  origin,
  listed,
  gifted,
  waiting,
  shippingPanel,
}: {
  childList: FilterChild[];
  value: string | null;
  ownerName: string;
  token: string;
  origin: string;
  listed: number;
  gifted: number;
  waiting: number;
  /** Pemicu modal Alamat & Rekening — duduk sebaris dengan tombol WhatsApp. */
  shippingPanel?: React.ReactNode;
}) {
  const active = value ? (childList.find((c) => c.id === value) ?? null) : null;
  const link = `${origin}/kado/${token}`;
  const percent = listed === 0 ? 0 : Math.round((gifted / listed) * 100);

  const who = active
    ? active.name
    : childList.length > 0
      ? joinNames(childList)
      : `Ananda ${ownerName}`;

  const copy = () =>
    navigator.clipboard
      .writeText(link)
      .then(() => toast.success("Tautan tersalin"))
      .catch(() => toast.error("Gagal menyalin — salin manual dari teks"));

  const waText = `Bantu melengkapi kebutuhan tumbuh kembang ${who}: ${link}`;

  return (
    <section
      aria-label="Tujuan kado"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-sky-tint)] via-[var(--color-sky-tint)]/60 to-[var(--color-butter-pastel)]/40 p-4 sm:p-6"
    >
      <div className="bg-background/40 pointer-events-none absolute -top-10 -right-10 size-40 rounded-full" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-3">
          {/*
            Tanpa anak terpilih: SATU kelompok, bukan satu kartu per anak. Wajahnya
            bertumpuk dan namanya satu baris — kadonya untuk mereka bersama, jadi
            memecahnya jadi kartu terpisah justru salah baca (anak kembar butuh hal
            yang sama, bukan dua daftar). Memilih satu anak barulah menampilkan foto
            besar + nama + umur anak itu.
          */}
          {active ? (
            <div className="flex items-center gap-3">
              <ChildFace
                child={active}
                size="lg"
                className="ring-background size-16 shrink-0 ring-4"
              />
              <div className="min-w-0">
                <p className="text-primary text-headline-md truncate">{active.name}</p>
                <p className="text-primary/80 text-label-sm">
                  {active.age} · {active.count} barang
                </p>
              </div>
            </div>
          ) : childList.length > 0 ? (
            <div className="bg-background/70 flex w-fit max-w-full items-center gap-3 rounded-2xl py-2 pr-4 pl-2 backdrop-blur-sm">
              <ChildStack childList={childList} max={3} size="lg" />
              <div className="min-w-0">
                <p className="text-primary text-body-md truncate font-bold">
                  {joinNames(childList)}
                </p>
                <p className="text-primary/70 text-label-sm">
                  {childList.length > 1
                    ? `${childList.length} anak · ${childList.map((c) => c.age).join(", ")}`
                    : childList[0].age}
                </p>
              </div>
            </div>
          ) : null}

          <h2 className="text-primary text-headline-sm sm:text-headline-md">
            Kado yang Tepat, Bermanfaat, dan Penuh Cinta untuk Tumbuh Kembang {who}
          </h2>

          {/* Tautan halaman ini, supaya penerima bisa meneruskannya ke keluarga lain. */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <p className="bg-background/70 text-primary/90 flex min-w-0 flex-1 items-center rounded-full px-4 py-2 text-[12px] backdrop-blur-sm">
              <span className="truncate">{link}</span>
            </p>
            {/* `flex-wrap` + `whitespace-nowrap`: tiga tombol tidak muat sebaris di
                lebar HP. Yang dibungkus TOMBOLNYA (turun ke baris kedua utuh), bukan
                teks di dalamnya — tanpa ini "Lihat Alamat" terpotong di tepi layar. */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copy}
                className="text-primary bg-background inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-semibold whitespace-nowrap shadow-sm active:scale-95"
              >
                <Icon name="content_copy" className="text-[16px]" />
                Salin Link
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 text-[12px] font-semibold whitespace-nowrap text-white shadow-sm active:scale-95"
              >
                <Icon name="link" className="text-[16px]" />
                WhatsApp
              </a>
              {/* Alamat & rekening: di sini, bukan dua kartu yang selalu terbuka di
                  atas daftar barang. Keduanya dulu memakan satu layar penuh di HP
                  sebelum barang pertama terlihat. */}
              {shippingPanel}
            </div>
          </div>
        </div>

        {/* Angka dulu, bar hanya penguat. */}
        <div className="bg-background/80 w-full shrink-0 space-y-2.5 rounded-2xl p-3 backdrop-blur-sm lg:w-64">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-label-sm font-bold">Status Pemenuhan Kado</h3>
            <span className="text-muted-foreground text-label-sm tabular-nums">{percent}%</span>
          </div>
          <dl className="grid grid-cols-3 gap-2">
            <Counter label="Terdaftar" value={listed} />
            <Counter label="Dihadiahi" value={gifted} />
            <Counter label="Menunggu" value={waiting} />
          </dl>
          <div
            className="bg-rule h-2 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={gifted}
            aria-valuemin={0}
            aria-valuemax={listed}
            aria-label="Kemajuan pemenuhan wishlist"
          >
            <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card border-border rounded-xl border p-2 text-center">
      <dd className="text-metric tabular-nums">{value}</dd>
      <dt className="text-muted-foreground text-label-sm font-bold">{label}</dt>
    </div>
  );
}

/**
 * Kartu barang di halaman publik. Diekspor karena halaman detail memakainya juga
 * untuk "Kado Lain" — sebelumnya di sana ada kartu versi sendiri yang lebih miskin
 * (tanpa tombol Klaim, tanpa chip anak, tanpa lambang toko), jadi barang yang sama
 * tampil berbeda tergantung orang sampai lewat mana.
 */
export function PublicCard({
  row,
  child,
  allChildren,
  token,
  origin,
}: {
  row: PublicRow;
  /*
    `RegistryChild`, bukan `FilterChild`: kartu ini hanya memakai nama dan fotonya —
    `count` milik `FilterChild` dipakai pil penyaring, bukan di sini. Menuntutnya
    memaksa setiap pemanggil menghitung jumlah barang per anak yang tidak pernah
    dibaca; halaman detail tidak punya angka itu dan memang tidak membutuhkannya.
  */
  child: RegistryChild | null;
  /** Dipakai bila barangnya tidak menyebut anak: kadonya untuk mereka semua. */
  allChildren: RegistryChild[];
  token: string;
  origin: string;
}) {
  const { item, claims, claimedQty } = row;
  const remaining = Math.max(0, item.desiredQty - claimedQty);
  const price = formatPriceRange(item.priceMinIdr, item.priceMaxIdr);
  const photoSrc = (i: number) => `/kado/${token}/foto/${item.id}?i=${i}`;

  return (
    <li
      className={cn(
        "bg-card flex flex-col gap-3 rounded-2xl border p-3 shadow-sm transition-shadow hover:shadow-md",
        remaining === 0 && "opacity-90",
      )}
    >
      <Link href={`/kado/${token}/barang/${item.id}`} className="block space-y-3 rounded-xl">
        <ItemPhoto
          count={item.photoKeys.length}
          src={photoSrc}
          name={item.name}
          priority={item.priority}
          category={item.category}
          fulfilled={remaining === 0}
        />

        <div className="space-y-1.5 px-1">
          {/* `text-body-sm` + `line-clamp-2`, bukan `text-headline-sm`: di kartu
              selebar setengah layar HP, judul 16px memakan tiga baris dan mendorong
              harga keluar pandangan. Sama dengan kartu List Kado di beranda. */}
          <h2 className="text-body-sm line-clamp-2 font-bold">{item.name}</h2>
          {/* Nada harga yang sama dengan beranda (`PRICE_TONE`, hijau) dan seukuran
              judulnya — sebelumnya `text-metric text-primary`, 20px biru, sehingga
              harga terbaca lebih penting daripada nama barangnya. */}
          {price && <p className={cn("text-body-sm", PRICE_TONE)}>{price}</p>}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Tanpa anak tertentu: satu chip untuk semuanya, bukan satu chip per anak. */}
            {child ? (
              <ChildTag child={child} />
            ) : allChildren.length > 0 ? (
              <span className="bg-muted text-label-sm inline-flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1 font-bold">
                <ChildStack childList={allChildren} max={2} size="sm" />
                Untuk {joinNames(allChildren)}
              </span>
            ) : null}
            <span className="text-muted-foreground text-label-sm">
              Dibutuhkan {item.desiredQty} unit
            </span>
          </div>
        </div>
      </Link>

      <div className="mt-auto space-y-3 px-1">
        {item.note && (
          <p className="bg-muted text-body-sm rounded-xl p-3 italic">&ldquo;{item.note}&rdquo;</p>
        )}

        {/* `StoreRow` (lambang saja), bukan `StoreLinks` (lambang + nama toko): di
            kartu selebar setengah layar HP tiga chip berlabel membungkus jadi dua
            baris dan menenggelamkan nama barangnya. Nama tokonya tidak hilang —
            pindah ke `title` + `sr-only`, dan tombol toko sungguhan ada di detail. */}
        <StoreRow shopee={item.urlShopee} tokopedia={item.urlTokopedia} tiktok={item.urlTiktok} />

        {/* Selalu ada, termasuk saat belum ada yang mengklaim (0/1). Sebelumnya bar
            ini hanya muncul bila `allowGroup` DAN sudah ada klaim, jadi justru kado
            yang masih butuh pembeli — yang paling perlu terbaca "belum terpenuhi" —
            tidak punya penanda apa pun. Bar yang hilang-muncul juga membuat tinggi
            kartu bergeser-geser antar-barang dalam satu grid.

            `compact`: varian yang sama dengan kartu List Kado di beranda. */}
        <ClaimProgress claimed={claimedQty} desired={item.desiredQty} compact />

        {/* Netral, bukan biru merek: yang sudah dibelikan justru tidak perlu menarik mata. */}
        {claims.length > 0 && (
          <ul className="space-y-1.5">
            {claims.map((c) => (
              <li
                key={c.id}
                className="bg-muted/60 text-body-sm flex items-start gap-2 rounded-xl p-2.5"
              >
                <Icon
                  name="check_circle"
                  filled
                  className={cn(
                    "mt-0.5 text-[16px]",
                    c.shipped ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span className="min-w-0">
                  Dibelikan oleh <strong>{c.claimerName}</strong>
                  {c.qty > 1 && ` (${c.qty} unit)`}
                  {" — "}
                  {c.shipped ? "sedang dikirim via kurir" : "menunggu dikirim"}
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

        {/* Di luar <Link> pembungkus foto: tombol di dalam tautan bukan markup yang sah. */}
        <Button asChild variant="outline" size="sm" className="group w-full rounded-full">
          <Link href={`/kado/${token}/barang/${item.id}`}>
            <Icon name="visibility" className="text-[16px]" />
            Lihat Detail
            <Icon
              name="arrow_forward"
              className="text-[16px] transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </Button>
      </div>
    </li>
  );
}
