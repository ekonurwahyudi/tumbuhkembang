/**
 * Kotak cari sebagai <form method="get"> biasa — server component, tanpa state client
 * dan tanpa debounce. Daftarnya dibatasi 100 baris, jadi "cari lalu Enter" sudah cukup.
 *
 * Tanpa ikon kaca pembesar: tidak ada glyph "search" di subset woff2
 * (src/components/ui/icon.tsx), dan satu ikon hiasan tidak layak regenerate font.
 */
export function AdminSearch({ q, placeholder }: { q?: string; placeholder: string }) {
  return (
    <form method="get">
      <input
        type="search"
        name="q"
        defaultValue={q ?? ""}
        placeholder={placeholder}
        aria-label={placeholder}
        className="bg-card border-border text-body-sm focus-visible:ring-ring h-10 w-full rounded-xl border px-3.5 shadow-sm outline-none focus-visible:ring-2"
      />
    </form>
  );
}
