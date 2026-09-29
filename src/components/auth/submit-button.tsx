"use client";

import { useFormStatus } from "react-dom";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      className={cn("w-full", className)}
      disabled={pending}
      aria-busy={pending}
    >
      {pending && <Icon name="progress_activity" className="animate-spin text-[16px]" />}
      {pending ? pendingLabel : children}
    </Button>
  );
}
