"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteReminderAction, saveReminderAction } from "@/lib/actions/vaccine-reminders";
import { googleCalendarUrl, hhmm } from "@/lib/immunization/calendar";
import { useFormAction } from "@/lib/use-form-action";
import { todayLocalISO } from "@/schemas/date";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DateField } from "@/components/ui/date-field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimeField } from "@/components/ui/time-field";

/** Bentuk minimal pengingat yang dibutuhkan UI; kolom TIME datang sebagai "HH:MM:SS". */
export type ReminderView = {
  id: string;
  catalogKey: string;
  remindOn: string;
  remindTime: string;
  notes: string | null;
};

const DURATION_MINUTES = 60;

export function ReminderDialog({
  childId,
  catalogKey,
  vaccineName,
  targetDate,
  reminder,
  trigger,
}: {
  childId: string;
  catalogKey: string;
  vaccineName: string;
  /** Perkiraan dari vaccineSchedule(), dipakai sebagai isian awal tanggal. */
  targetDate: string;
  reminder?: ReminderView;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [deleting, startDelete] = useTransition();

  const { action, fields, formError, values } = useFormAction(
    (formData) => saveReminderAction(childId, formData),
    () => {
      toast.success("Pengingat disimpan.");
      router.refresh();
    },
  );

  const today = todayLocalISO();
  // Target yang sudah lewat tidak bisa dijadikan pengingat — mulai dari hari ini.
  const defaultDate = reminder?.remindOn ?? (targetDate < today ? today : targetDate);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon" aria-label={`Pengingat ${vaccineName}`}>
            <Icon name="alarm" filled={!!reminder} className="text-[16px]" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ingatkan Saya</DialogTitle>
          <DialogDescription>
            Pilih tanggal dan jam untuk vaksin {vaccineName}. Pengingat ini juga bisa dimasukkan ke
            aplikasi kalender di HP Anda.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4" noValidate>
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <input type="hidden" name="catalogKey" value={catalogKey} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="remindOn">Tanggal</Label>
              <DateField
                id="remindOn"
                name="remindOn"
                min={today}
                required
                defaultValue={values.remindOn ?? defaultDate}
                invalid={!!fields?.remindOn}
                describedBy={fields?.remindOn ? "remindOn-error" : undefined}
              />
              <FieldError id="remindOn-error" message={fields?.remindOn} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remindTime">Jam</Label>
              <TimeField
                id="remindTime"
                name="remindTime"
                required
                defaultValue={values.remindTime ?? (reminder ? hhmm(reminder.remindTime) : "09:00")}
                invalid={!!fields?.remindTime}
                describedBy={fields?.remindTime ? "remindTime-error" : undefined}
              />
              <FieldError id="remindTime-error" message={fields?.remindTime} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminderNotes">Catatan (opsional)</Label>
            <Input
              id="reminderNotes"
              name="notes"
              placeholder="mis. Posyandu RW 03"
              maxLength={200}
              defaultValue={values.notes ?? reminder?.notes ?? ""}
              aria-invalid={!!fields?.notes}
              aria-describedby={fields?.notes ? "reminderNotes-error" : undefined}
            />
            <FieldError id="reminderNotes-error" message={fields?.notes} />
          </div>

          <SubmitButton pendingLabel="Menyimpan...">
            {reminder ? "Simpan Perubahan" : "Simpan Pengingat"}
          </SubmitButton>
        </form>

        {reminder && (
          <div className="space-y-2 border-t pt-4">
            <p className="text-muted-foreground text-label-sm">
              Aplikasi ini mengirim notifikasi ke HP Anda pada jam tersebut, asalkan pemberitahuan
              sudah dinyalakan di halaman Notifikasi. Ingin masuk ke kalender juga? Tambahkan lewat
              salah satu tombol di bawah.
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="outline" asChild>
                <a
                  href={googleCalendarUrl({
                    title: `Vaksin ${vaccineName}`,
                    date: reminder.remindOn,
                    time: hhmm(reminder.remindTime),
                    durationMinutes: DURATION_MINUTES,
                    description: reminder.notes,
                    uid: `${reminder.id}@tumbuhkembang`,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="calendar_today" className="text-[16px]" />
                  Tambah ke Google Calendar
                </a>
              </Button>
              {/* Unduhan berkas nyata, bukan data: URL — iOS menolak data: untuk unduhan. */}
              <Button variant="outline" asChild>
                <a href={`/reminders/${reminder.id}`} download>
                  <Icon name="download" className="text-[16px]" />
                  Unduh .ics (Kalender lain)
                </a>
              </Button>
              <Button
                variant="ghost"
                disabled={deleting}
                onClick={() =>
                  startDelete(async () => {
                    const result = await deleteReminderAction(reminder.id);
                    if (result.success) {
                      toast.success("Pengingat dihapus.");
                      setOpen(false);
                      router.refresh();
                    } else {
                      toast.error(result.error.message);
                    }
                  })
                }
              >
                <Icon name="delete" className="text-[16px]" />
                {deleting ? "Menghapus..." : "Hapus Pengingat"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
