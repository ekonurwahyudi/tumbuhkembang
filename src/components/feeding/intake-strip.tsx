"use client";

import { useState } from "react";
import { estimateDailyFormula, type EstimateInput } from "@/lib/feeding/calculator";
import { Icon, type IconName } from "@/components/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_SESSIONS = 8;

/**
 * Hanya pembagi 24 yang bulat: "tiap 3 jam" lebih mudah dijalankan orang tua
 * daripada "tiap 3,4 jam". Rentang 4–12 sesi menutup pola menyusu bayi 0–6 bulan.
 */
const SESSION_OPTIONS = [12, 8, 6, 4] as const;

const ml = (n: number) => n.toLocaleString("id-ID");
const hours = (sessions: number) => (24 / sessions).toLocaleString("id-ID");

/**
 * Ringkas kisaran asupan harian di beranda: min, max, dan per sesi. Rincian
 * lengkap (berat rujukan, cincin progres, sumber) tetap di FeedingEstimate
 * pada halaman anak — ini hanya jendelanya.
 *
 * Bayi cukup bulan hanya punya satu angka per hari (bukan rentang), jadi
 * "Min"/"Max" ditampilkan sebagai satu nilai "Per hari" saat estimatedMlMax
 * kosong — menampilkan angka yang sama dua kali cuma membuat bingung.
 */
export function IntakeStrip({ input }: { input: EstimateInput }) {
  const estimate = estimateDailyFormula(input);
  const [sessions, setSessions] = useState<number>(DEFAULT_SESSIONS);

  if (!estimate.available) return null;

  const { estimatedMl: min, estimatedMlMax: max } = estimate;
  const perSessionMin = Math.round(min / sessions);
  const perSessionMax = max != null ? Math.round(max / sessions) : null;

  return (
    // Tint sendiri, sebahasa dengan ubin usia dan metrik: strip ini bukan lagi
    // blok abu yang terbaca sebagai catatan kaki.
    <div className="space-y-3 rounded-xl bg-amber-50 p-3 dark:bg-amber-500/15">
      <div className="flex items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
          <Icon name="water_bottle" filled className="text-[15px]" />
        </span>
        <p className="text-body-sm min-w-0 flex-1 truncate font-bold text-amber-950 dark:text-amber-50">
          Kisaran asupan susu
        </p>

        {/*
          Dropdown, bukan kolom angka: di HP, Select membuka daftar yang bisa
          disentuh — tanpa papan tuntas dan tanpa nilai mustahil yang perlu dijepit.
          Label memimpin dengan jam karena itu yang dipakai orang tua ("tiap 3 jam").
        */}
        <Select value={String(sessions)} onValueChange={(v) => setSessions(Number(v))}>
          <SelectTrigger
            size="sm"
            aria-label="Jadwal sesi menyusu"
            // text-label-sm (11px) dan tanpa bold: ini pengatur, bukan angkanya —
            // yang boleh menonjol di strip ini cuma nilai ml-nya.
            className="bg-card text-label-sm h-7 shrink-0 rounded-full pl-2.5 font-normal [&_svg:not([class*='size-'])]:size-3.5"
          >
            <Icon name="schedule" className="text-[13px] text-amber-700 dark:text-amber-300" />
            {/* Pill-nya sempit: di tombol cukup jamnya, jumlah sesi ada di daftar. */}
            <SelectValue>Tiap {hours(sessions)} jam</SelectValue>
          </SelectTrigger>
          <SelectContent align="end">
            {SESSION_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)} className="text-label-sm h-9 font-normal">
                Tiap {hours(n)} jam · {n} sesi
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        {max != null ? (
          <>
            {/* "per hari" pindah ke label tiap angka: pojok kanan judul sudah dipakai dropdown. */}
            <Figure
              icon="water_drop"
              label="Min/hari"
              value={ml(min)}
              tone="text-[var(--color-status-info)]"
            />
            <Figure
              icon="water_bottle"
              label="Max/hari"
              value={ml(max)}
              tone="text-[var(--color-status-warning-text)]"
            />
          </>
        ) : (
          <Figure
            icon="water_drop"
            label="Per hari"
            value={ml(min)}
            tone="text-[var(--color-status-info)]"
            className="col-span-2"
          />
        )}
        <Figure
          icon="schedule"
          label="Per sesi"
          value={
            perSessionMax != null ? `${ml(perSessionMin)}–${ml(perSessionMax)}` : ml(perSessionMin)
          }
          tone="text-[var(--color-status-normal-text)]"
        />
      </dl>

      <p className="text-label-sm flex items-start gap-1.5 text-amber-950/70 dark:text-amber-50/70">
        <Icon name="info" className="mt-px text-[13px]" />
        <span>
          Estimasi untuk susu formula, bukan target. Bayi yang menyusu langsung tidak punya target
          volume.
        </span>
      </p>
    </div>
  );
}

function Figure({
  icon,
  label,
  value,
  tone,
  className,
}: {
  icon: IconName;
  label: string;
  value: string;
  tone: string;
  className?: string;
}) {
  return (
    <div className={`bg-card/80 rounded-lg p-2 text-center shadow-sm ${className ?? ""}`}>
      <dt className="text-muted-foreground text-label-sm flex items-center justify-center gap-1">
        <Icon name={icon} className={`text-[13px] ${tone}`} />
        <span className="truncate">{label}</span>
      </dt>
      {/* Satu takik di atas label: dropdown jam sengaja dibuat kecil dan tidak
          bold, jadi angka ml-lah yang menonjol di strip ini. */}
      <dd className="mt-0.5 flex items-baseline justify-center gap-0.5">
        <span className={`text-body-md font-bold tabular-nums ${tone}`}>{value}</span>
        <span className="text-muted-foreground text-label-sm">ml</span>
      </dd>
    </div>
  );
}
