"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Icon, type IconName } from "@/components/ui/icon";
import { MeasurementDialog } from "@/components/measurements/measurement-dialog";
import { FeedingDialog } from "@/components/feeding/feeding-dialog";
import { VaccinationDialog } from "@/components/immunization/vaccination-dialog";
import { ChildAvatar } from "@/components/children/child-avatar";
import { chronologicalAge, formatAge } from "@/lib/growth/age";
import { cn } from "@/lib/utils";

type Kind = "measurement" | "feeding" | "vaccination";
type QuickChild = { id: string; name: string; dateOfBirth: string; photoKey: string | null };

const CHOICES: { kind: Kind; title: string; description: string; icon: IconName; tone: string }[] =
  [
    {
      kind: "measurement",
      title: "Ukur Berat & Tinggi Badan",
      description: "Timbang BB, ukur panjang badan, dan lingkar kepala",
      icon: "straighten",
      tone: "bg-accent text-primary",
    },
    {
      kind: "feeding",
      title: "Catat Asupan ASI / Susu",
      description: "Log durasi menyusu atau volume perah / formula",
      icon: "water_bottle",
      tone: "bg-[var(--color-butter-pastel)] text-[var(--color-on-butter)]",
    },
    {
      kind: "vaccination",
      title: "Catat Imunisasi Baru",
      description: "Input vaksinasi sesuai jadwal IDAI & Kemenkes RI",
      icon: "vaccines",
      tone: "bg-accent text-primary",
    },
  ];

/** Pemilih anak di dalam form: catatan bisa dialihkan tanpa menutup dialog. */
function ChildPicker({
  childrenList,
  selected,
  onSelect,
}: {
  childrenList: QuickChild[];
  selected: QuickChild;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      {childrenList.length > 1 && (
        <fieldset>
          <legend className="text-muted-foreground text-label-sm mb-1.5 font-bold uppercase tracking-wider">
            Catat untuk anak
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {childrenList.map((c) => {
              const active = c.id === selected.id;
              return (
                <label
                  key={c.id}
                  className={cn(
                    "text-label-sm cursor-pointer rounded-full px-3 py-1.5 font-bold transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-accent",
                  )}
                >
                  <input
                    type="radio"
                    name="quick-record-child"
                    value={c.id}
                    checked={active}
                    onChange={() => onSelect(c.id)}
                    className="sr-only"
                  />
                  {c.name}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="bg-muted border-border flex items-center gap-2.5 rounded-xl border p-2.5">
        <ChildAvatar child={selected} className="size-8 shrink-0" iconClassName="text-[18px]" />
        <span className="min-w-0">
          <span className="text-body-sm block font-bold">{selected.name}</span>
          <span className="text-muted-foreground text-label-sm block">
            Usia: {formatAge(chronologicalAge(selected.dateOfBirth))}
          </span>
        </span>
      </div>
    </div>
  );
}

/**
 * Tombol catat melayang di nav bawah: pilih jenis catatan, lalu form-nya
 * terbuka di tempat. Tidak berpindah halaman — mencatat dari mana pun tidak
 * boleh membuang konteks yang sedang dibaca.
 */
export function QuickRecordSheet({ childrenList }: { childrenList: QuickChild[] }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialog, setDialog] = useState<Kind | null>(null);
  const [childId, setChildId] = useState(childrenList[0].id);

  // Anak bisa terhapus dari halaman lain selagi sheet terpasang; jatuh kembali
  // ke anak pertama agar form tidak pernah menunjuk id yang sudah tidak ada.
  const child = childrenList.find((c) => c.id === childId) ?? childrenList[0];
  const picker = <ChildPicker childrenList={childrenList} selected={child} onSelect={setChildId} />;

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger
          aria-label="Catat aktivitas"
          className="bg-primary text-primary-foreground ring-card grid size-12 place-items-center rounded-full shadow-lg ring-4 transition-transform hover:bg-[#006194] active:scale-90"
        >
          <Icon name="add" className="text-[26px]" />
        </SheetTrigger>

        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="mx-auto max-w-md gap-0 rounded-t-3xl p-5"
        >
          <div className="bg-border mx-auto mb-3 h-1.5 w-12 rounded-full" />

          <SheetHeader className="gap-0.5 p-0">
            <span className="text-primary text-label-sm flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <Icon name="verified" filled className="text-[18px]" />
              Buku KIA Digital
            </span>
            <SheetTitle className="text-headline-md">Catat Aktivitas Cepat</SheetTitle>
            <SheetDescription className="text-body-sm">
              Pilih data tumbuh kembang yang ingin dimasukkan
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-2 pt-4">
            {CHOICES.map(({ kind, title, description, icon, tone }) => (
              <button
                key={kind}
                type="button"
                onClick={() => {
                  setSheetOpen(false);
                  setDialog(kind);
                }}
                className="bg-muted hover:bg-accent flex items-center gap-3 rounded-2xl p-3.5 text-left transition-colors"
              >
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}>
                  <Icon name={icon} className="text-[20px]" />
                </span>
                <span className="min-w-0">
                  <span className="text-body-md block font-bold">{title}</span>
                  <span className="text-muted-foreground text-label-sm block">{description}</span>
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSheetOpen(false)}
            className="text-muted-foreground hover:text-foreground text-body-sm w-full rounded-full py-2.5 font-semibold"
          >
            Batal
          </button>
        </SheetContent>
      </Sheet>

      {/*
        `key` pada id anak memaksa form dibuat ulang saat anak diganti dari
        dalam dialog — tanpa itu nilai yang sudah diketik untuk anak sebelumnya
        akan tertinggal di form anak berikutnya.
      */}
      <MeasurementDialog
        key={`m-${child.id}`}
        childId={child.id}
        minDate={child.dateOfBirth}
        trigger={null}
        beforeForm={picker}
        open={dialog === "measurement"}
        onOpenChange={(o) => setDialog(o ? "measurement" : null)}
      />
      <FeedingDialog
        key={`f-${child.id}`}
        childId={child.id}
        trigger={null}
        beforeForm={picker}
        open={dialog === "feeding"}
        onOpenChange={(o) => setDialog(o ? "feeding" : null)}
      />
      <VaccinationDialog
        key={`v-${child.id}`}
        childId={child.id}
        trigger={null}
        beforeForm={picker}
        open={dialog === "vaccination"}
        onOpenChange={(o) => setDialog(o ? "vaccination" : null)}
      />
    </>
  );
}
