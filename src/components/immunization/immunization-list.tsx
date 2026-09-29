"use client";

import { useState } from "react";
import {
  IMMUNIZATION_CATALOG,
  weightCriteriaLabel,
  weightGateNote,
  weightRuleApplies,
} from "@/lib/immunization/catalog";
import { vaccineSchedule, type VaccineStatus } from "@/lib/immunization/schedule";
import { formatDate } from "@/lib/format";
import { hhmm } from "@/lib/immunization/calendar";
import { ReminderDialog, type ReminderView } from "./reminder-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteVaccinationButton } from "./delete-vaccination-button";
import { SkipVaccinationButton } from "./skip-vaccination-button";
import { UnskipVaccinationButton } from "./unskip-vaccination-button";
import { VaccinationDialog } from "./vaccination-dialog";
import type { Child, Vaccination } from "@/db/schema";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type Status = VaccineStatus;

const STATUS_LABEL: Record<Status, string> = {
  given: "Sudah",
  skipped: "Dilewati",
  due: "Perlu diberikan",
  upcoming: "Belum waktunya",
};

const STATUS_ICON: Record<Status, IconName> = {
  given: "check_circle",
  skipped: "close",
  due: "schedule",
  upcoming: "hourglass_top",
};

/** Warna lencana status. Label teks selalu menyertainya — warna bukan satu-satunya penanda. */
const STATUS_TONE: Record<Status, string> = {
  given: "bg-card text-[var(--color-status-normal-text)]",
  skipped: "bg-card text-muted-foreground",
  due: "bg-[var(--color-butter-pastel)] text-[var(--color-on-butter)]",
  upcoming: "bg-card text-muted-foreground",
};

/** Titik warna pada pill penyaring — penguat label, bukan penggantinya. */
const STATUS_DOT: Record<Status, string> = {
  given: "bg-[var(--color-status-normal)]",
  skipped: "bg-muted-foreground",
  due: "bg-[var(--color-butter-bright)]",
  upcoming: "bg-border",
};

const STATUS_VARIANT: Record<Status, "default" | "secondary" | "outline" | "ghost"> = {
  given: "default",
  skipped: "ghost",
  due: "secondary",
  upcoming: "outline",
};

/** Urutan pill: yang paling sering ditanya orang tua lebih dulu. */
const FILTER_ORDER: Status[] = ["due", "given", "upcoming", "skipped"];

