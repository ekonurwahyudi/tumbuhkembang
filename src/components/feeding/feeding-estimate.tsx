"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { estimateDailyFormula, type EstimateInput } from "@/lib/feeding/calculator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const ml = (n: number) => `${n.toLocaleString("id-ID")} ml`;
const DEFAULT_SESSIONS = 8;
const MIN_SESSIONS = 1;
const MAX_SESSIONS = 20;

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
  const [sessions, setSessions] = useState(DEFAULT_SESSIONS);

  const hoursApart = (24 / sessions).toLocaleString("id-ID", { maximumFractionDigits: 1 });

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
                  {estimate.estimatedMlMax != null
                    ? `${ml(estimate.estimatedMl)} – ${ml(estimate.estimatedMlMax)}`
                    : `sekitar ${ml(estimate.estimatedMl)}`}
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="text-muted-foreground">Per sesi</dt>
                <dd className="ml-auto flex items-center gap-2">
                  <span className="font-medium tabular-nums">
                    {estimate.estimatedMlMax != null
                      ? `${ml(Math.round(estimate.estimatedMl / sessions))} – ${ml(
                          Math.round(estimate.estimatedMlMax / sessions),
                        )}`
                      : ml(Math.round(estimate.estimatedMl / sessions))}
                  </span>
                  <span className="text-muted-foreground text-xs">/</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={MIN_SESSIONS}
                    max={MAX_SESSIONS}
                    value={sessions}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (!Number.isFinite(n)) return;
                      setSessions(Math.min(MAX_SESSIONS, Math.max(MIN_SESSIONS, Math.round(n))));
                    }}
                    aria-label="Jumlah sesi per hari"
                    className="h-7 w-14 px-1.5 text-right"
                  />
                  <span className="text-muted-foreground text-xs">sesi (≈{hoursApart} jam sekali)</span>
                </dd>
              </div>
              {measuredToday !== null && (
                <div className="flex gap-2 border-t pt-2">
                  <dt className="text-muted-foreground">Tercatat hari ini</dt>
                  <dd className="ml-auto font-medium tabular-nums">{ml(measuredToday)}</dd>
                </div>
              )}
            </dl>

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
        {estimate.available && (
          <p className="text-muted-foreground text-xs">Reference estimasi: {estimate.reference.name}.</p>
        )}
      </CardContent>
    </Card>
  );
}
