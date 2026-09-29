import { chronologicalAge, formatAge } from "@/lib/growth/age";
import { correctedAge, estimatedDueDate } from "@/lib/growth/corrected-age";
import { BIRTH_TYPE_LABEL, SEX_LABEL, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { ChildAvatar } from "./child-avatar";
import type { Child } from "@/db/schema";

/** Kartu identitas anak ala template: avatar, nama, usia, lencana status. */
export function ChildHero({ child, action }: { child: Child; action?: React.ReactNode }) {
  const age = formatAge(chronologicalAge(child.dateOfBirth));

  const ga =
    child.birthType === "PRETERM" &&
    child.gestationalAgeWeeks !== null &&
    child.gestationalAgeDays !== null
      ? { weeks: child.gestationalAgeWeeks, days: child.gestationalAgeDays }
      : null;

  const corrected = ga
    ? (() => {
        const args = {
          dateOfBirth: child.dateOfBirth,
          gestationalAgeWeeks: ga.weeks,
          gestationalAgeDays: ga.days,
        };
        // Usia terkoreksi = usia kronologis dihitung dari tanggal perkiraan lahir.
        return correctedAge(args).applicable
          ? formatAge(chronologicalAge(estimatedDueDate(args)))
          : null;
      })()
    : null;

  return (
    <Card className="relative overflow-hidden">
      {/* Lingkaran dekoratif sudut kanan bawah, seperti template. */}
      <span
        aria-hidden
        className="bg-accent/50 pointer-events-none absolute -right-6 -bottom-6 size-24 rounded-full"
      />
      <CardContent className="relative space-y-3">
        <div className="flex items-center gap-3">
          <ChildAvatar
            child={child}
            className="ring-accent size-14 shrink-0 ring-2"
            iconClassName="text-[28px]"
          />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="text-headline-md truncate">{child.name}</h1>
              <Badge className="bg-accent text-primary shrink-0">{SEX_LABEL[child.sex]}</Badge>
            </div>
            <p className="text-muted-foreground text-body-sm">
              Usia Kronologis: <span className="text-foreground font-semibold">{age}</span>
            </p>
          </div>
          {action}
        </div>

        {corrected ? (
          <div className="bg-accent/60 border-accent flex items-start gap-2 rounded-xl border p-2.5">
            <Icon name="history" className="text-primary mt-0.5 text-[18px]" />
            <div>
              <p className="text-primary text-label-sm font-bold">
                Riwayat prematur ({ga!.weeks} mgg {ga!.days} hr)
              </p>
              <p className="text-body-sm text-muted-foreground leading-snug">
                Grafik dihitung berbasis{" "}
                <strong className="text-foreground font-semibold">
                  usia terkoreksi: {corrected}
                </strong>{" "}
                demi ketepatan standar kurva WHO.
              </p>
            </div>
          </div>
        ) : null}

        <ul className="bg-muted text-label-sm flex flex-wrap items-center gap-2 rounded-xl p-2.5">
          <li className="bg-card text-muted-foreground inline-flex items-center rounded-full px-2.5 py-1">
            {BIRTH_TYPE_LABEL[child.birthType]}
          </li>
          <li className="bg-card text-muted-foreground inline-flex items-center rounded-full px-2.5 py-1">
            Lahir {formatDate(child.dateOfBirth)}
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
