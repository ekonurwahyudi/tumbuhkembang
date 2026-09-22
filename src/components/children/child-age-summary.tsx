import { chronologicalAge, formatAge } from "@/lib/growth/age";
import {
  correctedAge,
  estimatedDueDate,
  formatWeeksDays,
  postMenstrualAgeDays,
} from "@/lib/growth/corrected-age";
import { BIRTH_TYPE_LABEL, SEX_LABEL, formatDate } from "@/lib/format";
import type { Child } from "@/db/schema";

/**
 * Ringkasan identitas dan usia anak. Seluruh angka berasal dari lib/growth
 * (calculation engine), komponen ini hanya menampilkan.
 */
export function ChildAgeSummary({ child, asOf }: { child: Child; asOf?: string | Date }) {
  const ref = asOf ?? new Date();
  const chrono = chronologicalAge(child.dateOfBirth, ref);

  const ga =
    child.birthType === "PRETERM" &&
    child.gestationalAgeWeeks !== null &&
    child.gestationalAgeDays !== null
      ? { weeks: child.gestationalAgeWeeks, days: child.gestationalAgeDays }
      : null;

  const preterm = ga
    ? (() => {
        const args = {
          dateOfBirth: child.dateOfBirth,
          gestationalAgeWeeks: ga.weeks,
          gestationalAgeDays: ga.days,
        };
        const corrected = correctedAge({ ...args, asOf: ref });
        return {
          corrected,
          pma: postMenstrualAgeDays({ ...args, asOf: ref }),
          // Corrected age = usia kronologis dihitung dari tanggal perkiraan lahir.
          correctedLabel: formatAge(chronologicalAge(estimatedDueDate(args), ref)),
          gaLabel: `${ga.weeks} minggu ${ga.days} hari`,
        };
      })()
    : null;

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
      <div>
        <dt className="text-muted-foreground">Jenis kelamin</dt>
        <dd className="font-medium">{SEX_LABEL[child.sex]}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Tanggal lahir</dt>
        <dd className="font-medium">{formatDate(child.dateOfBirth)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Usia kronologis</dt>
        <dd className="font-medium">{formatAge(chrono)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Status kelahiran</dt>
        <dd className="font-medium">{BIRTH_TYPE_LABEL[child.birthType]}</dd>
      </div>

      {preterm && (
        <>
          <div>
            <dt className="text-muted-foreground">Usia kehamilan saat lahir</dt>
            <dd className="font-medium">{preterm.gaLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">
              {preterm.corrected.days < 0 ? "Usia pascamenstrual" : "Corrected age"}
            </dt>
            <dd className="font-medium">
              {!preterm.corrected.applicable
                ? "Tidak digunakan lagi (di atas 3 tahun)"
                : preterm.corrected.days < 0
                  ? formatWeeksDays(preterm.pma)
                  : preterm.correctedLabel}
            </dd>
          </div>
        </>
      )}
    </dl>
  );
}
