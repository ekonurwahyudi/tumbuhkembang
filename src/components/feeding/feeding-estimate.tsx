import { Info } from "lucide-react";
import { estimateDailyFormula, type EstimateInput } from "@/lib/feeding/calculator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ml = (n: number) => `${n.toLocaleString("id-ID")} ml`;

/**
 * Estimasi kisaran asupan.
 *
 * Kata-katanya sengaja berupa perkiraan, bukan perintah: "estimasi kisaran",
 * bukan "anak harus minum X ml". Ketika reference-nya tidak berlaku, komponen
 * ini menyatakan alasannya dan tidak menampilkan angka apa pun.
 */
export function FeedingEstimate({
  input,
  measuredToday,
}: {
  input: EstimateInput;
  /** Total volume terukur hari ini, untuk pembanding. */
  measuredToday: number | null;
}) {
  const estimate = estimateDailyFormula(input);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Estimasi kisaran asupan</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {!estimate.available ? (
          <>
            <Alert>
              <Info className="size-4" aria-hidden />
              <AlertDescription>{estimate.message}</AlertDescription>
            </Alert>
            {measuredToday !== null && (
              <dl className="text-sm">
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Tercatat hari ini</dt>
                  <dd className="ml-auto font-medium tabular-nums">{ml(measuredToday)}</dd>
                </div>
              </dl>
            )}
          </>
        ) : (
          <>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="text-muted-foreground">Berat terakhir</dt>
                <dd className="ml-auto font-medium tabular-nums">
                  {estimate.weightKg.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kg
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-muted-foreground">Kisaran per hari</dt>
                <dd className="ml-auto font-medium tabular-nums">
                  sekitar {ml(estimate.estimatedMl)}
                </dd>
              </div>
              {measuredToday !== null && (
                <div className="flex gap-2 border-t pt-2">
                  <dt className="text-muted-foreground">Tercatat hari ini</dt>
                  <dd className="ml-auto font-medium tabular-nums">{ml(measuredToday)}</dd>
                </div>
              )}
            </dl>

            {estimate.cappedByDailyMax && (
              <p className="text-muted-foreground text-xs">
                Dibatasi pada maksimum rata-rata {ml(960)} per 24 jam sesuai AAP; perhitungan
                dari berat badan saja memberi {ml(estimate.fromWeightMl)}.
              </p>
            )}

            <p className="text-muted-foreground text-xs">
              Ini estimasi untuk susu formula, bukan target yang harus dicapai. Setiap bayi
              berbeda dan mengatur sendiri asupannya.
            </p>
          </>
        )}

        {/*
          Keterangan berikut berlaku apa pun hasilnya — termasuk ketika estimasi
          tidak tersedia — supaya pembaca selalu tahu dari mana angkanya berasal
          dan mengapa ASI langsung tidak punya target volume.
        */}
        <p className="text-muted-foreground border-t pt-3 text-xs">
          Untuk bayi yang menyusu langsung, WHO menganjurkan menyusui responsif — sesering yang
          diinginkan bayi — dan tidak menetapkan target volume dalam ml.
        </p>
        <p className="text-muted-foreground text-xs">
          Reference estimasi: American Academy of Pediatrics, &ldquo;Amount and Schedule of Baby
          Formula Feedings&rdquo;.
        </p>
      </CardContent>
    </Card>
  );
}
