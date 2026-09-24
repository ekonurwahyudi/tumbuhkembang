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
import { VaccinationForm } from "./vaccination-form";
import type { Vaccination } from "@/db/schema";
import type { CatalogVaccine } from "@/lib/immunization/catalog";

export function VaccinationDialog({
  childId,
  catalog,
  record,
  trigger,
}: {
  childId: string;
  catalog?: CatalogVaccine;
  record?: Vaccination;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const editing = !!record;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" aria-hidden />
            Tambah Vaksin Lain
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Ubah Catatan Vaksinasi" : "Catat Vaksinasi"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Perubahan hanya berlaku untuk catatan ini."
              : "Tanggal pemberian dan catatan (mis. merk vaksin) tersimpan di riwayat anak."}
          </DialogDescription>
        </DialogHeader>
        <VaccinationForm childId={childId} catalog={catalog} record={record} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
