import { Pencil } from "lucide-react";
import { chronologicalAge } from "@/lib/growth/age";
import {
  effectiveMinAgeMonths,
  IMMUNIZATION_CATALOG,
  weightCriteriaLabel,
  weightGateNote,
  weightGateSatisfied,
} from "@/lib/immunization/catalog";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteVaccinationButton } from "./delete-vaccination-button";
import { SkipVaccinationButton } from "./skip-vaccination-button";
import { UnskipVaccinationButton } from "./unskip-vaccination-button";
import { VaccinationDialog } from "./vaccination-dialog";
import type { Child, Vaccination } from "@/db/schema";

type Status = "given" | "skipped" | "due" | "upcoming";

const STATUS_LABEL: Record<Status, string> = {
  given: "Sudah",
  skipped: "Dilewati",
  due: "Perlu diberikan",
  upcoming: "Belum waktunya",
};

const STATUS_VARIANT: Record<Status, "default" | "secondary" | "outline" | "ghost"> = {
  given: "default",
  skipped: "ghost",
  due: "secondary",
  upcoming: "outline",
};

export function ImmunizationList({
  child,
  vaccinations,
  skippedKeys,
  currentWeightGrams,
}: {
  child: Child;
  vaccinations: Vaccination[];
  skippedKeys: string[];
  /** Berat terkini (gram), dari pengukuran terakhir; fallback ke berat lahir bila belum ada pengukuran. */
  currentWeightGrams: number | null;
}) {
  const ageMonths = chronologicalAge(child.dateOfBirth).totalMonths;
  const byCatalogKey = new Map(vaccinations.filter((v) => v.catalogKey).map((v) => [v.catalogKey, v]));
  const skipped = new Set(skippedKeys);
  const custom = vaccinations.filter((v) => !v.catalogKey);

  return (
    <Card>
      <CardContent className="space-y-1">
        <ul className="divide-y">
          {IMMUNIZATION_CATALOG.map((cv) => {
            const record = byCatalogKey.get(cv.key);
            const isSkipped = !record && skipped.has(cv.key);
            const minAgeMonths = effectiveMinAgeMonths(cv, child.birthWeightGrams);
            const weightOk = weightGateSatisfied(cv, child, currentWeightGrams);
            const criteria = weightCriteriaLabel(cv);
            const status: Status = record
              ? "given"
              : isSkipped
                ? "skipped"
                : ageMonths >= minAgeMonths && weightOk
                  ? "due"
                  : "upcoming";

            return (
              <li key={cv.key} className="flex items-start gap-3 py-2.5 first:pt-0">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{cv.name}</span>
                    <Badge variant={STATUS_VARIANT[status]} className="font-normal">
                      {STATUS_LABEL[status]}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {record
                      ? formatDate(record.givenAt)
                      : isSkipped
                        ? "Tidak berlaku untuk anak ini"
                        : !weightOk
                          ? weightGateNote(cv)
                          : `Usia ${cv.ageLabel}${criteria ? ` · ${criteria}` : ""}`}
                    {record?.notes && ` · ${record.notes}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center">
                  {record ? (
                    <>
                      <VaccinationDialog
                        childId={child.id}
                        record={record}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label={`Ubah catatan ${cv.name}`}>
                            <Pencil className="size-4" aria-hidden />
                          </Button>
                        }
                      />
                      <DeleteVaccinationButton id={record.id} label={cv.name} />
                    </>
                  ) : isSkipped ? (
                    <UnskipVaccinationButton childId={child.id} catalogKey={cv.key} label={cv.name} />
                  ) : (
                    <>
                      <VaccinationDialog
                        childId={child.id}
                        catalog={cv}
                        trigger={
                          <Button variant="outline" size="sm">
                            Catat
                          </Button>
                        }
                      />
                      <SkipVaccinationButton childId={child.id} catalogKey={cv.key} label={cv.name} />
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {custom.length > 0 && (
          <ul className="divide-y border-t">
            {custom.map((record) => (
              <li key={record.id} className="flex items-start gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium">{record.name}</span>
                  <p className="text-muted-foreground text-xs">
                    {formatDate(record.givenAt)}
                    {record.notes && ` · ${record.notes}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center">
                  <VaccinationDialog
                    childId={child.id}
                    record={record}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label={`Ubah catatan ${record.name}`}>
                        <Pencil className="size-4" aria-hidden />
                      </Button>
                    }
                  />
                  <DeleteVaccinationButton id={record.id} label={record.name} />
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="pt-3">
          <VaccinationDialog childId={child.id} />
        </div>
      </CardContent>
    </Card>
  );
}
