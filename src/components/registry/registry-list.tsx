"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteRegistryItemAction } from "@/lib/actions/registry";
import { REGISTRY_CATEGORIES } from "@/schemas/registry";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ChildFilter, type FilterChild } from "./child-rail";
import {
  CATEGORY_LABEL,
  ChildTag,
  ClaimProgress,
  ItemPhoto,
  StoreLinks,
  formatPriceRange,
} from "./registry-shared";
import { SORT_LABEL, sortRows, type SortKey } from "./sort";
import type { RegistryCategory, RegistryClaim, RegistryItem } from "@/db/schema";

/** Bentuk yang dikirim halaman: item + klaimnya, sudah diringkas di server. */
export type ListRow = {
  item: RegistryItem;
  claims: RegistryClaim[];
  claimedQty: number;
};

type Status = "all" | "open" | "done";

const STATUS_LABEL: Record<Status, string> = {
  all: "Semua",
  open: "Belum",
  done: "Sudah Ada",
};

export function RegistryList({
  rows,
  childList,
}: {
  rows: ListRow[];
  childList: FilterChild[];
}) {
  const [status, setStatus] = useState<Status>("all");
  const [category, setCategory] = useState<RegistryCategory | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("priority");

  const done = (r: ListRow) => r.claimedQty >= r.item.desiredQty;
  const byChild = rows.filter((r) => (childId ? r.item.childId === childId : true));
  const byStatus = byChild.filter((r) =>
    status === "all" ? true : status === "done" ? done(r) : !done(r),
  );
  const visible = sortRows(
    byStatus.filter((r) => (category ? r.item.category === category : true)),
    sort,
  );

  // Kategori yang tidak dipakai tidak perlu chip-nya.
  const usedCategories = REGISTRY_CATEGORIES.filter((c) =>
    byChild.some((r) => r.item.category === c),
  );

  const childById = new Map(childList.map((c) => [c.id, c]));

  return (
    <div className="space-y-3">
      <ChildFilter
        childList={childList}
        value={childId}
        onChange={setChildId}
        total={rows.length}
        gifted={rows.filter(done).length}
      />

      {/*
        Dua baris penyaring digeser mendatar: pada lebar HP enam kategori tidak
        muat sebaris. Label teks selalu tampak, tidak ada penanda warna saja.
      */}
      <div className="flex items-center gap-2">
        <div
          role="tablist"
          aria-label="Saring menurut status"
          className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto"
        >
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <FilterPill
              key={s}
              active={status === s}
              onClick={() => setStatus(s)}
              label={`${STATUS_LABEL[s]} (${
                s === "all"
                  ? byChild.length
                  : byChild.filter((r) => (s === "done" ? done(r) : !done(r))).length
              })`}
            />
          ))}
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
        <p className="text-muted-foreground text-body-sm py-2">
          Tidak ada barang pada kelompok ini.
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((row) => (
            <ItemCard
              key={row.item.id}
              row={row}
              child={row.item.childId ? (childById.get(row.item.childId) ?? null) : null}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemCard({ row, child }: { row: ListRow; child: FilterChild | null }) {
  const { item, claims, claimedQty } = row;
  const price = formatPriceRange(item.priceMinIdr, item.priceMaxIdr);
  const fulfilled = claimedQty >= item.desiredQty;
  const photoSrc = (i: number) => `/registry/${item.id}/photo?i=${i}`;

  return (
    <li className="bg-card space-y-3 rounded-2xl border p-3 shadow-sm">
      {/*
        Foto dan judul jadi satu tautan ke detail; tombol Ubah/Hapus ada di luar
        supaya tidak ada tombol di dalam tautan.
      */}
      <Link href={`/registry/${item.id}`} className="block space-y-3 rounded-xl">
        <ItemPhoto
          count={item.photoKeys.length}
          src={photoSrc}
          name={item.name}
          priority={item.priority}
          category={item.category}
          isPublic={item.isPublic}
          fulfilled={fulfilled}
        />

        <div className="space-y-1.5 px-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-headline-sm min-w-0">{item.name}</h3>
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

      <div className="space-y-3 px-1">
        {item.note && (
          <p className="bg-muted text-body-sm rounded-xl p-3 italic">&ldquo;{item.note}&rdquo;</p>
        )}

        <StoreLinks shopee={item.urlShopee} tokopedia={item.urlTokopedia} tiktok={item.urlTiktok} />

        {item.desiredQty > 1 && claimedQty > 0 && (
          <ClaimProgress claimed={claimedQty} desired={item.desiredQty} />
        )}

        {claims.length > 0 && (
          <ul className="space-y-1.5">
            {claims.map((c) => (
              <li
                key={c.id}
                className={cn(
                  "text-body-sm flex items-start gap-2 rounded-xl p-2.5",
                  fulfilled ? "bg-accent text-primary" : "bg-muted",
                )}
              >
                <Icon name="check_circle" filled className="mt-0.5 text-[16px]" />
                <span className="min-w-0">
                  <strong>{c.claimerName}</strong>
                  {c.qty > 1 && ` (${c.qty} unit)`}
                  {" — "}
                  {c.trackingNumber ? `resi ${c.trackingNumber}` : "menunggu dikirim"}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/registry/${item.id}`}>
              <Icon name="visibility" className="text-[16px]" />
              Detail
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/registry/${item.id}/edit`}>
              <Icon name="edit" className="text-[16px]" />
              Ubah
            </Link>
          </Button>
          <DeleteItemButton itemId={item.id} name={item.name} hasClaims={claims.length > 0} />
        </div>
      </div>
    </li>
  );
}

export function DeleteItemButton({
  itemId,
  name,
  hasClaims,
  redirectTo,
}: {
  itemId: string;
  name: string;
  hasClaims: boolean;
  /**
   * Halaman detail harus berpindah setelah hapus — barangnya sudah tidak ada,
   * jadi `router.refresh()` di tempat hanya menghasilkan 404. Daftar cukup segar.
   * String, bukan callback: pemanggilnya server component.
   */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Hapus ${name}`}>
          <Icon name="delete" className="text-[16px]" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Barang ini akan hilang dari wishlist dan tautan publik Anda.
            {hasClaims && " Klaim yang sudah masuk untuk barang ini juga akan terhapus."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const res = await deleteRegistryItemAction(itemId);
                if (res.success) {
                  toast.success("Barang dihapus.");
                  setOpen(false);
                  if (redirectTo) router.push(redirectTo);
                  else router.refresh();
                } else {
                  toast.error(res.error.message);
                }
              });
            }}
          >
            {pending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "text-label-sm flex h-9 shrink-0 items-center rounded-full px-3 font-bold whitespace-nowrap transition-colors active:scale-[0.97]",
        active ? "bg-primary text-primary-foreground" : "bg-card border",
      )}
    >
      {label}
    </button>
  );
}

/**
 * Pengurut. `<select>` bawaan, bukan komponen Select ber-popover: di HP ini
 * membuka picker asli sistem, yang lebih enak dan tanpa JS tambahan.
 */
export function SortSelect({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  return (
    <label className="bg-card text-label-sm flex h-9 shrink-0 items-center gap-1 rounded-full border px-3 font-bold">
      <span className="sr-only">Urutkan</span>
      <Icon name="swap_horiz" className="text-muted-foreground text-[16px]" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="bg-transparent pr-1 outline-none"
      >
        {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
          <option key={k} value={k}>
            {SORT_LABEL[k]}
          </option>
        ))}
      </select>
    </label>
  );
}
