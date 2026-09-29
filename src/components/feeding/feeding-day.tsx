import { FEEDING_TYPE_LABEL } from "@/schemas/feeding";
import { summarizeDay } from "@/lib/feeding/summary";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteFeedingButton } from "./delete-feeding-button";
import { FeedingDialog } from "./feeding-dialog";
import type { FeedingLog } from "@/db/schema";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<string, IconName> = {
  BREAST_DIRECT: "child_care",
  EXPRESSED_BREAST_MILK: "vaccines",
  FORMULA: "water_bottle",
};

const formatTime = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

const formatMl = (ml: number | null) =>
  ml === null ? "—" : `${ml.toLocaleString("id-ID", { maximumFractionDigits: 0 })} ml`;

/**
 * Satu hari catatan asupan: daftar sesi + ringkasannya.
 *
 * Ringkasan membedakan jumlah sesi dari volume terukur. Sesi ASI langsung tanpa
 * volume tidak pernah ikut ke total ml, dan hal itu dinyatakan di layar supaya
 * total tidak salah dibaca sebagai asupan sebenarnya.
 */
export function FeedingDay({
  date,
  logs,
  childId,
  isToday,
}: {
  date: string;
  logs: FeedingLog[];
  childId: string;
  isToday: boolean;
}) {
  const s = summarizeDay(logs, date);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-headline-sm flex items-center justify-between gap-2">
          {isToday ? "Hari ini" : formatDate(date)}
          <span className="text-muted-foreground text-label-sm font-normal">
            {s.totalSessions} catatan
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {logs.map((log) => (
            <li
              key={log.id}
              className="bg-muted border-border flex items-start justify-between gap-3 rounded-xl border p-3"
            >
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-full",
                  log.feedingType === "FORMULA"
                    ? "bg-[var(--color-butter-pastel)] text-[var(--color-on-butter)]"
                    : "bg-accent text-primary",
                )}
              >
                <Icon name={TYPE_ICON[log.feedingType]} className="text-[20px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-body-sm block font-bold">
                  {FEEDING_TYPE_LABEL[log.feedingType]}
                </span>
                {log.notes && (
                  <span className="text-muted-foreground text-body-sm block truncate">
                    {log.notes}
                  </span>
                )}
                <span className="text-primary text-label-sm mt-0.5 block font-semibold tabular-nums">
                  {formatTime(log.fedAt)}
                </span>
              </span>
              <span className="shrink-0 text-right">
                {log.amountMl === null ? (
                  <span className="text-muted-foreground text-body-sm">—</span>
                ) : (
                  <>
                    <span className="text-metric tabular-nums">
                      {Number(log.amountMl).toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-muted-foreground text-label-sm ml-0.5">ml</span>
                  </>
                )}
              </span>
              <span className="flex shrink-0 items-center">
                <FeedingDialog
                  childId={childId}
                  log={log}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Ubah catatan ${formatTime(log.fedAt)}`}
                    >
                      <Icon name="edit" className="text-[16px]" />
                    </Button>
                  }
                />
                <DeleteFeedingButton logId={log.id} label={formatTime(log.fedAt)} />
              </span>
            </li>
          ))}
        </ul>

        <div className="bg-muted border-border space-y-2 rounded-xl border p-3">
          <p className="text-body-sm font-bold">Ringkasan</p>
          <dl className="text-body-sm space-y-1">
            {s.breastDirectSessions > 0 && (
              <div className="flex gap-2">
                <dt className="text-muted-foreground">ASI langsung</dt>
                <dd className="ml-auto tabular-nums">
                  {s.breastDirectSessions} sesi
                  {s.breastDirectMl !== null && ` · ${formatMl(s.breastDirectMl)}`}
                </dd>
              </div>
            )}
            {s.expressedMl !== null && (
              <div className="flex gap-2">
                <dt className="text-muted-foreground">ASI perah</dt>
                <dd className="ml-auto tabular-nums">{formatMl(s.expressedMl)}</dd>
              </div>
            )}
            {s.formulaMl !== null && (
              <div className="flex gap-2">
                <dt className="text-muted-foreground">Susu formula</dt>
                <dd className="ml-auto tabular-nums">{formatMl(s.formulaMl)}</dd>
              </div>
            )}
            <div className="flex gap-2 border-t pt-1 font-medium">
              <dt>Total volume terukur</dt>
              <dd className="ml-auto tabular-nums">{formatMl(s.totalMeasuredMl)}</dd>
            </div>
          </dl>

          {s.hasUnmeasuredSessions && (
            <p className="text-muted-foreground text-label-sm">
              Total hanya mencakup sesi yang volumenya tercatat. Sesi menyusui langsung tanpa
              volume tidak ikut dijumlahkan.
            </p>
          )}
        </div>

        {s.hasUnmeasuredSessions && (
          <Badge variant="outline" className="font-normal">
            Ada sesi tanpa volume
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
