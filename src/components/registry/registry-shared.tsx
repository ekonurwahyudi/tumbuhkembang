import { BANKS, CATEGORY_LABEL, PRIORITY_LABEL, type BankCode } from "@/schemas/registry";
import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Icon, type IconName } from "@/components/ui/icon";
import type { RegistryCategory, RegistryClaim, RegistryItem, RegistryPriority } from "@/db/schema";

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
 * Bentuk baris untuk sisi publik: pesan pribadi pengklaim, nomor resinya, dan foto
 * buktinya tidak ikut. `shipped` menggantikan ketiganya — statusnya berguna,
 * rinciannya bukan urusan publik. Nama pengklaim tetap ikut supaya tidak ada dua
 * orang membeli hal yang sama.
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
      // Resi ATAU foto barang — dua bentuk bukti yang sama sahnya.
      shipped: c.trackingNumber !== null || c.photoKey !== null,
    })),
  };
}

/**
 * "KABUPATEN DEMAK" → "Kabupaten Demak". `lokasi.json` seluruhnya huruf besar dan
 * itu berteriak di tengah halaman.
 *
 * Tinggal di berkas server-safe ini, bukan di `lokasi-picker.tsx` yang
 * `"use client"`: panel alamat di halaman publik adalah server component.
 */
export function titled(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[\s(/-])([a-z])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}

/**
 * Chip bank: logo resminya dari `public/banks/` + labelnya. Logo dilatari putih
 * (`bg-white`) apa pun mode temanya — logo bank dirancang untuk kertas putih dan
 * banyak yang teksnya berwarna gelap, jadi di mode gelap tanpa latar itu hilang.
 *
 * Tanpa logo → monogram berwarna merek. Labelnya selalu tertulis, jadi bank tidak
 * pernah dikenali dari gambar atau warna saja.
 */
export function BankChip({ code, className }: { code: string; className?: string }) {
  const bank = BANKS[code as BankCode] ?? BANKS.OTHER;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {bank.logo ? (
        <span className="grid h-9 w-16 shrink-0 place-items-center rounded-lg border bg-white px-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- aset statis berukuran tetap; next/image tidak memberi apa pun di sini */}
          <img
            src={bank.logo}
            alt=""
            className="max-h-6 max-w-full object-contain"
            loading="lazy"
            decoding="async"
          />
        </span>
      ) : (
        <span
          className={cn(
            "grid h-9 w-16 shrink-0 place-items-center rounded-lg text-[11px] font-black tracking-tight",
            bank.tone,
          )}
        >
          {bank.mark}
        </span>
      )}
      <span className="text-body-sm min-w-0 truncate font-bold">{bank.label}</span>
    </span>
  );
}

const idr = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** "Rp 750.000 - 850.000", atau satu sisi saja bila hanya satu yang diisi. */
export function formatPriceRange(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  if (min !== null && max !== null && min !== max)
    return `Rp ${idr.format(min)} - ${idr.format(max)}`;
  return `Rp ${idr.format((min ?? max) as number)}`;
}

/*
  Badge kecil: 10px, bukan 11px, dan padding yang lebih rapat.

  "Sangat Dibutuhkan" dan "Mainan Sensorik & Edukasi" adalah label panjang, dan pada
  ukuran sebelumnya keduanya memakan setengah lebar foto di layar HP — jadi terbaca
  sebagai judul, padahal ia hanya penanda. Tingginya dipatok `h-6` supaya sederet
  badge tetap sejajar meski salah satunya membungkus.
*/
const BADGE =
  "text-[10px] leading-none inline-flex h-6 items-center gap-1 rounded-full px-2 font-bold";

