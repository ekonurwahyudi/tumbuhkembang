import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="bg-muted text-muted-foreground rounded-full p-3">
          <Icon className="size-6" />
        </span>
        <div className="space-y-1">
          <h2 className="font-medium">{title}</h2>
          <p className="text-muted-foreground mx-auto max-w-xs text-sm">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
