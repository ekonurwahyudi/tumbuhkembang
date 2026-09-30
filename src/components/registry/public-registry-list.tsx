"use client";

import { useState } from "react";
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
  StoreLinks,
  formatPriceRange,
  joinNames,
  type PublicRow,
} from "./registry-shared";
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

  const done = (r: PublicRow) => r.claimedQty >= r.item.desiredQty;
  // Barang tanpa anak ikut di tiap pilihan anak — itu kado untuk mereka semua,
  // jadi menyaring ke satu anak tidak boleh menyembunyikannya.
  const byChild = rows.filter(
    (r) => !childId || r.item.childId === childId || r.item.childId === null,
  );
  const byStatus = byChild.filter((r) =>
    status === "all" ? true : status === "done" ? done(r) : !done(r),
  );
  const visible = sortRows(
    byStatus.filter((r) => (category ? r.item.category === category : true)),
    sort,
  );

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
      />

      {shippingPanel}

      <ChildPills childList={childList} value={childId} onChange={setChildId} total={rows.length} />

      {/* Status dan kategori: dua baris supaya keduanya bisa digeser sendiri di HP. */}
      <div className="flex items-center gap-2">
        <div
          role="tablist"
          aria-label="Saring menurut status"
          className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto"
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
        <SortSelect value={sort} onChange={setSort} />
      </div>

      {usedCategories.length > 1 && (
        <div
          role="tablist"
          aria-label="Saring menurut kategori"
          className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4"
        >
          <FilterPill
            active={category === null}
            onClick={() => setCategory(null)}
            label="Semua Kategori"
          />
          {usedCategories.map((c) => (
            <FilterPill
              key={c}
              active={category === c}
              onClick={() => setCategory(c)}
              label={CATEGORY_LABEL[c]}
            />
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-muted-foreground text-body-sm bg-card rounded-2xl border p-6 text-center shadow-sm">
          Tidak ada barang pada kelompok ini.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
}: {
  childList: FilterChild[];
  value: string | null;
  ownerName: string;
  token: string;
  origin: string;
  listed: number;
  gifted: number;
  waiting: number;
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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copy}
                className="text-primary bg-background inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[12px] font-semibold shadow-sm active:scale-95"
              >
                <Icon name="content_copy" className="text-[16px]" />
                Salin Link
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#25D366] px-4 text-[12px] font-semibold text-white shadow-sm active:scale-95"
              >
                <Icon name="link" className="text-[16px]" />
                WhatsApp
              </a>
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
            className="bg-border h-2 overflow-hidden rounded-full"
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

function PublicCard({
  row,
  child,
  allChildren,
  token,
  origin,
}: {
  row: PublicRow;
  child: FilterChild | null;
  /** Dipakai bila barangnya tidak menyebut anak: kadonya untuk mereka semua. */
  allChildren: FilterChild[];
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
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-headline-sm min-w-0">{item.name}</h2>
            <Icon name="chevron_right" className="text-muted-foreground mt-0.5 text-[18px]" />
          </div>
          {price && <p className="text-metric text-primary tabular-nums">{price}</p>}
          <div className="flex flex-wrap items-center gap-2">
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

        <StoreLinks shopee={item.urlShopee} tokopedia={item.urlTokopedia} tiktok={item.urlTiktok} />

        {item.allowGroup && claimedQty > 0 && (
          <ClaimProgress claimed={claimedQty} desired={item.desiredQty} />
        )}

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
