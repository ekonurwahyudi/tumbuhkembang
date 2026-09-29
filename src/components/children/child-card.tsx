import Link from "next/link";
import { chronologicalAge, formatAge } from "@/lib/growth/age";
import { BIRTH_TYPE_LABEL, formatDate, splitHead, splitLength, splitWeight } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import { ChildAvatar } from "./child-avatar";
import type { Child } from "@/db/schema";

export type ChildWithLatest = {
  child: Child;
  latestMeasuredAt: string | null;
  latestWeightKg: string | null;
  latestLengthHeightCm: string | null;
  latestHeadCircumferenceCm: string | null;
};

const METRICS = [
  { key: "latestWeightKg", label: "Berat", icon: "scale", format: splitWeight },
  { key: "latestLengthHeightCm", label: "Panjang", icon: "height", format: splitLength },
  { key: "latestHeadCircumferenceCm", label: "L. Kepala", icon: "psychology", format: splitHead },
] as const satisfies readonly { key: string; label: string; icon: IconName; format: unknown }[];

export function ChildCard({ item }: { item: ChildWithLatest }) {
  const { child } = item;
  const age = formatAge(chronologicalAge(child.dateOfBirth));

  return (
    <Card>
      <CardContent className="space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <ChildAvatar
              child={child}
              className="ring-accent size-14 shrink-0 ring-2"
              iconClassName="text-[28px]"
            />
            <div className="min-w-0">
              <h3 className="text-headline-md truncate">{child.name}</h3>
              <p className="text-muted-foreground text-body-sm">{age}</p>
            </div>
          </div>
          {child.birthType === "PRETERM" && (
            <span className="text-label-sm inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-butter-pastel)] px-2.5 py-1 font-bold text-[var(--color-on-butter)]">
              <Icon name="history" className="text-[14px]" />
              {BIRTH_TYPE_LABEL.PRETERM}
            </span>
          )}
        </div>

        <dl className="grid grid-cols-3 gap-2.5">
          {METRICS.map(({ key, label, icon, format }) => {
            const m = format(item[key]);
            return (
              <div key={key} className="bg-muted border-border rounded-xl border p-3">
                <dt className="text-muted-foreground text-label-sm flex items-center justify-between gap-1">
                  {label}
                  <Icon name={icon} className="text-primary text-[16px]" />
                </dt>
                <dd className="mt-1.5 flex items-baseline gap-0.5">
                  <span className="text-metric tabular-nums">{m.value}</span>
                  {m.unit && <span className="text-muted-foreground text-label-sm">{m.unit}</span>}
                </dd>
              </div>
            );
          })}
        </dl>

        <p className="text-muted-foreground text-label-sm">
          {item.latestMeasuredAt
            ? `Pengukuran terakhir ${formatDate(item.latestMeasuredAt)}`
            : "Belum ada pengukuran"}
        </p>

        <Link
          href={`/children/${child.id}`}
          className="bg-muted hover:bg-accent text-body-sm flex min-h-11 items-center justify-center gap-1.5 rounded-full font-semibold transition-colors"
        >
          Lihat Perkembangan
          <Icon name="arrow_forward" className="text-[16px]" />
        </Link>
      </CardContent>
    </Card>
  );
}