export function PriorityBadge({ priority }: { priority: RegistryPriority }) {
  return (
    <span className={cn(BADGE, PRIORITY_TONE[priority])}>
      <Icon name={PRIORITY_ICON[priority]} filled className="text-[12px]" />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

// Kategori tanpa ikon: font ikonnya adalah subset dan glyph bed/toys/stroller
// tidak ada di dalamnya. Teks labelnya sudah cukup jelas.
export function CategoryBadge({ category }: { category: RegistryCategory }) {
  return (
    <span className={cn(BADGE, "bg-muted text-muted-foreground")}>{CATEGORY_LABEL[category]}</span>
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

      <div className="pointer-events-none absolute inset-x-2 top-2 flex flex-wrap items-start gap-1">
        <span className={cn(BADGE, PRIORITY_TONE[priority], "backdrop-blur-sm")}>
          <Icon name={PRIORITY_ICON[priority]} filled className="text-[12px]" />
          {PRIORITY_LABEL[priority]}
        </span>
        <span className={cn(BADGE, "bg-background/90 text-foreground backdrop-blur-sm")}>
          {CATEGORY_LABEL[category]}
        </span>
        {!isPublic && (
          <span className={cn(BADGE, "bg-background/90 text-muted-foreground backdrop-blur-sm")}>
            <Icon name="visibility_off" className="text-[12px]" />
            Privat
          </span>
        )}
      </div>

      {count > 1 && (
        <span
          className={cn(
            BADGE,
            "bg-background/90 text-foreground pointer-events-none absolute right-2 bottom-2 backdrop-blur-sm",
          )}
        >
          +{count - 1} foto
        </span>
      )}

      {/*
        Kaca netral, bukan biru: sebelumnya `bg-primary/85` menyiram seluruh foto
        dengan warna merek sampai barangnya tidak kelihatan lagi. Yang ingin
        disampaikan hanya "ini sudah ada" — fotonya tetap perlu terbaca, jadi
        latarnya diambil dari surface (`bg-background/45`) dan kontras teksnya
        dijamin oleh pil padatnya sendiri, bukan oleh blur di belakangnya.
      */}
      {fulfilled && (
        <span className="bg-background/45 pointer-events-none absolute inset-0 grid place-items-center backdrop-blur-[3px] backdrop-saturate-50">
          <span className="bg-card text-foreground text-label-sm flex items-center gap-1.5 rounded-full px-3 py-1.5 font-bold shadow-md">
            <Icon name="check_circle" filled className="text-primary text-[16px]" />
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
            <img src={src(i)} alt={`Foto ${name} ${i + 1}`} className="size-full object-cover" />
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

/**
 * "Aisyah & Rafa", atau "Aisyah, Rafa & 1 lainnya" bila lebih dari tiga.
 *
 * Tinggal di berkas server-safe ini, bukan di `child-rail.tsx` yang `"use client"`:
 * halaman detail publik adalah server component dan memanggilnya langsung.
 */
export function joinNames(childList: { name: string }[]): string {
  const names = childList.map((c) => c.name);
  if (names.length <= 3) {
    const last = names.pop() as string;
    return names.length === 0 ? last : `${names.join(", ")} & ${last}`;
  }
  return `${names.slice(0, 2).join(", ")} & ${names.length - 2} lainnya`;
}

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

/**
 * Marketplace dengan warna mereknya sendiri. Lambangnya SVG inline: font ikon
 * aplikasi ini adalah subset dan tidak memuat glyph merek apa pun.
 *
 * Nama tokonya selalu tertulis di samping lambang, jadi identitas toko tidak
 * pernah bergantung pada warna saja — aturan yang sama dengan badge prioritas.
 *
 * `bg` dan `hover` dipisah supaya lambangnya bisa dipakai di tempat yang bukan
 * tautan — label form tidak punya keadaan hover.
 */
export const STORE_BRAND = {
  shopee: {
    label: "Shopee",
    bg: "bg-[#EE4D2D] text-white",
    hover: "hover:bg-[#d8431f]",
    // Tas jinjing, bentuk dasar lambang Shopee.
    path: "M12 2a4 4 0 0 0-4 4H5.4a1 1 0 0 0-1 .95l-.6 11.9A2 2 0 0 0 5.8 21h12.4a2 2 0 0 0 2-2.15l-.6-11.9a1 1 0 0 0-1-.95H16a4 4 0 0 0-4-4Zm0 2a2 2 0 0 1 2 2h-4a2 2 0 0 1 2-2Zm0 6c2 0 3.2.9 3.2 2.1 0 .6-.4 1-1 1-.5 0-.8-.3-1-.7-.2-.4-.6-.6-1.2-.6-.7 0-1.2.3-1.2.8 0 .5.4.7 1.6 1.1 1.6.5 2.6 1.1 2.6 2.4 0 1.5-1.3 2.4-3.1 2.4-2 0-3.3-1-3.3-2.2 0-.6.4-1 1-1 .5 0 .8.2 1 .7.2.5.7.7 1.4.7.8 0 1.3-.3 1.3-.8 0-.5-.5-.8-1.7-1.2-1.5-.5-2.5-1-2.5-2.3 0-1.4 1.3-2.4 2.9-2.4Z",
  },
  tokopedia: {
    label: "Tokopedia",
    bg: "bg-[#03AC0E] text-white",
    hover: "hover:bg-[#02900c]",
    // Kanopi toko — silhuetnya sengaja beda tajam dari tas Shopee.
    path: "M3 9l1.9-4.3A2 2 0 0 1 6.7 3.5h10.6a2 2 0 0 1 1.8 1.2L21 9v1.4a2.6 2.6 0 0 1-4.5 1.6 2.6 2.6 0 0 1-4.5 0 2.6 2.6 0 0 1-4.5 0A2.6 2.6 0 0 1 3 10.4V9Zm1.7 4.8V19a2 2 0 0 0 2 2H10v-5h4v5h3.3a2 2 0 0 0 2-2v-5.2a4.2 4.2 0 0 1-4.6-.6 4.2 4.2 0 0 1-4.5 0 4.2 4.2 0 0 1-4.5.6Z",
  },
  tiktok: {
    label: "TikTok",
    // Hitam adalah warna mereknya; di mode gelap dibalik supaya tetap terbaca.
    bg: "bg-black text-white dark:bg-white dark:text-black",
    hover: "hover:bg-neutral-800 dark:hover:bg-neutral-200",
    path: "M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 0 1-2.6 2.5 2.6 2.6 0 0 1-2.6-2.6c0-1.7 1.7-3 3.4-2.5V9.7c-3.5-.5-6.5 2.2-6.5 5.6 0 3.3 2.8 5.7 5.7 5.7 3.1 0 5.7-2.6 5.7-5.7V9a7.4 7.4 0 0 0 4.3 1.4V7.3s-1.9.1-3.2-1.5Z",
  },
} as const;

export type StoreBrand = keyof typeof STORE_BRAND;

/** Lambang merek saja — dekoratif, label tokonya selalu tertulis di sebelahnya. */
export function StoreMark({ brand, className }: { brand: StoreBrand; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-4 shrink-0 fill-current", className)}
    >
      <path d={STORE_BRAND[brand].path} />
    </svg>
  );
}

/** Tautan toko sebagai chip berwarna merek. Target blank + noopener karena keluar dari aplikasi. */
export function StoreLinks({
  shopee,
  tokopedia,
  tiktok,
}: {
  shopee: string | null;
  tokopedia: string | null;
  tiktok: string | null;
}) {
  const links = (
    [
      ["shopee", shopee],
      ["tokopedia", tokopedia],
      ["tiktok", tiktok],
    ] as const
  ).filter(([, url]) => url) as [StoreBrand, string][];
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {links.map(([key, url]) => {
        const store = STORE_BRAND[key];
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "text-label-sm inline-flex h-8 items-center gap-1.5 rounded-full px-3 font-bold shadow-sm transition-colors active:scale-95",
              store.bg,
              store.hover,
            )}
          >
            <StoreMark brand={key} />
            {store.label}
          </a>
        );
      })}
    </div>
  );
}
