import type { ReactNode } from "react";
import { chronologicalAge, formatAge } from "@/lib/growth/age";
import { correctedAge, estimatedDueDate } from "@/lib/growth/corrected-age";
import { formatDate, formatHead, formatLength, formatWeight } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { DeleteMeasurementButton } from "./delete-measurement-button";
import { MeasurementDialog } from "./measurement-dialog";
import type { Child, GrowthMeasurement } from "@/db/schema";

/**
 * Riwayat pengukuran. Setiap catatan berdiri sendiri — menambah pengukuran
 * baru tidak pernah menimpa yang lama.
 *
 * Chip usia memakai basis yang sama dengan grafik: usia terkoreksi untuk anak
 * dengan riwayat prematur, usia kronologis untuk yang lain — supaya angka di
 * daftar ini tidak berbeda dari angka di kurva.
 */
export function MeasurementList({
  measurements,
  child,
  heading,
}: {
  measurements: GrowthMeasurement[];
  child: Child;
  /** Judul di dalam kartu; halaman riwayat penuh memakai header-nya sendiri. */
  heading?: ReactNode;
}) {
  // Usia terkoreksi = usia kronologis dihitung dari tanggal perkiraan lahir.
  const correctedFrom =
    child.birthType === "PRETERM" &&
    child.gestationalAgeWeeks !== null &&
    child.gestationalAgeDays !== null &&
    correctedAge({
      dateOfBirth: child.dateOfBirth,
      gestationalAgeWeeks: child.gestationalAgeWeeks,
      gestationalAgeDays: child.gestationalAgeDays,
    }).applicable
      ? estimatedDueDate({
          dateOfBirth: child.dateOfBirth,
          gestationalAgeWeeks: child.gestationalAgeWeeks,
          gestationalAgeDays: child.gestationalAgeDays,
        })
      : null;

  return (
    <Card>
      <CardContent className="space-y-3">
        {heading}
        <ul className="space-y-2">
          {measurements.map((m) => (
            <li
              key={m.id}
              className="bg-muted border-border hover:bg-secondary rounded-xl border p-3 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-body-sm font-bold">{formatDate(m.measuredAt)}</span>
                    <span className="bg-accent text-primary text-label-sm rounded px-1.5 py-0.5 font-semibold">
                      {correctedFrom
                        ? `Koreksi ${formatAge(chronologicalAge(correctedFrom, m.measuredAt))}`
                        : `Usia ${formatAge(chronologicalAge(child.dateOfBirth, m.measuredAt))}`}
                    </span>
                  </div>
                  <dl className="text-muted-foreground text-body-sm mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <div className="flex gap-1">
                      <dt>BB:</dt>
                      <dd className="text-foreground font-semibold tabular-nums">
                        {formatWeight(m.weightKg)}
                      </dd>
                    </div>
                    <span aria-hidden>•</span>
                    <div className="flex gap-1">
                      <dt>PB:</dt>
                      <dd className="text-foreground font-semibold tabular-nums">
                        {formatLength(m.lengthHeightCm)}
                      </dd>
                    </div>
                    <span aria-hidden>•</span>
                    <div className="flex gap-1">
                      <dt>LK:</dt>
                      <dd className="text-foreground font-semibold tabular-nums">
                        {formatHead(m.headCircumferenceCm)}
                      </dd>
                    </div>
                  </dl>
                  {m.notes && (
                    <p className="text-muted-foreground text-body-sm mt-1">{m.notes}</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center">
                  <MeasurementDialog
                    childId={child.id}
                    minDate={child.dateOfBirth}
                    measurement={m}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Ubah pengukuran ${formatDate(m.measuredAt)}`}
                      >
                        <Icon name="edit" className="text-[18px]" />
                      </Button>
                    }
                  />
                  <DeleteMeasurementButton measurementId={m.id} label={formatDate(m.measuredAt)} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
