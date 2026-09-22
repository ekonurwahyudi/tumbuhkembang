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
import { MeasurementForm } from "./measurement-form";
import type { GrowthMeasurement } from "@/db/schema";

export function MeasurementDialog({
  childId,
  minDate,
  measurement,
  trigger,
}: {
  childId: string;
  minDate: string;
  measurement?: GrowthMeasurement;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const editing = !!measurement;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" aria-hidden />
            Pengukuran
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Ubah Pengukuran" : "Tambah Pengukuran"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Perubahan hanya berlaku untuk catatan ini."
              : "Setiap pengukuran disimpan sebagai catatan baru, data lama tidak tertimpa."}
          </DialogDescription>
        </DialogHeader>
        <MeasurementForm
          childId={childId}
          minDate={minDate}
          measurement={measurement}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
