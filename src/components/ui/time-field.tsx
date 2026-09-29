"use client";

import { Icon } from "@/components/ui/icon";

/**
 * Pemilih jam. Tetap `<input type="time">`: picker bawaan HP (roda jam, format
 * 12/24 sesuai setelan sistem) lebih baik daripada apa pun yang bisa ditulis di
 * sini, dan nilainya sudah "HH:MM" seperti yang diminta schema.
 *
 * Yang diubah hanya tampilannya, supaya sebentuk dengan DateField: indikator
 * jam bawaan disembunyikan dan diganti ikon di depan, lalu seluruh kolom
 * membuka picker lewat showPicker() — tanpa itu, di desktop picker hanya bisa
 * dibuka dari indikator yang baru saja kita sembunyikan.
 */
export function TimeField({
  id,
  name,
  defaultValue,
  required,
  invalid,
  describedBy,
}: {
  id: string;
  name: string;
  /** HH:MM */
  defaultValue?: string;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <div className="relative">
      <Icon
        name="schedule"
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[18px]"
      />
      <input
        id={id}
        name={name}
        type="time"
        defaultValue={defaultValue}
        required={required}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onClick={(e) => e.currentTarget.showPicker?.()}
        className="border-border bg-background focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:border-input dark:bg-input/30 h-11 w-full appearance-none rounded-full border pr-3 pl-9 text-base transition-colors outline-none focus-visible:ring-3 aria-invalid:ring-3 md:text-sm [&::-webkit-calendar-picker-indicator]:hidden"
      />
    </div>
  );
}
