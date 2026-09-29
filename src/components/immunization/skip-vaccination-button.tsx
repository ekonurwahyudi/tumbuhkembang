"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { skipVaccinationAction } from "@/lib/actions/vaccination-skips";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export function SkipVaccinationButton({
  childId,
  catalogKey,
  label,
}: {
  childId: string;
  catalogKey: string;
  label: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Tandai ${label} tidak berlaku`}>
          <Icon name="delete" className="text-[16px]" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tandai {label} tidak berlaku?</AlertDialogTitle>
          <AlertDialogDescription>
            Vaksin ini tidak akan lagi ditandai perlu/belum untuk anak ini. Bisa dibatalkan
            kapan saja.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const result = await skipVaccinationAction(childId, catalogKey);
                if (result.success) {
                  toast.success(`${label} ditandai tidak berlaku.`);
                  setOpen(false);
                  router.refresh();
                } else {
                  toast.error(result.error.message);
                }
              });
            }}
          >
            {pending ? "Menyimpan..." : "Tandai"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
