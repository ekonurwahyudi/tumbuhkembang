import { Card, CardContent } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: IconName;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="bg-accent text-primary rounded-full p-3">
          <Icon name={icon} className="text-[28px]" />
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
