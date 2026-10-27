import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";

export function EmptyState({
  icon,
  title,
  description,
  action,
  tone = "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
}: {
  icon: IconName;
  title: string;
  description: string;
  action?: React.ReactNode;
  /** Warna keping ikon; samakan dengan section tempatnya berdiri. */
  tone?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        {/* Keping ikonnya berwarna dan lebih besar: halaman kosong adalah layar
            pertama yang dilihat orang tua baru, dan satu ikon pucat di tengah kartu
            putih terbaca seperti fitur yang rusak, bukan undangan untuk mulai. */}
        <span className={cn("grid size-16 place-items-center rounded-2xl", tone)}>
          <Icon name={icon} filled className="text-[30px]" />
        </span>
        <div className="space-y-1">
          <h2 className="text-headline-sm">{title}</h2>
          <p className="text-muted-foreground text-body-sm mx-auto max-w-xs">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
