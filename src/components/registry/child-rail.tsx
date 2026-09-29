"use client";

import { cn } from "@/lib/utils";
import { ChildFace, ChildStack, type RegistryChild } from "./registry-shared";

/**
 * Penyaring "untuk anak siapa" plus hero yang ikut berubah.
 *
 * Tujuan utamanya bukan menyaring, tapi membuat tujuan kado terbaca sekali lihat:
 * "Semua Anak" memperlihatkan wajah anak-anaknya bertumpuk, satu anak terpilih
 * memperlihatkan foto + nama + umurnya.
 *
 * ponytail: seleksinya state klien, sama seperti penyaring status dan kategori di
 * registry-list.tsx. Pindah ke `?anak=` bila tautan per-anak perlu dibagikan.
 */
export type FilterChild = RegistryChild & { count: number };

export function ChildFilter({
  childList,
  value,
  onChange,
  total,
  gifted,
}: {
  childList: FilterChild[];
  /** null = semua anak. */
  value: string | null;
  onChange: (id: string | null) => void;
  total: number;
  gifted: number;
}) {
  if (childList.length === 0) return null;

  const active = value ? (childList.find((c) => c.id === value) ?? null) : null;
  const shownTotal = active ? active.count : total;

  return (
    <section className="space-y-3" aria-label="Tujuan kado">
      <div className="bg-card relative flex items-center gap-3 overflow-hidden rounded-2xl border p-4 shadow-sm">
        <div className="bg-accent/50 pointer-events-none absolute -right-6 -bottom-6 size-24 rounded-full" />

        {active ? (
          <ChildFace child={active} size="lg" className="ring-accent size-14 ring-2" />
        ) : (
          <ChildStack childList={childList} size="lg" />
        )}

        <div className="relative min-w-0">
          <h2 className="text-headline-md truncate">
            {active ? active.name : `Wishlist ${joinNames(childList)}`}
          </h2>
          <p className="text-muted-foreground text-body-sm">
            {active ? `${active.age} · ` : ""}
            {shownTotal} barang
            {gifted > 0 && !active && ` · ${gifted} sudah dihadiahi`}
          </p>
        </div>
      </div>

      {/* Satu anak saja tidak butuh pilihan: headernya sudah menyebut anak itu. */}
      {childList.length > 1 && (
        <div
          role="tablist"
          aria-label="Saring menurut anak"
          className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4"
        >
          <ChildPill
            active={value === null}
            onClick={() => onChange(null)}
            label={`Semua Anak (${total})`}
            avatar={<ChildStack childList={childList} max={2} size="sm" />}
          />
          {childList.map((c) => (
            <ChildPill
              key={c.id}
              active={value === c.id}
              onClick={() => onChange(c.id)}
              label={`${c.name} (${c.count})`}
              avatar={<ChildFace child={c} size="sm" />}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/** "Aisyah & Rafa", atau "Aisyah, Rafa & 1 lainnya" bila lebih dari tiga. */
function joinNames(childList: { name: string }[]): string {
  const names = childList.map((c) => c.name);
  if (names.length <= 3) {
    const last = names.pop() as string;
    return names.length === 0 ? last : `${names.join(", ")} & ${last}`;
  }
  return `${names.slice(0, 2).join(", ")} & ${names.length - 2} lainnya`;
}

function ChildPill({
  active,
  onClick,
  label,
  avatar,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  avatar: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "text-label-sm flex h-10 shrink-0 items-center gap-1.5 rounded-full py-1 pr-3 pl-1 font-bold whitespace-nowrap transition-colors active:scale-[0.97]",
        active ? "bg-primary text-primary-foreground" : "bg-card border",
      )}
    >
      {avatar}
      {label}
    </button>
  );
}
