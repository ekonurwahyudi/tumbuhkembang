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
import { VaccinationForm } from "./vaccination-form";
import type { Vaccination } from "@/db/schema";
import type { CatalogVaccine } from "@/lib/immunization/catalog";
import { Icon } from "@/components/ui/icon";

export function VaccinationDialog({
  childId,
  catalog,
  record,
  freeTextOnly,
  trigger,
  open: openProp,
  onOpenChange,
  beforeForm,
}: {
  childId: string;
  catalog?: CatalogVaccine;
  record?: Vaccination;
  /** Nama vaksin diketik bebas, tanpa daftar katalog — lihat VaccinationForm. */
  freeTextOnly?: boolean;
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
  const editing = !!record;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button size="sm">
              <Icon name="add" className="text-[16px]" />
              Tambah Vaksin Lain
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Ubah Catatan Vaksinasi" : "Catat Vaksinasi"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Perubahan hanya berlaku untuk catatan ini."
              : "Tanggal pemberian dan catatan (mis. merk vaksin) tersimpan di riwayat anak."}
          </DialogDescription>
        </DialogHeader>
        {beforeForm}
        <VaccinationForm
          childId={childId}
          catalog={catalog}
          record={record}
          freeTextOnly={freeTextOnly}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
