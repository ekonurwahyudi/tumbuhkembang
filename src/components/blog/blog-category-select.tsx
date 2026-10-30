"use client";

import { BLOG_CATEGORIES, BLOG_CATEGORY_LABEL, type BlogCategoryValue } from "@/schemas/blog";
import { Icon } from "@/components/ui/icon";

/**
 * Filter kategori sebagai satu ikon: `<select>` bawaan dibuat transparan dan
 * dibentangkan menutupi ikonnya, jadi ketukan di ikon membuka picker asli sistem.
 * Di HP itu lembar pilihan bawaan OS — tanpa popover, tanpa portal, tanpa jebakan
 * fokus yang harus ditulis sendiri.
 *
 * Bentuk dan alasannya sama persis dengan `CategorySelect` di /shop; yang berbeda
 * hanya daftar kategorinya. Tidak digabung jadi satu komponen karena keduanya
 * membaca enum yang berbeda dan nama parameter URL-nya kebetulan saja sama.
 *
 * Satu-satunya alasan berkas ini `"use client"`: tanpa tombol "Cari" di sebelahnya,
 * memilih kategori harus langsung menyaring, dan form GET tidak submit sendiri saat
 * `<select>` berubah. `requestSubmit()` dipakai, bukan `submit()`, supaya validasi
 * bawaan form tetap jalan.
 *
 * Ikonnya menyala saat ada kategori terpilih. Itu wajib, bukan hiasan: labelnya
 * tidak tertulis di layar, jadi tanpa penanda ini satu-satunya petunjuk bahwa
 * daftarnya sedang disaring hilang sama sekali.
 */
export function BlogCategorySelect({
  value,
  counts,
}: {
  value: BlogCategoryValue | null;
  /** Kategori tanpa artikel tidak perlu jadi pilihan. */
  counts: Map<string, number>;
}) {
  const active = value !== null;

  return (
    <span
      className={
        "bg-card focus-within:ring-ring relative grid size-11 shrink-0 place-items-center rounded-2xl shadow-sm focus-within:ring-2 " +
        (active ? "text-primary" : "text-muted-foreground")
      }
    >
      <Icon name="apps" filled={active} className="text-[18px]" />

      {/* Titik penanda: ikon yang menyala saja terlalu halus di layar kecil. */}
      {active && (
        <span className="bg-primary absolute top-1.5 right-1.5 size-1.5 rounded-full" aria-hidden />
      )}

      <select
        name="kategori"
        defaultValue={value ?? ""}
        aria-label="Saring menurut kategori"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        /* `text-body-sm`: select ber-`opacity-0` tidak mewarisi ukuran font induknya,
           jadi tanpa ini daftar opsinya terbuka pada 16px bawaan peramban. */
        className="text-body-sm absolute inset-0 size-full cursor-pointer opacity-0 outline-none"
      >
        <option value="">Semua Kategori</option>
        {BLOG_CATEGORIES.filter((c) => (counts.get(c) ?? 0) > 0).map((c) => (
          <option key={c} value={c}>
            {BLOG_CATEGORY_LABEL[c]} ({counts.get(c)})
          </option>
        ))}
      </select>
    </span>
  );
}
