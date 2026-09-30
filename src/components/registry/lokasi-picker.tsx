"use client";

import { useEffect, useState, useTransition } from "react";
import { searchLokasiAction } from "@/lib/actions/registry";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Icon } from "@/components/ui/icon";
import { titled } from "./registry-shared";
import type { Lokasi } from "@/lib/lokasi";

const MIN_QUERY = 3;

/**
 * Pemilih kecamatan/kota/provinsi. Satu ketikan memilih ketiganya sekaligus —
 * `lokasi.json` menyimpannya sebagai satu baris, jadi tidak ada tiga dropdown
 * bertingkat yang bisa jadi tidak konsisten satu sama lain.
 *
 * Daftarnya dicari DI SERVER (`searchLokasiAction`): berkasnya 376 KB dan tidak
 * boleh ikut ke bundle klien. Yang menyeberang cuma 12 baris per pencarian.
 *
 * Bentuknya meniru `vaccine-picker.tsx` — Command yang sudah ada, tanpa dependensi
 * baru. Bedanya: di sini teks bebas TIDAK sah, jadi nilai yang dikirim tersimpan di
 * tiga input hidden dan hanya berubah saat sebuah baris dipilih.
 */
export function LokasiPicker({
  defaultValue,
  invalid,
  describedBy,
}: {
  defaultValue: Lokasi | null;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [picked, setPicked] = useState<Lokasi | null>(defaultValue);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Lokasi[]>([]);
  const [pending, startTransition] = useTransition();

  /*
    Tunda 250 ms: mengetik "jakarta" kalau tidak jadi tujuh panggilan server.

    setRows hanya dipanggil di dalam timeout, bukan di badan effect — setState
    sinkron di badan effect memicu render berantai. Hasil ketikan lama disaring
    di render (`shown` di bawah), bukan dengan mengosongkan state lebih dulu.
  */
  useEffect(() => {
    if (query.trim().length < MIN_QUERY) return;
    const t = setTimeout(() => {
      startTransition(async () => setRows(await searchLokasiAction(query)));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // Ketikan yang sudah dipendekkan lagi tidak boleh memperlihatkan hasil lamanya.
  const shown = query.trim().length < MIN_QUERY ? [] : rows;

  return (
    <div className="space-y-2">
      <input type="hidden" name="shipProvince" value={picked?.province ?? ""} />
      <input type="hidden" name="shipCity" value={picked?.city ?? ""} />
      <input type="hidden" name="shipDistrict" value={picked?.district ?? ""} />

      <div className="relative">
        <Command
          className="overflow-visible p-0 [&_[data-slot=command-input-wrapper]]:p-0 [&_[data-slot=input-group]]:h-11! [&_[data-slot=input-group]]:rounded-xl!"
          // Command menyaring sendiri daftar yang diberikan; di sini penyaringnya
          // sudah terjadi di server, jadi jangan disaring dua kali.
          shouldFilter={false}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        >
          <CommandInput
            id="lokasi"
            value={query}
            onValueChange={(v) => {
              setQuery(v);
              setOpen(true);
            }}
            onClick={() => setOpen(true)}
            placeholder="Ketik 3 huruf, mis. “demak”"
            maxLength={60}
            aria-invalid={invalid}
            aria-describedby={describedBy}
          />
          {open && query.trim().length >= MIN_QUERY && (
            <CommandList
              className="bg-popover absolute inset-x-0 top-full z-20 mt-1 max-h-56 rounded-xl border p-1 shadow-md"
              onMouseDown={(e) => e.preventDefault()}
            >
              <CommandEmpty className="text-muted-foreground px-2 py-2.5 text-left text-sm">
                {pending ? "Mencari…" : "Tidak ada kecamatan yang cocok."}
              </CommandEmpty>
              {shown.map((r) => (
                <CommandItem
                  key={`${r.district}|${r.city}|${r.province}`}
                  value={`${r.district}|${r.city}|${r.province}`}
                  onSelect={() => {
                    setPicked(r);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="items-start gap-2"
                >
                  <Icon name="home" className="text-muted-foreground mt-0.5 text-[16px]" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{titled(r.district)}</span>
                    <span className="text-muted-foreground block truncate text-[12px]">
                      {titled(r.city)}, {titled(r.province)}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandList>
          )}
        </Command>
      </div>

      {picked ? (
        <p className="bg-accent text-primary text-body-sm flex items-start gap-2 rounded-xl p-2.5">
          <Icon name="check_circle" filled className="mt-0.5 shrink-0 text-[16px]" />
          <span className="min-w-0">
            <strong>{titled(picked.district)}</strong>
            <br />
            {titled(picked.city)}, {titled(picked.province)}
          </span>
        </p>
      ) : (
        <p className="text-muted-foreground text-label-sm">
          Belum ada lokasi terpilih. Ketik minimal {MIN_QUERY} huruf nama kecamatan, kota, atau
          provinsi.
        </p>
      )}
    </div>
  );
}
