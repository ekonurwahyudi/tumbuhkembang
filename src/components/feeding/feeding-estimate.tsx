"use client";

import { useState } from "react";
import { estimateDailyFormula, type EstimateInput } from "@/lib/feeding/calculator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";

const ml = (n: number) => `${n.toLocaleString("id-ID")} ml`;

const RING_R = 28;
const RING_C = 2 * Math.PI * RING_R;

/** Persen tercatat terhadap estimasi, dibatasi 0–100. Diekspor untuk diuji. */
export function intakePercent(measured: number, estimate: number): number {
  if (!(estimate > 0)) return 0;
  return Math.max(0, Math.min(100, Math.round((measured / estimate) * 100)));
}

/**
 * Cincin progres ala template: perbandingan volume tercatat terhadap batas
 * bawah estimasi. Ini pembanding, bukan target — angkanya tetap ditulis di
 * sebelahnya agar tidak hanya tersedia secara visual.
 */
function IntakeRing({ measured, estimate }: { measured: number; estimate: number }) {
  const percent = intakePercent(measured, estimate);

  return (
    <div className="bg-muted border-border flex items-center gap-4 rounded-xl border p-3.5">
      <div className="relative grid size-16 shrink-0 place-items-center">
        <svg viewBox="0 0 64 64" className="size-16 -rotate-90" aria-hidden>
          <circle cx="32" cy="32" r={RING_R} fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle
            cx="32"
            cy="32"
            r={RING_R}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C - (RING_C * percent) / 100}
          />
        </svg>
        <span className="text-body-sm absolute font-bold tabular-nums">{percent}%</span>
      </div>
      <div className="min-w-0">
        <p className="flex items-baseline gap-1">
          <span className="text-metric tabular-nums">{measured.toLocaleString("id-ID")}</span>
          <span className="text-muted-foreground text-body-sm">
            / {estimate.toLocaleString("id-ID")} ml tercatat
          </span>
        </p>
        <p className="text-muted-foreground text-label-sm mt-0.5">
          Dibandingkan batas bawah estimasi hari ini.
        </p>
      </div>
    </div>
  );
}
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
        <CardTitle className="text-headline-sm flex items-center gap-2">
          <Icon name="nutrition" className="text-[var(--color-status-warning-text)]" />
          Estimasi kisaran asupan
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {!estimate.available ? (
          <>
            <Alert>
              <Icon name="info" className="text-[16px]" />
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
            {measuredToday !== null && (
              <IntakeRing measured={measuredToday} estimate={estimate.estimatedMl} />
            )}

            <dl className="text-body-sm space-y-2">
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
