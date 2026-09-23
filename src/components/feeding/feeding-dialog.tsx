"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FeedingForm } from "./feeding-form";
import type { FeedingLog } from "@/db/schema";

export function FeedingDialog({
  childId,
  log,
  trigger,
}: {
  childId: string;
  log?: FeedingLog;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const editing = !!log;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" aria-hidden />
            Catat Minum
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Ubah Catatan Asupan" : "Catat Asupan"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Perubahan hanya berlaku untuk catatan ini."
              : "Setiap sesi dicatat terpisah, sehingga riwayatnya tetap utuh."}
          </DialogDescription>
        </DialogHeader>
        <FeedingForm childId={childId} log={log} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
