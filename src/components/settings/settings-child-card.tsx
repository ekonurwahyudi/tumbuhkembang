import Link from "next/link";
import type { Child } from "@/db/schema";
import {
  chronologicalAge,
  formatAgeDetailed,
  formatAgeDaysDetailed,
} from "@/lib/growth/age";
import { correctedAge, formatWeeksDays } from "@/lib/growth/corrected-age";
import { BIRTH_TYPE_LABEL, SEX_LABEL, splitHead, splitLength, splitWeight } from "@/lib/format";
import { ChildAvatar } from "@/components/children/child-avatar";
import { Icon } from "@/components/ui/icon";

type Latest = {
  weightKg: string | null;
  lengthHeightCm: string | null;
  headCircumferenceCm: string | null;
} | null;

function MetricChip({ label, part, unit }: { label: string; part: string; unit: string | null }) {
  return (
    <div className="bg-muted flex flex-col items-center justify-center rounded-xl p-2 text-center">
      <span className="text-muted-foreground text-label-sm">{label}</span>
      <span className="text-headline-sm mt-0.5">
        {part}{" "}
        {unit && <span className="text-muted-foreground text-label-sm">{unit}</span>}
      </span>
    </div>
  );
}

/** Kartu anak di halaman pengaturan — versi detail sesuai mock Stitch. */
export function SettingsChildCard({ child, latest }: { child: Child; latest: Latest }) {
  const age = chronologicalAge(child.dateOfBirth);
  const preterm = child.birthType === "PRETERM";

  const correction = preterm
    ? correctedAge({
        dateOfBirth: child.dateOfBirth,
        gestationalAgeWeeks: child.gestationalAgeWeeks ?? 0,
        gestationalAgeDays: child.gestationalAgeDays ?? 0,
      })
    : null;

  const w = splitWeight(latest?.weightKg ?? null);
  const l = splitLength(latest?.lengthHeightCm ?? null);
  const h = splitHead(latest?.headCircumferenceCm ?? null);

  return (
    <Link
      href={`/children/${child.id}`}
      className="bg-card hover:border-primary/30 relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-4 shadow-sm transition-all"
    >
      {preterm && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full bg-sky-tint/50 blur-xl"
        />
      )}

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ChildAvatar
            child={child}
            rounded="2xl"
            className="ring-border size-12 shrink-0 ring-1"
            iconClassName="text-[24px]"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-headline-sm truncate">{child.name}</h3>
              {preterm ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-label-sm font-semibold text-emerald-600">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Aktif
                </span>
              ) : (
                <span className="bg-muted text-muted-foreground text-label-sm shrink-0 rounded-full px-2 py-0.5 font-semibold">
                  {BIRTH_TYPE_LABEL.TERM}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-body-sm mt-0.5">
              {formatAgeDetailed(age)} • {SEX_LABEL[child.sex]}
            </p>
          </div>
        </div>
        <Icon name="chevron_right" className="text-muted-foreground mt-1 text-[20px]" />
      </div>

      {preterm && correction && (
        <div className="flex flex-col gap-1.5 rounded-xl bg-[#FEF08A]/30 p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="text-label-sm inline-flex items-center gap-1 font-semibold text-[#805600]">
              <Icon name="vital_signs" className="text-[15px] text-[#805600]" />
              PREMATUR (Koreksi: {formatAgeDaysDetailed(correction.days)})
            </span>
            <span className="text-muted-foreground text-label-sm">
              Lahir {formatWeeksDays(
                (child.gestationalAgeWeeks ?? 0) * 7 + (child.gestationalAgeDays ?? 0),
              )}
            </span>
          </div>
          <p className="text-muted-foreground text-[12px] leading-relaxed">
            Grafik pertumbuhan diplot berdasarkan <strong>Usia Koreksi</strong> sesuai
            standar kurva Fenton &amp; WHO preterm.
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <MetricChip label="Berat Badan" part={w.value} unit={w.unit} />
        <MetricChip label="Panjang/TB" part={l.value} unit={l.unit} />
        <MetricChip label="Lingkar Kepala" part={h.value} unit={h.unit} />
      </div>
    </Link>
  );
}
