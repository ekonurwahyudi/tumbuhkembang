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
import { MeasurementForm } from "./measurement-form";
import type { GrowthMeasurement } from "@/db/schema";
import { Icon } from "@/components/ui/icon";

export function MeasurementDialog({
  childId,
  minDate,
  measurement,
  trigger,
  open: openProp,
  onOpenChange,
  beforeForm,
}: {
  childId: string;
  minDate: string;
  measurement?: GrowthMeasurement;
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
  const editing = !!measurement;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <Icon name="add" className="text-[16px]" />
              Pengukuran
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Ubah Pengukuran" : "Tambah Pengukuran"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Perubahan hanya berlaku untuk catatan ini."
              : "Setiap pengukuran disimpan sebagai catatan baru, data lama tidak tertimpa."}
          </DialogDescription>
        </DialogHeader>
        {beforeForm}
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