export function ImmunizationList({
  child,
  vaccinations,
  skippedKeys,
  currentWeightGrams,
  reminders = [],
}: {
  child: Child;
  vaccinations: Vaccination[];
  skippedKeys: string[];
  /** Berat terkini (gram), dari pengukuran terakhir; fallback ke berat lahir bila belum ada pengukuran. */
  currentWeightGrams: number | null;
  reminders?: ReminderView[];
}) {
  const [filter, setFilter] = useState<Status | "all">("all");

  const byCatalogKey = new Map(vaccinations.filter((v) => v.catalogKey).map((v) => [v.catalogKey, v]));
  const custom = vaccinations.filter((v) => !v.catalogKey);
  const schedule = vaccineSchedule({ child, vaccinations, skippedKeys, currentWeightGrams });
  const reminderByKey = new Map(reminders.map((r) => [r.catalogKey, r]));

  const givenCount = schedule.filter((e) => e.status === "given").length;
  const skippedCount = schedule.filter((e) => e.status === "skipped").length;
  const percent = Math.round((givenCount / IMMUNIZATION_CATALOG.length) * 100);

  const counts = FILTER_ORDER.map((s) => [s, schedule.filter((e) => e.status === s).length] as const);
  const visible = filter === "all" ? schedule : schedule.filter((e) => e.status === filter);

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="bg-muted border-border space-y-2 rounded-xl border p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-body-sm font-bold">
              {givenCount} dari {IMMUNIZATION_CATALOG.length} vaksin katalog tercatat
            </span>
            <span className="text-muted-foreground text-label-sm tabular-nums">{percent}%</span>
          </div>
          <div
            className="bg-border h-2.5 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={givenCount}
            aria-valuemin={0}
            aria-valuemax={IMMUNIZATION_CATALOG.length}
            aria-label="Kemajuan imunisasi katalog"
          >
            <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }} />
          </div>
          {skippedCount > 0 && (
            <p className="text-muted-foreground text-label-sm">
              {skippedCount} vaksin ditandai tidak berlaku untuk anak ini.
            </p>
          )}
        </div>

        {/*
          Penyaring status. Digeser mendatar karena pada lebar HP kelima pill tidak
          muat sebaris; label teks selalu tampak, titik warna hanya penguat.
        */}
        <div
          role="tablist"
          aria-label="Saring menurut status"
          className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4"
        >
          <FilterPill
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label={`Semua (${schedule.length})`}
          />
          {counts.map(([status, count]) =>
            count === 0 ? null : (
              <FilterPill
                key={status}
                active={filter === status}
                onClick={() => setFilter(status)}
                label={`${STATUS_LABEL[status]} (${count})`}
                dot={STATUS_DOT[status]}
              />
            ),
          )}
        </div>

        {visible.length === 0 && (
          <p className="text-muted-foreground text-body-sm py-2">
            Tidak ada vaksin pada kelompok ini.
          </p>
        )}

        <ul className="space-y-2">
          {visible.map(({ vaccine: cv, status, weightOk, targetDate }) => {
            const record = byCatalogKey.get(cv.key);
            const isSkipped = status === "skipped";
            // Sama seperti di slider beranda: kriteria berat hanya untuk anak
            // yang memang terkena aturannya.
            const criteria = weightRuleApplies(cv, child) ? weightCriteriaLabel(cv) : null;
            const reminder = reminderByKey.get(cv.key);

            return (
              <li
                key={cv.key}
                className="bg-muted border-border flex items-start gap-3 rounded-xl border p-3"
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full",
                    STATUS_TONE[status],
                  )}
                >
                  <Icon
                    name={STATUS_ICON[status]}
                    filled={status === "given"}
                    className="text-[20px]"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-body-sm font-bold">{cv.name}</span>
                    <Badge variant={STATUS_VARIANT[status]} className="font-normal">
                      {STATUS_LABEL[status]}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-label-sm">
                    {record
                      ? `Diberikan: ${formatDate(record.givenAt)}`
                      : isSkipped
                        ? "Tidak berlaku untuk anak ini"
                        : !weightOk
                          ? weightGateNote(cv)
                          : `Target usia ${cv.ageLabel}${criteria ? ` · ${criteria}` : ""}`}
                    {record?.notes && ` · ${record.notes}`}
                  </p>
                  {reminder && !record && !isSkipped && (
                    <span className="bg-accent text-primary text-label-sm mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold">
                      <Icon name="alarm" className="text-[14px]" />
                      {formatDate(reminder.remindOn)} · {hhmm(reminder.remindTime)}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center">
                  {record ? (
                    <>
                      <VaccinationDialog
                        childId={child.id}
                        record={record}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label={`Ubah catatan ${cv.name}`}>
                            <Icon name="edit" className="text-[16px]" />
                          </Button>
                        }
                      />
                      <DeleteVaccinationButton id={record.id} label={cv.name} />
                    </>
                  ) : isSkipped ? (
                    <UnskipVaccinationButton childId={child.id} catalogKey={cv.key} label={cv.name} />
                  ) : (
                    <>
                      <VaccinationDialog
                        childId={child.id}
                        catalog={cv}
                        trigger={
                          <Button variant="outline" size="sm">
                            Catat
                          </Button>
                        }
                      />
                      <ReminderDialog
                        childId={child.id}
                        catalogKey={cv.key}
                        vaccineName={cv.name}
                        targetDate={targetDate}
                        reminder={reminder}
                      />
                      <SkipVaccinationButton childId={child.id} catalogKey={cv.key} label={cv.name} />
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {custom.length > 0 && (
          <ul className="space-y-2 border-t pt-3">
            {custom.map((record) => (
              <li key={record.id} className="bg-muted border-border flex items-start gap-3 rounded-xl border p-3">
                <div className="min-w-0 flex-1">
                  <span className="text-body-sm font-bold">{record.name}</span>
                  <p className="text-muted-foreground text-label-sm">
                    {formatDate(record.givenAt)}
                    {record.notes && ` · ${record.notes}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center">
                  <VaccinationDialog
                    childId={child.id}
                    record={record}
                    freeTextOnly
                    trigger={
                      <Button variant="ghost" size="icon" aria-label={`Ubah catatan ${record.name}`}>
                        <Icon name="edit" className="text-[16px]" />
                      </Button>
                    }
                  />
                  <DeleteVaccinationButton id={record.id} label={record.name} />
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="pt-3">
          <VaccinationDialog childId={child.id} freeTextOnly />
        </div>
      </CardContent>
    </Card>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dot?: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "text-label-sm flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 font-bold whitespace-nowrap transition-colors active:scale-[0.97]",
        active ? "bg-primary text-primary-foreground" : "bg-card border",
      )}
    >
      {dot && <span className={cn("size-2 rounded-full", dot)} aria-hidden />}
      {label}
    </button>
  );
}
