"use client";

import {
  SHOP_CATEGORY_LABEL,
  SHOP_GROUPS,
  categoriesOfGroup,
  type ShopCategoryValue,
} from "@/schemas/shop";
import { Icon } from "@/components/ui/icon";

/**
 * Filter kategori sebagai satu ikon: `<select>` bawaan dibuat transparan dan
 * dibentangkan menutupi ikonnya, jadi ketukan di ikon membuka picker asli sistem.
 * Di HP itu lembar pilihan bawaan OS — tanpa popover, tanpa portal, tanpa jebakan
 * fokus yang harus ditulis sendiri.
 *
 * Satu-satunya alasan berkas ini `"use client"`: tanpa tombol "Cari" di sebelahnya,
 * memilih kategori harus langsung menyaring, dan form GET tidak submit sendiri saat
 * `<select>` berubah. `requestSubmit()` dipakai, bukan `submit()`, supaya validasi
 * bawaan form tetap jalan.
 *
 * Ikonnya menyala saat ada kategori terpilih. Itu wajib, bukan hiasan: labelnya
 * dihapus, jadi tanpa penanda ini satu-satunya petunjuk bahwa daftar sedang disaring
 * hilang dari layar.
 */
export function CategorySelect({ value }: { value: ShopCategoryValue | null }) {
  const active = value !== null;

  return (
    <span
      className={
        "border-border bg-card focus-within:ring-ring relative grid size-10 shrink-0 place-items-center rounded-xl border shadow-sm focus-within:ring-2 " +
        (active ? "text-primary border-primary/40" : "text-muted-foreground")
      }
    >
      <Icon name="apps" filled={active} className="text-[18px]" />

      {/* Titik penanda: ikon yang menyala saja terlalu halus di layar kecil. */}
      {active && (
        <span className="bg-primary absolute top-1 right-1 size-1.5 rounded-full" aria-hidden />
      )}

      <select
        name="kategori"
        defaultValue={value ?? ""}
        aria-label="Saring menurut kategori"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="absolute inset-0 size-full cursor-pointer opacity-0 outline-none"
      >
        <option value="">Semua Kategori</option>
        {SHOP_GROUPS.map((g) => (
          <optgroup key={g} label={g}>
            {categoriesOfGroup(g).map((c) => (
              <option key={c} value={c}>
                {SHOP_CATEGORY_LABEL[c]}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </span>
  );
}
