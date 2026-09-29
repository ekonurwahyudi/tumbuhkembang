import { CATEGORY_LABEL, PRIORITY_LABEL } from "@/schemas/registry";
import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Icon, type IconName } from "@/components/ui/icon";
import type {
  RegistryCategory,
  RegistryClaim,
  RegistryItem,
  RegistryPriority,
} from "@/db/schema";

/**
 * Tampilan yang dipakai daftar privat dan halaman publik. Tabel-lookup paralel
 * mengikuti konvensi immunization-list.tsx: warna tidak pernah jadi satu-satunya
 * penanda, selalu ada teks labelnya.
 */

export const PRIORITY_TONE: Record<RegistryPriority, string> = {
  HIGH: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  NORMAL: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  EXTRA: "bg-muted text-muted-foreground",
};

export const PRIORITY_ICON: Record<RegistryPriority, IconName> = {
  HIGH: "favorite",
  NORMAL: "card_giftcard",
  EXTRA: "add",
};

export { CATEGORY_LABEL, PRIORITY_LABEL };

/**
 * Bentuk baris untuk sisi publik: pesan pribadi pengklaim dan nomor resinya tidak
 * ikut. `shipped` menggantikan resi — statusnya berguna, nomornya bukan urusan
 * publik. Nama pengklaim tetap ikut supaya tidak ada dua orang membeli hal sama.
 *
 * Tipe dan pemetanya tinggal di berkas server-safe ini, bukan di
 * `public-registry-list.tsx`: yang memanggil `toPublicRow` adalah server
 * component, dan fungsi di berkas `"use client"` tidak bisa dipanggil dari server.
 */
export type PublicRow = {
  item: RegistryItem;
  claims: (Pick<RegistryClaim, "id" | "claimerName" | "qty"> & { shipped: boolean })[];
  claimedQty: number;
};

export function toPublicRow(row: {
  item: RegistryItem;
  claims: RegistryClaim[];
  claimedQty: number;
}): PublicRow {
  return {
    item: row.item,
    claimedQty: row.claimedQty,
    claims: row.claims.map((c) => ({
      id: c.id,
      claimerName: c.claimerName,
      qty: c.qty,
      shipped: c.trackingNumber !== null,
    })),
  };
}

const idr = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** "Rp 750.000 - 850.000", atau satu sisi saja bila hanya satu yang diisi. */
export function formatPriceRange(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  if (min !== null && max !== null && min !== max)
    return `Rp ${idr.format(min)} - ${idr.format(max)}`;
  return `Rp ${idr.format((min ?? max) as number)}`;
}

