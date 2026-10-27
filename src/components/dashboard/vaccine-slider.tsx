import Link from "next/link";
import { formatDate } from "@/lib/format";
import {
  IMMUNIZATION_CATALOG,
  weightCriteriaLabel,
  weightGateNote,
  weightRuleApplies,
} from "@/lib/immunization/catalog";
import type { ScheduleEntry } from "@/lib/immunization/schedule";
import { Icon } from "@/components/ui/icon";
import { hhmm } from "@/lib/immunization/calendar";
import { ReminderDialog, type ReminderView } from "@/components/immunization/reminder-dialog";

/**
 * Vaksin terdekat saja, digeser mendatar — bukan seluruh katalog. Daftar penuh
 * tetap di halaman anak; di beranda yang relevan hanya yang sudah/hampir waktunya.
 */
export function VaccineSlider({
  childId,
  child,
  entries,
  givenCount,
  reminders = [],
}: {
  childId: string;
  /** Untuk memutuskan apakah syarat berat perlu ditampilkan pada anak ini. */
  child: { birthType: "TERM" | "PRETERM"; birthWeightGrams: number | null };
  entries: ScheduleEntry[];
  givenCount: number;
  reminders?: ReminderView[];
}) {
  const reminderByKey = new Map(reminders.map((r) => [r.catalogKey, r]));
  const nearest = entries[0];

  return (
    <section className="space-y-2.5" aria-labelledby="jadwal-vaksin">
      {/* Tanpa px-1: judul section lain (List Kado, Shop Katalog, sapaan) mulai tepat
          di tepi isi halaman, dan 4px tambahan di sini membuat satu judul meleset
          sendirian dari garis tegak yang dibentuk sisanya. */}
      <div className="flex items-center justify-between gap-2">
        {/* Emerald, sewarna ubin Jadwal Vaksin di Akses Cepat. */}
        <h2 id="jadwal-vaksin" className="text-headline-sm flex items-center gap-2">
          <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 grid size-7 shrink-0 place-items-center rounded-lg">
            <Icon name="vaccines" filled className="text-[16px]" />
          </span>
          Jadwal Vaksin Si Kecil
        </h2>
        {nearest && (
          <span className="bg-[var(--color-butter-pastel)] text-label-sm rounded-full px-2 py-0.5 font-bold text-[var(--color-on-butter)]">
            {countdownLabel(nearest)}
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="bg-card text-muted-foreground text-body-sm rounded-2xl p-4 shadow-sm">
          Seluruh vaksin katalog sudah tercatat atau ditandai tidak berlaku.
        </p>
      ) : (
        // `scroll-pl-4` mengimbangi `-mx-4 px-4`: tanpa itu titik snap jatuh di tepi
        // scrollport, yang karena `-mx-4` ada di x=0 — browser menggeser sendiri
        // sejauh 16px dan kartu pertama terselip di bawah gutter, meleset dari kartu
        // section lain yang mulai di x=16. Dengan scroll-padding, snap-start berhenti
        // tepat segaris dengan judulnya.
        <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto px-4 pb-1">
          {entries.map((entry) => {
            const reminder = reminderByKey.get(entry.vaccine.key);
            /*
              Syarat berat hanya ditampilkan bila benar-benar berlaku untuk anak
              ini — bayi prematur/BBLR tidak cukup menunggu usia, ada ambang berat
              badan terkini juga. Untuk bayi cukup bulan berat normal, baris ini
              tidak muncul: kriteria yang tidak relevan malah membingungkan.
            */
            const criteria = weightRuleApplies(entry.vaccine, child)
              ? weightCriteriaLabel(entry.vaccine)
              : null;

            return (
              <li
                key={entry.vaccine.key}
                className="bg-card w-[286px] shrink-0 snap-start space-y-2.5 rounded-2xl p-4 shadow-sm"
              >
                <span className="bg-accent text-primary text-label-sm inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold">
                  Target usia {entry.vaccine.ageLabel}
                </span>
                <h3 className="text-headline-sm">{entry.vaccine.name}</h3>

                <dl className="text-body-sm space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Icon
                      name={reminder ? "event_upcoming" : "calendar_today"}
                      className="text-muted-foreground text-[15px]"
                    />
                    <dt className="sr-only">{reminder ? "Pengingat" : "Perkiraan tanggal"}</dt>
                    <dd className={reminder ? "font-bold" : undefined}>
                      {reminder
                        ? `${formatDate(reminder.remindOn)} · ${hhmm(reminder.remindTime)}`
                        : formatDate(entry.targetDate)}
                    </dd>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Icon name="info" className="text-muted-foreground mt-0.5 text-[15px]" />
                    <dt className="sr-only">Keterangan</dt>
                    <dd className="text-muted-foreground">
                      {!entry.weightOk
                        ? weightGateNote(entry.vaccine)
                        : entry.status === "due"
                          ? "Sudah waktunya — bisa dicatat setelah diberikan."
                          : "Belum waktunya, tandai di kalender Anda."}
                    </dd>
                  </div>
                  {criteria && entry.weightOk && (
                    <div className="flex items-start gap-1.5">
                      <Icon name="scale" className="text-muted-foreground mt-0.5 text-[15px]" />
                      <dt className="sr-only">Syarat berat</dt>
                      <dd className="text-muted-foreground">{criteria}</dd>
                    </div>
                  )}
                </dl>

                <ReminderDialog
                  childId={childId}
                  catalogKey={entry.vaccine.key}
                  vaccineName={entry.vaccine.name}
                  targetDate={entry.targetDate}
                  reminder={reminder}
                  trigger={
                    <button
                      type="button"
                      className="text-body-sm flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--color-status-normal)]/25 bg-[var(--color-status-normal)]/10 font-bold text-[var(--color-status-normal-text)] transition-colors active:scale-[0.97] hover:bg-[var(--color-status-normal)]/18"
                    >
                      <Icon name={reminder ? "alarm" : "notifications"} className="text-[15px]" />
                      {reminder ? "Ubah Pengingat" : "Ingatkan Saya"}
                    </button>
                  }
                />
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href={`/children/${childId}#vaksinasi`}
        className="bg-card text-body-sm flex h-11 items-center justify-center gap-1.5 rounded-xl font-bold shadow-sm active:scale-[0.97]"
      >
        Jadwal Lengkap
        <span className="tabular-nums">
          ({givenCount}/{IMMUNIZATION_CATALOG.length})
        </span>
        <Icon name="arrow_forward" className="text-[15px]" />
      </Link>
    </section>
  );
}

function countdownLabel(entry: ScheduleEntry): string {
  if (entry.daysUntil === 0) return "Hari ini";
  if (entry.daysUntil < 0) return `Terlewat ${Math.abs(entry.daysUntil)} hari`;
  return `H-${entry.daysUntil}`;
}
