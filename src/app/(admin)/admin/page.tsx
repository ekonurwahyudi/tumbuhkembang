import type { Metadata } from "next";
import Link from "next/link";
import { ADMIN_SECTIONS, adminHref } from "@/lib/admin-nav";
import { adminStats } from "@/lib/data/admin";
import { Icon, type IconName } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Dashboard Superadmin" };

export default async function AdminPage() {
  const stats = await adminStats();

  return (
    <div className="flex flex-col gap-4 pt-2">
      <header className="flex items-center gap-2.5">
        <span className="bg-accent text-primary grid size-10 shrink-0 place-items-center rounded-full shadow-sm">
          <Icon name="shield" />
        </span>
        <div className="min-w-0">
          <h1 className="text-headline-lg truncate">Dashboard Superadmin</h1>
          <p className="text-muted-foreground text-body-sm mt-0.5">
            Ringkasan dan pengelolaan seluruh data aplikasi
          </p>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-2.5">
        <StatTile icon="person" label="Orang Tua Terdaftar" value={stats.parents} />
        <StatTile icon="child_care" label="Anak Terdaftar" value={stats.children} />
      </dl>

      <section className="flex flex-col gap-2">
        <span className="text-muted-foreground text-label-sm px-1 font-bold tracking-wider uppercase">
          MODUL PENGELOLAAN ({ADMIN_SECTIONS.length})
        </span>
        <div className="bg-card space-y-3.5 rounded-2xl border p-4 shadow-sm">
          {ADMIN_SECTIONS.map((s, i) => (
            <div key={s.slug} className="space-y-3.5">
              {i > 0 && <div className="bg-border h-px" />}
              <Link href={adminHref(s)} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="bg-muted text-primary grid size-9 shrink-0 place-items-center rounded-full">
                    <Icon name={s.icon} className="text-[18px]" />
                  </span>
                  <div className="min-w-0">
                    <span className="text-body-md flex items-center gap-1.5 font-bold">
                      <span className="truncate">{s.label}</span>
                      {!s.ready && (
                        <span className="bg-muted text-muted-foreground text-label-sm shrink-0 rounded px-1.5 py-0.5 font-bold">
                          SEGERA
                        </span>
                      )}
                    </span>
                    <p className="text-muted-foreground text-body-sm truncate">{s.description}</p>
                  </div>
                </div>
                <Icon name="chevron_right" className="text-muted-foreground shrink-0 text-[20px]" />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: IconName; label: string; value: number }) {
  return (
    <div className="bg-card border-border rounded-2xl border p-3.5 shadow-sm">
      <dt className="text-muted-foreground text-label-sm flex items-center gap-1.5">
        <Icon name={icon} className="text-primary text-[15px]" />
        <span className="truncate">{label}</span>
      </dt>
      <dd className="text-metric mt-1 tabular-nums">{value.toLocaleString("id-ID")}</dd>
    </div>
  );
}
