"use client";

import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Icon } from "@/components/ui/icon";
import { IMMUNIZATION_CATALOG } from "@/lib/immunization/catalog";

/**
 * Pemilih nama vaksin: daftar katalog muncul saat kolom difokuskan dan
 * tersaring saat diketik. Menggantikan `<datalist>`, yang di Android/iOS tidak
 * muncul saat kolom diklik — daftarnya hanya keluar setelah menebak huruf
 * pertama.
 *
 * Satu state saja: kotak pencarian ITU nilai yang dikirim. Jadi nama di luar
 * katalog (mis. vaksin pemberian mandiri) tetap bisa ditulis bebas tanpa
 * memilih apa pun, dan bila yang diketik sama dengan nama katalog,
 * vaccinationSchema tetap memetakannya ke `catalogKey` seperti sebelumnya.
 */
export function VaccinePicker({
  defaultValue = "",
  invalid,
  describedBy,
}: {
  defaultValue?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [name, setName] = useState(defaultValue);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <input type="hidden" name="customName" value={name} />
      {/* Command memasang tinggi 8 pada kotak pencariannya; form ini pakai 11. */}
      <Command
        className="overflow-visible p-0 [&_[data-slot=command-input-wrapper]]:p-0 [&_[data-slot=input-group]]:h-11! [&_[data-slot=input-group]]:rounded-xl!"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <CommandInput
          id="customName"
          value={name}
          onValueChange={(v) => {
            setName(v);
            setOpen(true);
          }}
          // Menutup daftar tidak melepas fokus, jadi onFocus tidak terpicu lagi
          // saat kolom yang sama diklik ulang.
          onClick={() => setOpen(true)}
          placeholder="Cari nama vaksin…"
          maxLength={100}
          aria-invalid={invalid}
          aria-describedby={describedBy}
        />
        {open && (
          <CommandList
            // Melayang di atas isi form: daftar yang mendorong tombol simpan ke
            // bawah membuat dialog melompat tiap kali kolom ini disentuh.
            className="bg-popover absolute inset-x-0 top-full z-10 mt-1 max-h-48 rounded-xl border p-1 shadow-md"
            // Mousedown pada daftar akan mem-blur input dan menutupnya sebelum
            // klik sempat terdaftar; tahan fokusnya di input.
            onMouseDown={(e) => e.preventDefault()}
          >
            <CommandEmpty className="p-0 text-left">
              {/*
                Nama bebas sudah tersimpan sejak diketik — tombol ini tidak
                menulis apa pun, hanya menutup daftar. Tanpa sesuatu yang bisa
                diklik, kolom terasa menggantung: tidak ada tanda bahwa yang
                diketik sudah cukup.
              */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="hover:bg-muted flex w-full items-center gap-2 rounded-sm px-2 py-2.5 text-left text-sm"
              >
                <Icon name="check" className="text-muted-foreground text-[16px]" />
                <span className="truncate">Simpan “{name}”</span>
              </button>
            </CommandEmpty>
            {IMMUNIZATION_CATALOG.map((cv) => (
              <CommandItem
                key={cv.key}
                value={cv.name}
                data-checked={cv.name === name}
                // cmdk meneruskan value yang sudah di-lowercase; pakai nama aslinya
                // supaya catalogKeyByName() tetap cocok dengan katalog.
                onSelect={() => {
                  setName(cv.name);
                  setOpen(false);
                }}
              >
                <span className="flex-1 truncate">{cv.name}</span>
                <span className="text-muted-foreground text-label-sm shrink-0">{cv.ageLabel}</span>
              </CommandItem>
            ))}
          </CommandList>
        )}
      </Command>
    </div>
  );
}