export function PriorityBadge({ priority }: { priority: RegistryPriority }) {
  return (
    <span
      className={cn(
        "text-label-sm inline-flex items-center gap-1 rounded-full px-2 py-1 font-bold",
        PRIORITY_TONE[priority],
      )}
    >
      <Icon name={PRIORITY_ICON[priority]} filled className="text-[14px]" />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

// Kategori tanpa ikon: font ikonnya adalah subset dan glyph bed/toys/stroller
// tidak ada di dalamnya. Teks labelnya sudah cukup jelas.
export function CategoryBadge({ category }: { category: RegistryCategory }) {
  return (
    <span className="bg-muted text-muted-foreground text-label-sm inline-flex items-center rounded-full px-2 py-1 font-bold">
      {CATEGORY_LABEL[category]}
    </span>
  );
}

/**
 * Foto barang penuh lebar dengan badge melayang di atasnya.
 * `src` berupa fungsi indeks supaya route privat dan publik bisa berbeda.
 *
 * Badge tetap membawa teksnya dan diberi `/90 + backdrop-blur` supaya kontrasnya
 * tidak bergantung pada foto di belakangnya.
 */
export function ItemPhoto({
  count,
  src,
  name,
  priority,
  category,
  isPublic = true,
  fulfilled = false,
}: {
  count: number;
  src: (index: number) => string;
  name: string;
  priority: RegistryPriority;
  category: RegistryCategory;
  /** false menambahkan penanda Privat — hanya dipakai sisi pemilik. */
  isPublic?: boolean;
  fulfilled?: boolean;
}) {
  return (
    <div className="bg-accent text-primary relative aspect-[4/3] w-full overflow-hidden rounded-xl">
      {count > 0 ? (
        // eslint-disable-next-line @next/next/no-img-element -- route foto berotorisasi, bukan aset statis untuk next/image
        <img src={src(0)} alt={`Foto ${name}`} className="size-full object-cover" />
      ) : (
        <span className="grid size-full place-items-center">
          <Icon name="card_giftcard" filled className="text-[40px]" />
        </span>
      )}

      <div className="pointer-events-none absolute inset-x-2 top-2 flex flex-wrap items-start gap-1.5">
        <span
          className={cn(
            "text-label-sm inline-flex items-center gap-1 rounded-full px-2 py-1 font-bold backdrop-blur-sm",
            PRIORITY_TONE[priority],
          )}
        >
          <Icon name={PRIORITY_ICON[priority]} filled className="text-[14px]" />
          {PRIORITY_LABEL[priority]}
        </span>
        <span className="bg-background/90 text-foreground text-label-sm inline-flex items-center rounded-full px-2 py-1 font-bold backdrop-blur-sm">
          {CATEGORY_LABEL[category]}
        </span>
        {!isPublic && (
          <span className="bg-background/90 text-muted-foreground text-label-sm inline-flex items-center gap-1 rounded-full px-2 py-1 font-bold backdrop-blur-sm">
            <Icon name="visibility_off" className="text-[14px]" />
            Privat
          </span>
        )}
      </div>

      {count > 1 && (
        <span className="bg-background/90 text-foreground text-label-sm pointer-events-none absolute right-2 bottom-2 rounded-full px-2 py-1 font-bold backdrop-blur-sm">
          +{count - 1} foto
        </span>
      )}

      {fulfilled && (
        <span className="bg-primary/85 text-primary-foreground text-body-sm pointer-events-none absolute inset-0 grid place-items-center font-bold backdrop-blur-[2px]">
          <span className="flex items-center gap-1.5">
            <Icon name="check_circle" filled className="text-[20px]" />
            Sudah Dihadiahi
          </span>
        </span>
      )}
    </div>
  );
}

/**
 * Galeri halaman detail: semua foto penuh lebar, digeser mendatar.
 *
 * Tanpa state dan tanpa tombol panah — `snap-x` + geseran sentuh sudah bawaan
 * platform, jadi komponennya tetap server-safe. Satu foto → satu foto saja.
 */
export function ItemGallery({
  count,
  src,
  name,
}: {
  count: number;
  src: (index: number) => string;
  name: string;
}) {
  if (count === 0)
    return (
      <div className="bg-accent text-primary grid aspect-[4/3] w-full place-items-center rounded-2xl">
        <Icon name="card_giftcard" filled className="text-[48px]" />
      </div>
    );

  if (count === 1)
    return (
      <div className="bg-accent aspect-[4/3] w-full overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- route foto berotorisasi, bukan aset statis untuk next/image */}
        <img src={src(0)} alt={`Foto ${name}`} className="size-full object-cover" />
      </div>
    );

  return (
    <div className="space-y-1.5">
      <ul
        className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto"
        aria-label={`Foto ${name} (${count})`}
      >
        {Array.from({ length: count }, (_, i) => i).map((i) => (
          <li
            key={i}
            className="bg-accent aspect-[4/3] w-full shrink-0 snap-start overflow-hidden rounded-2xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- route foto berotorisasi, bukan aset statis untuk next/image */}
            <img
              src={src(i)}
              alt={`Foto ${name} ${i + 1}`}
              className="size-full object-cover"
            />
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground text-label-sm text-center">
        Geser untuk melihat {count} foto
      </p>
    </div>
  );
}

/**
 * Anak sebagai tujuan kado. `photoSrc` disuntik pemanggil, bukan dibentuk di sini:
 * route foto sisi pemilik bersesi sementara sisi publik berotorisasi token.
 */
export type RegistryChild = {
  id: string;
  name: string;
  photoSrc: string | null;
  age: string;
};

const initial = (name: string) => name.trim().charAt(0).toUpperCase() || "?";

/** Satu avatar anak. Tanpa foto → inisial, bukan gambar rusak. */
export function ChildFace({
  child,
  size = "sm",
  className,
}: {
  child: Pick<RegistryChild, "name" | "photoSrc">;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  return (
    <Avatar size={size} className={className}>
      {child.photoSrc && <AvatarImage src={child.photoSrc} alt="" />}
      <AvatarFallback className="bg-accent text-primary font-bold">
        {initial(child.name)}
      </AvatarFallback>
    </Avatar>
  );
}

/** Chip "Untuk Aisyah" di kartu barang. */
export function ChildTag({ child }: { child: Pick<RegistryChild, "name" | "photoSrc"> }) {
  return (
    <span className="bg-muted text-label-sm inline-flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1 font-bold">
      <ChildFace child={child} size="sm" />
      Untuk {child.name}
    </span>
  );
}

/**
 * Foto anak bertumpuk untuk mode "Semua Anak" — inilah yang membuat tujuan kado
 * terbaca sekali lihat: dua wajah berarti dua anak.
 */
export function ChildStack({
  childList,
  max = 3,
  size = "sm",
}: {
  childList: Pick<RegistryChild, "id" | "name" | "photoSrc">[];
  max?: number;
  size?: "default" | "sm" | "lg";
}) {
  if (childList.length === 0) return null;
  const shown = childList.slice(0, max);
  const rest = childList.length - shown.length;

  return (
    <AvatarGroup>
      {shown.map((c) => (
        <ChildFace key={c.id} child={c} size={size} />
      ))}
      {rest > 0 && (
        <AvatarGroupCount
          className={cn(
            "text-label-sm font-bold",
            size === "sm" && "size-6",
            size === "lg" && "size-10",
          )}
        >
          +{rest}
        </AvatarGroupCount>
      )}
    </AvatarGroup>
  );
}

/** Progress patungan. Angka selalu ditulis; bar hanya penguat. */
export function ClaimProgress({ claimed, desired }: { claimed: number; desired: number }) {
  const percent = Math.min(100, Math.round((claimed / desired) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-label-sm font-bold">
          {claimed} dari {desired} terpenuhi
        </span>
        <span className="text-muted-foreground text-label-sm tabular-nums">{percent}%</span>
      </div>
      <div
        className="bg-border h-2 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={claimed}
        aria-valuemin={0}
        aria-valuemax={desired}
        aria-label="Kemajuan patungan kado"
      >
        <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

/** Tautan toko sebagai chip. Target blank + noopener karena keluar dari aplikasi. */
export function StoreLinks({
  shopee,
  tokopedia,
  tiktok,
}: {
  shopee: string | null;
  tokopedia: string | null;
  tiktok: string | null;
}) {
  const links = [
    ["Shopee", shopee],
    ["Tokopedia", tokopedia],
    ["TikTok", tiktok],
  ].filter(([, url]) => url) as [string, string][];
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {links.map(([label, url]) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-accent text-primary text-label-sm inline-flex h-8 items-center gap-1 rounded-full px-3 font-bold"
        >
          <Icon name="link" className="text-[14px]" />
          {label}
        </a>
      ))}
    </div>
  );
}
