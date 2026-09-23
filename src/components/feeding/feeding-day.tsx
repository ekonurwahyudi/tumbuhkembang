import { Pencil } from "lucide-react";
import { FEEDING_TYPE_LABEL } from "@/schemas/feeding";
import { summarizeDay } from "@/lib/feeding/summary";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteFeedingButton } from "./delete-feeding-button";
import { FeedingDialog } from "./feeding-dialog";
import type { FeedingLog } from "@/db/schema";

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
        <CardTitle className="text-base">
          {isToday ? "Hari ini" : formatDate(date)}
          <span className="text-muted-foreground ml-2 text-sm font-normal">
            {s.totalSessions} sesi
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <ul className="divide-y">
          {logs.map((log) => (
            <li key={log.id} className="flex items-center gap-3 py-2 first:pt-0">
              <span className="text-muted-foreground w-12 shrink-0 text-sm tabular-nums">
                {formatTime(log.fedAt)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm">{FEEDING_TYPE_LABEL[log.feedingType]}</span>
                {log.notes && (
                  <span className="text-muted-foreground block truncate text-xs">
                    {log.notes}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {log.amountMl === null ? (
                  <span className="text-muted-foreground font-normal">—</span>
                ) : (
                  `${Number(log.amountMl).toLocaleString("id-ID", { maximumFractionDigits: 0 })} ml`
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
                      <Pencil className="size-4" aria-hidden />
                    </Button>
                  }
                />
                <DeleteFeedingButton logId={log.id} label={formatTime(log.fedAt)} />
              </span>
            </li>
          ))}
        </ul>

        <div className="bg-muted/40 space-y-2 rounded-lg p-3">
          <p className="text-sm font-medium">Ringkasan</p>
          <dl className="space-y-1 text-sm">
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
            <p className="text-muted-foreground text-xs">
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
