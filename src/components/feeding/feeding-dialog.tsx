"use client";

import { useState } from "react";
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
import { Icon } from "@/components/ui/icon";

export function FeedingDialog({
  childId,
  log,
  trigger,
  open: openProp,
  onOpenChange,
  beforeForm,
}: {
  childId: string;
  log?: FeedingLog;
  trigger?: React.ReactNode;
  /** Kendali dari luar, untuk pemanggil yang membuka dialog tanpa trigger sendiri. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Disisipkan di atas form, mis. pemilih anak saat mencatat dari nav bawah. */
  beforeForm?: React.ReactNode;
}) {
  const [uncontrolled, setUncontrolled] = useState(false);
  const open = openProp ?? uncontrolled;
  const setOpen = onOpenChange ?? setUncontrolled;
  const editing = !!log;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <Icon name="add" className="text-[16px]" />
              Catat Minum
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Ubah Catatan Asupan" : "Catat Asupan"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Perubahan hanya berlaku untuk catatan ini."
              : "Setiap sesi dicatat terpisah, sehingga riwayatnya tetap utuh."}
          </DialogDescription>
        </DialogHeader>
        {beforeForm}
        <FeedingForm childId={childId} log={log} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
