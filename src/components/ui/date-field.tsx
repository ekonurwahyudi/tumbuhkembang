"use client";

import { useState } from "react";
import { id as localeId } from "date-fns/locale";
import { formatDate } from "@/lib/format";
import { formatYMD, parseYMD, todayYMD } from "@/lib/growth/age";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Icon } from "@/components/ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Pemilih tanggal untuk form. Nilai yang dikirim tetap string `YYYY-MM-DD` lewat
 * `<input type="hidden">`, jadi server action dan Zod tidak berubah sama sekali.
 *
 * `Date` hanya hidup di dalam komponen ini, sebagai tanggal LOKAL tengah malam —
 * `new Date("2026-09-23")` diurai sebagai UTC dan di WIB menggeser tanggalnya
 * satu hari, sehingga konversinya lewat parseYMD/formatYMD, bukan
 * toISOString().
 */
function toLocalDate(ymd: string): Date {
  const { year, month, day } = parseYMD(ymd);
  return new Date(year, month - 1, day);
}

/** YMD berurut secara leksikografis, jadi perbandingan string sudah cukup. */
function clamp(ymd: string, min?: string, max?: string): string {
  if (min && ymd < min) return min;
  if (max && ymd > max) return max;
  return ymd;
}

export function DateField({
  id,
  name,
  defaultValue,
  min,
  max,
  required,
  invalid,
  describedBy,
  placeholder = "Pilih tanggal",
}: {
  id: string;
  name: string;
  /** YYYY-MM-DD; kosong berarti belum ada pilihan. */
  defaultValue?: string;
  /** Batas YYYY-MM-DD — tanggal di luarnya tidak bisa dipilih. */
  min?: string;
  max?: string;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);

  const selected = value ? toLocalDate(value) : undefined;
  const today = todayYMD();
  const thisYear = Number(today.slice(0, 4));
  // Dropdown bulan/tahun butuh rentang eksplisit. Tanpa batas dari pemanggil:
  // 5 tahun ke belakang (aplikasi ini hanya mengurus anak 0–24 bulan) dan 2
  // tahun ke depan (pengingat vaksin memang bertanggal masa depan).
  const startMonth = toLocalDate(min ?? `${thisYear - 5}-01-01`);
  const endMonth = toLocalDate(max ?? `${thisYear + 2}-12-31`);

  return (
    <>
      {/* Nilai form yang sebenarnya; tombol di bawah hanya antarmukanya. */}
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-invalid={invalid}
            aria-describedby={describedBy}
            // required tidak berlaku pada tombol; validasinya tetap di server.
            aria-required={required}
            className={cn(
              "h-11 w-full justify-start px-3 font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <Icon name="calendar_today" className="text-muted-foreground text-[18px]" />
            {value ? formatDate(value) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            required={false}
            locale={localeId}
            // Dropdown bulan+tahun: tanggal lahir bisa jauh ke belakang, dan
            // menekan panah "bulan sebelumnya" dua puluh kali bukan pilihan.
            captionLayout="dropdown"
            // Tanpa pilihan, buka di bulan ini — dijepit ke rentang yang sah.
            defaultMonth={selected ?? toLocalDate(clamp(today, min, max))}
            startMonth={startMonth}
            endMonth={endMonth}
            selected={selected}
            disabled={[
              ...(min ? [{ before: toLocalDate(min) }] : []),
              ...(max ? [{ after: toLocalDate(max) }] : []),
            ]}
            onSelect={(date) => {
              if (!date) return;
              setValue(formatYMD(parseYMD(date)));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </>
  );
}
