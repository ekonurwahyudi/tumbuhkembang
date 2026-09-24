"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { unskipVaccinationAction } from "@/lib/actions/vaccination-skips";
import { Button } from "@/components/ui/button";

export function UnskipVaccinationButton({
  childId,
  catalogKey,
  label,
}: {
  childId: string;
  catalogKey: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await unskipVaccinationAction(childId, catalogKey);
          if (result.success) {
            toast.success(`${label} diaktifkan kembali.`);
            router.refresh();
          } else {
            toast.error(result.error.message);
          }
        })
      }
    >
      {pending ? "Memproses..." : "Batalkan"}
    </Button>
  );
}
