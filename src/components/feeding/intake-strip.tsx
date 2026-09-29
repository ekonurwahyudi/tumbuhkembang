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
    <div className="bg-muted border-border space-y-3 rounded-xl border p-3">
      <div className="flex items-center gap-2">
        <span className="bg-card text-primary grid size-6 shrink-0 place-items-center rounded-full">
          <Icon name="water_bottle" className="text-[14px]" />
        </span>
        <p className="text-label-sm min-w-0 flex-1 truncate font-bold">Kisaran asupan susu</p>

        {/*
          Dropdown, bukan kolom angka: di HP, Select membuka daftar yang bisa
          disentuh — tanpa papan tuntas dan tanpa nilai mustahil yang perlu dijepit.
          Label memimpin dengan jam karena itu yang dipakai orang tua ("tiap 3 jam").
        */}
        <Select value={String(sessions)} onValueChange={(v) => setSessions(Number(v))}>
          <SelectTrigger
            size="sm"
            aria-label="Jadwal sesi menyusu"
            className="bg-card text-label-sm h-7 shrink-0 rounded-full pl-2.5 font-bold [&_svg:not([class*='size-'])]:size-3.5"
          >
            <Icon name="schedule" className="text-primary text-[14px]" />
            {/* Pill-nya sempit: di tombol cukup jamnya, jumlah sesi ada di daftar. */}
            <SelectValue>Tiap {hours(sessions)} jam</SelectValue>
          </SelectTrigger>
          <SelectContent align="end">
            {SESSION_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)} className="text-body-sm h-9">
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

      <p className="text-muted-foreground text-label-sm flex items-start gap-1.5">
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
    <div className={`bg-card border-border rounded-lg border p-2 ${className ?? ""}`}>
      <dt className="text-muted-foreground text-label-sm flex items-center gap-1">
        <Icon name={icon} className={`text-[13px] ${tone}`} />
        <span className="truncate">{label}</span>
      </dt>
      {/* Lebih kecil dari text-metric di ubin pengukuran: strip ini keterangan, bukan judul. */}
      <dd className="mt-0.5 flex items-baseline gap-0.5">
        <span className={`text-body-sm font-bold tabular-nums ${tone}`}>{value}</span>
        <span className="text-muted-foreground text-label-sm">ml</span>
      </dd>
    </div>
  );
}
