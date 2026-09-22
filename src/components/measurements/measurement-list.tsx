import { chronologicalAge, formatAge } from "@/lib/growth/age";
import { formatDate, formatHead, formatLength, formatWeight } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { DeleteMeasurementButton } from "./delete-measurement-button";
import { MeasurementDialog } from "./measurement-dialog";
import type { GrowthMeasurement } from "@/db/schema";

/**
 * Riwayat pengukuran. Setiap catatan berdiri sendiri — menambah pengukuran
 * baru tidak pernah menimpa yang lama.
 */
export function MeasurementList({
  measurements,
  childId,
  dateOfBirth,
}: {
  measurements: GrowthMeasurement[];
  childId: string;
  dateOfBirth: string;
}) {
  return (
    <ul className="space-y-3">
      {measurements.map((m) => (
        <li key={m.id}>
          <Card>
            <CardContent className="space-y-3 py-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{formatDate(m.measuredAt)}</p>
                  <p className="text-muted-foreground text-xs">
                    Usia {formatAge(chronologicalAge(dateOfBirth, m.measuredAt))}
                  </p>
                </div>
                <div className="flex shrink-0 items-center">
                  <MeasurementDialog
                    childId={childId}
                    minDate={dateOfBirth}
                    measurement={m}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Ubah pengukuran ${formatDate(m.measuredAt)}`}
                      >
                        <Pencil className="size-4" aria-hidden />
                      </Button>
                    }
                  />
                  <DeleteMeasurementButton
                    measurementId={m.id}
                    label={formatDate(m.measuredAt)}
                  />
                </div>
              </div>

              <dl className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Berat</dt>
                  <dd className="font-medium tabular-nums">{formatWeight(m.weightKg)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Tinggi</dt>
                  <dd className="font-medium tabular-nums">{formatLength(m.lengthHeightCm)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Kepala</dt>
                  <dd className="font-medium tabular-nums">{formatHead(m.headCircumferenceCm)}</dd>
                </div>
              </dl>

              {m.notes && <p className="text-muted-foreground text-sm">{m.notes}</p>}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
