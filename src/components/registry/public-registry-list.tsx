"use client";

import { useState } from "react";
import Link from "next/link";
import { REGISTRY_CATEGORIES } from "@/schemas/registry";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ChildFilter, type FilterChild } from "./child-rail";
import { ClaimButton } from "./claim-form";
import { FilterPill, SortSelect } from "./registry-list";
import {
  CATEGORY_LABEL,
  ChildTag,
  ClaimProgress,
  ItemPhoto,
  StoreLinks,
  formatPriceRange,
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
  token,
  origin,
}: {
  rows: PublicRow[];
  childList: FilterChild[];
  token: string;
  origin: string;
}) {
  const [childId, setChildId] = useState<string | null>(null);
  const [category, setCategory] = useState<RegistryCategory | null>(null);
  const [sort, setSort] = useState<SortKey>("priority");

  const byChild = rows.filter((r) => (childId ? r.item.childId === childId : true));
  const visible = sortRows(
    byChild.filter((r) => (category ? r.item.category === category : true)),
    sort,
  );

  const usedCategories = REGISTRY_CATEGORIES.filter((c) =>
    byChild.some((r) => r.item.category === c),
  );
  const childById = new Map(childList.map((c) => [c.id, c]));
  const gifted = rows.filter((r) => r.claimedQty >= r.item.desiredQty).length;

  return (
    <div className="space-y-3">
      <ChildFilter
        childList={childList}
        value={childId}
        onChange={setChildId}
        total={rows.length}
        gifted={gifted}
      />

      <div className="flex items-center gap-2">
        {usedCategories.length > 1 ? (
          <div
            role="tablist"
            aria-label="Saring menurut kategori"
            className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto"
          >
            <FilterPill
              active={category === null}
              onClick={() => setCategory(null)}
              label={`Semua (${byChild.length})`}
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
        ) : (
          <span className="flex-1" />
        )}
        <SortSelect value={sort} onChange={setSort} />
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground text-body-sm py-2 text-center">
          Tidak ada barang pada kelompok ini.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((row) => (
            <PublicCard
              key={row.item.id}
              row={row}
              child={row.item.childId ? (childById.get(row.item.childId) ?? null) : null}
              token={token}
              origin={origin}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function PublicCard({
  row,
  child,
  token,
  origin,
}: {
  row: PublicRow;
  child: FilterChild | null;
  token: string;
  origin: string;
}) {
  const { item, claims, claimedQty } = row;
  const remaining = Math.max(0, item.desiredQty - claimedQty);
  const price = formatPriceRange(item.priceMinIdr, item.priceMaxIdr);
  const photoSrc = (i: number) => `/kado/${token}/foto/${item.id}?i=${i}`;

  return (
    <li className="bg-card flex flex-col gap-3 rounded-2xl border p-3 shadow-sm">
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
            {child && <ChildTag child={child} />}
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

        {claims.length > 0 && (
          <ul className="space-y-1.5">
            {claims.map((c) => (
              <li
                key={c.id}
                className="bg-accent text-primary text-body-sm flex items-start gap-2 rounded-xl p-2.5"
              >
                <Icon name="check_circle" filled className="mt-0.5 text-[16px]" />
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
        <Button asChild variant="ghost" size="sm" className="w-full">
          <Link href={`/kado/${token}/barang/${item.id}`}>
            <Icon name="visibility" className="text-[16px]" />
            Lihat Detail
          </Link>
        </Button>
      </div>
    </li>
  );
}
