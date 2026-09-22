import Link from "next/link";
import { ArrowRight, Baby } from "lucide-react";
import { chronologicalAge, formatAge } from "@/lib/growth/age";
import { BIRTH_TYPE_LABEL, formatDate, formatHead, formatLength, formatWeight } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Child } from "@/db/schema";

export type ChildWithLatest = {
  child: Child;
  latestMeasuredAt: string | null;
  latestWeightKg: string | null;
  latestLengthHeightCm: string | null;
  latestHeadCircumferenceCm: string | null;
};

export function ChildCard({ item }: { item: ChildWithLatest }) {
  const { child } = item;
  const age = formatAge(chronologicalAge(child.dateOfBirth));

  return (
    <Card>
      <CardHeader className="gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Baby className="text-muted-foreground size-5 shrink-0" aria-hidden />
          <CardTitle className="text-lg">{child.name}</CardTitle>
          <Badge variant={child.birthType === "PRETERM" ? "secondary" : "outline"}>
            {BIRTH_TYPE_LABEL[child.birthType]}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">{age}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Berat</dt>
            <dd className="font-medium tabular-nums">{formatWeight(item.latestWeightKg)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Tinggi</dt>
            <dd className="font-medium tabular-nums">{formatLength(item.latestLengthHeightCm)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Kepala</dt>
            <dd className="font-medium tabular-nums">{formatHead(item.latestHeadCircumferenceCm)}</dd>
          </div>
        </dl>

        <p className="text-muted-foreground text-xs">
          {item.latestMeasuredAt
            ? `Pengukuran terakhir ${formatDate(item.latestMeasuredAt)}`
            : "Belum ada pengukuran"}
        </p>

        <Button asChild variant="secondary" className="w-full">
          <Link href={`/children/${child.id}`}>
            Lihat Perkembangan
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
