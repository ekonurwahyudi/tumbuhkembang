"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChildAvatar } from "@/components/children/child-avatar";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Deretan anak yang bisa digeser mendatar, plus tombol tambah di ujung.
 *
 * Anak aktif disimpan di query string `?anak=<id>` — bukan state client — supaya
 * seluruh isi beranda (server component) ikut berganti tanpa duplikasi data.
 */
export function ChildSwitcher({
  items,
  activeId,
}: {
  items: { id: string; name: string; photoKey: string | null; caption: string; preterm: boolean }[];
  activeId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const select = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("anak", id);
    router.replace(`${pathname}?${next}`, { scroll: false });
  };

  return (
    <div
      role="tablist"
      aria-label="Pilih anak"
      // snap-x membuat geseran berhenti rapi di tiap kartu; scrollbar disembunyikan
      // lewat utility di globals.css supaya tidak memotong kartu di desktop.
      // py-1.5 memberi ruang agar ring kartu terpilih tidak terpotong tepi scroll.
      className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 py-1.5"
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => select(item.id)}
            className={cn(
              "bg-card flex w-[182px] shrink-0 snap-start items-center gap-2.5 rounded-2xl border p-2.5 text-left shadow-sm transition-all active:scale-[0.98]",
              active ? "ring-primary/40 border-primary/30 ring-2" : "opacity-60",
            )}
          >
            <ChildAvatar
              child={item}
              className={cn("size-10 shrink-0", active && "ring-accent ring-2")}
              iconClassName="text-[20px]"
            />
            <span className="min-w-0 flex-1">
              <span className="text-body-md block truncate font-bold">{item.name}</span>
              <span className="text-muted-foreground text-label-sm block truncate">
                {item.caption}
              </span>
              {item.preterm && (
                <span className="text-label-sm mt-0.5 inline-block rounded-full bg-[var(--color-butter-pastel)] px-1.5 font-bold text-[var(--color-on-butter)]">
                  Prematur
                </span>
              )}
            </span>
          </button>
        );
      })}

      <Link
        href="/children/new"
        className="bg-card text-primary flex w-[104px] shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-2xl border border-dashed p-2.5 shadow-sm active:scale-[0.98]"
      >
        <Icon name="add_circle" className="text-[22px]" />
        <span className="text-label-sm font-bold">Tambah Anak</span>
      </Link>
    </div>
  );
}
