"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteClaimAction, deleteRegistryItemAction } from "@/lib/actions/registry";
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
import { Icon, type IconName } from "@/components/ui/icon";
import { ChildFilter, type FilterChild } from "./child-rail";
import { CATEGORY_LABEL, RegistryGridCard } from "./registry-shared";
import { SORT_LABEL, sortRows, type SortKey } from "./sort";
import type { RegistryCategory, RegistryClaim, RegistryItem } from "@/db/schema";

/** Maks. kartu per halaman — sepuluh terasa seperti satu layar penuh, bukan gulir tanpa akhir. */
const PAGE_SIZE = 10;

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

/** Nilai `<select>` untuk "Semua Kategori" — `category` aslinya `null`, tapi `<option>` butuh string. */
const ALL_CATEGORIES = "ALL" as const;

export function RegistryList({ rows, childList }: { rows: ListRow[]; childList: FilterChild[] }) {
  const [status, setStatus] = useState<Status>("all");
  const [category, setCategory] = useState<RegistryCategory | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("priority");
  const [page, setPage] = useState(0);

  const done = (r: ListRow) => r.claimedQty >= r.item.desiredQty;
  // Barang tanpa anak ikut di tiap pilihan anak — kado untuk semua anak.
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

  // Kategori yang tidak dipakai tidak perlu chip-nya.
  const usedCategories = REGISTRY_CATEGORIES.filter((c) =>
    byChild.some((r) => r.item.category === c),
  );

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = visible.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-3">
      {/* <ChildFilter
        childList={childList}
        value={childId}
        onChange={(id) => {
          setChildId(id);
          setPage(0);
        }}
        total={rows.length}
        gifted={rows.filter(done).length}
      /> */}

      {/*
        Tiga dropdown sebaris, bentuk yang sama dengan `SortSelect`: pil bulat
        + ikon + `<select>` bawaan. Sebelumnya status dan kategori berupa deret
        pil yang digeser mendatar — rapi untuk sedikit pilihan, tapi dua baris
        pil di satu halaman terasa ramai dibanding satu dropdown "Prioritas"
        di sebelahnya. `<select>` bawaan juga berarti di HP yang terbuka picker
        asli sistem, bukan popover custom.
      */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          icon="list_alt"
          srLabel="Saring menurut status"
          value={status}
          onChange={(s) => {
            setStatus(s);
            setPage(0);
          }}
          options={(Object.keys(STATUS_LABEL) as Status[]).map((s) => ({
            value: s,
            label: `${STATUS_LABEL[s]} (${
              s === "all"
                ? byChild.length
                : byChild.filter((r) => (s === "done" ? done(r) : !done(r))).length
            })`,
          }))}
        />

        {usedCategories.length > 1 && (
          <FilterSelect
            icon="apps"
            srLabel="Saring menurut kategori"
            value={category ?? ALL_CATEGORIES}
            onChange={(c) => {
              setCategory(c === ALL_CATEGORIES ? null : c);
              setPage(0);
            }}
            options={[
              { value: ALL_CATEGORIES, label: "Semua Kategori" },
              ...usedCategories.map((c) => ({ value: c, label: CATEGORY_LABEL[c] })),
            ]}
          />
        )}

        <SortSelect
          value={sort}
          onChange={(v) => {
            setSort(v);
            setPage(0);
          }}
        />
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground text-body-sm py-2">
          Tidak ada barang pada kelompok ini.
        </p>
      ) : (
        <>
          {/* Grid 2/3/5 — sama dengan `/shop` dan strip beranda, jadi kartunya
              selebar di mana-mana. Maks 10 per halaman lewat `pageRows`, bukan
              gulir tanpa akhir. */}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {pageRows.map((row) => (
              <li key={row.item.id}>
                <RegistryGridCard
                  item={row.item}
                  claimCount={row.claims.length}
                  claimedQty={row.claimedQty}
                  actions={
                    <div className="flex items-center gap-1">
                      <Button
                        asChild
                        variant="outline"
                        size="icon-sm"
                        className="rounded-full"
                        aria-label={`Ubah ${row.item.name}`}
                      >
                        <Link href={`/registry/${row.item.id}/edit`}>
                          <Icon name="edit" className="text-[14px]" />
                        </Link>
                      </Button>
                      <DeleteItemButton
                        itemId={row.item.id}
                        name={row.item.name}
                        hasClaims={row.claims.length > 0}
                      />
                    </div>
                  }
                />
              </li>
            ))}
          </ul>

          {pageCount > 1 && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={safePage === 0}
                onClick={() => setPage(safePage - 1)}
              >
                <Icon name="arrow_back_ios_new" className="text-[14px]" />
                Sebelumnya
              </Button>
              <span className="text-muted-foreground text-label-sm">
                Halaman {safePage + 1} dari {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage(safePage + 1)}
              >
                Selanjutnya
                <Icon name="arrow_forward" className="text-[14px]" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
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
        {/* size-9: sejajar dengan tombol `sm` di sebelahnya; `size="icon"` 44px tidak. */}
        <Button
          variant="outline"
          size="icon"
          className="text-destructive hover:bg-destructive/10 size-9 shrink-0 rounded-full"
          aria-label={`Hapus ${name}`}
        >
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

/**
 * Batalkan klaim: yang iseng, atau yang berubah pikiran. Tidak ada kolom status di
 * `registry_claims`, jadi menghapus barisnya benar-benar membebaskan kuotanya dan
 * barangnya bisa diklaim lagi — itulah yang dijanjikan teks konfirmasinya.
 *
 * Kepemilikan diuji di dalam query `deleteRegistryClaim`, bukan di sini.
 */
export function DeleteClaimButton({
  claimId,
  claimerName,
}: {
  claimId: string;
  claimerName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground -mt-1 -mr-1 size-8 shrink-0"
          aria-label={`Hapus klaim ${claimerName}`}
        >
          <Icon name="close" className="text-[16px]" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus klaim {claimerName}?</AlertDialogTitle>
          <AlertDialogDescription>
            Barang ini akan terbuka lagi untuk diklaim orang lain. Pesan dan foto bukti pengiriman
            dari {claimerName} ikut terhapus dan tidak bisa dikembalikan. Tautan klaim yang sudah
            dikirim ke {claimerName} juga tidak berlaku lagi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const res = await deleteClaimAction(claimId);
                if (res.success) {
                  toast.success("Klaim dihapus — barangnya bisa diklaim lagi.");
                  setOpen(false);
                  router.refresh();
                } else {
                  toast.error(res.error.message);
                }
              });
            }}
          >
            {pending ? "Menghapus..." : "Hapus Klaim"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Dipakai juga oleh `public-registry-list.tsx` (halaman publik) — bentuk filter pil asli. */
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
 * Dropdown penyaring/pengurut: pil bulat + ikon + `<select>` bawaan. Dipakai untuk
 * status, kategori, DAN pengurut — ketiganya pola yang sama, jadi satu komponen
 * generik dengan tipe nilai berbeda-beda, bukan tiga salinan nyaris identik.
 *
 * `<select>` bawaan, bukan komponen Select ber-popover: di HP ini membuka picker
 * asli sistem, yang lebih enak dan tanpa JS tambahan.
 */
function FilterSelect<T extends string>({
  icon,
  srLabel,
  value,
  onChange,
  options,
}: {
  icon: IconName;
  srLabel: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="bg-card text-label-sm flex h-9 shrink-0 items-center gap-1 rounded-full border px-3 font-bold">
      <span className="sr-only">{srLabel}</span>
      <Icon name={icon} className="text-muted-foreground text-[16px]" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="bg-transparent pr-1 outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SortSelect({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  return (
    <FilterSelect
      icon="swap_horiz"
      srLabel="Urutkan"
      value={value}
      onChange={onChange}
      options={(Object.keys(SORT_LABEL) as SortKey[]).map((k) => ({ value: k, label: SORT_LABEL[k] }))}
    />
  );
}
