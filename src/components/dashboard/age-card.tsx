import {
  chronologicalAge,
  formatAgeDaysDetailed,
  formatAgeDetailed,
  nextMilestone,
} from "@/lib/growth/age";
import { correctedAge } from "@/lib/growth/corrected-age";
import { Icon, type IconName } from "@/components/ui/icon";

/**
 * Kartu usia di beranda. Menggantikan band satu baris yang dulu: angkanya kecil
 * dan dua jenis usia terbaca seperti satu kalimat panjang.
 *
 * Yang berubah secara sengaja:
 * - Satuan dipisah dari angkanya, jadi "8" terbaca dulu lalu "Bulan" — bukan
 *   sebaris teks yang harus dibaca seluruhnya.
 * - Usia koreksi jadi ubin sejajar, bukan baris kedua. Untuk anak prematur ia
 *   justru angka yang dipakai grafik WHO, jadi tidak lagi tampak sebagai catatan.
 * - Hitung mundur ulang bulan: satu hal yang bergerak tiap hari, itu yang membuat
 *   kartunya terasa hidup tanpa menambah data baru.
 *
 * Warna di sini hiasan: tiap angka punya label tertulis, dan tidak ada status
 * medis yang disampaikan lewat warna (aturan yang sama dengan GrowthHighlight).
 */

/** Angka besar + satuannya, dipakai dua ubin yang sejajar. */
function AgeTile({
  icon,
  label,
  age,
  caption,
  accent,
}: {
  icon: IconName;
  label: string;
  age: string;
  caption: string;
  /** Ubin koreksi memakai nuansa berbeda supaya tidak tertukar dengan kronologis. */
  accent?: boolean;
}) {
  // "8 Bulan 14 Hari" → angka pertama dibesarkan, sisanya mengikuti di bawahnya.
  const [head, ...rest] = age.split(" ");

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-3 ${
        accent
          ? "bg-violet-50 text-violet-950 dark:bg-violet-500/15 dark:text-violet-50"
          : "bg-sky-50 text-sky-950 dark:bg-sky-500/15 dark:text-sky-50"
      }`}
    >
      {/* Lingkaran dekoratif, bahasa yang sama dengan ChildHero. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-5 -right-5 size-16 rounded-full bg-white/40 dark:bg-white/5"
      />
      <p className="text-label-sm relative flex items-center gap-1 font-bold opacity-80">
        <Icon name={icon} filled className="text-[14px]" />
        {label}
      </p>
      <p className="relative mt-1.5 flex items-baseline gap-1">
        <span className="text-[26px] leading-7 font-bold tabular-nums">{head}</span>
        <span className="text-body-sm font-semibold opacity-80">{rest.join(" ")}</span>
      </p>
      <p className="text-label-sm relative mt-0.5 opacity-70">{caption}</p>
    </div>
  );
}

export function AgeCard({
  name,
  child,
}: {
  name: string;
  child: {
    dateOfBirth: string;
    birthType: "TERM" | "PRETERM";
    gestationalAgeWeeks: number | null;
    gestationalAgeDays: number | null;
  };
}) {
  const chrono = chronologicalAge(child.dateOfBirth);
  const milestone = nextMilestone(child.dateOfBirth);

  const ga =
    child.birthType === "PRETERM" &&
    child.gestationalAgeWeeks !== null &&
    child.gestationalAgeDays !== null
      ? {
          gestationalAgeWeeks: child.gestationalAgeWeeks,
          gestationalAgeDays: child.gestationalAgeDays,
        }
      : null;
  const correction = ga ? correctedAge({ dateOfBirth: child.dateOfBirth, ...ga }) : null;
  const corrected = correction?.applicable ? formatAgeDaysDetailed(correction.days) : null;

  return (
    <section
      className="bg-card space-y-3 rounded-2xl p-4 shadow-sm"
      aria-labelledby="usia-si-kecil"
    >
      <div className="flex items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300">
          <Icon name="auto_awesome" filled className="text-[16px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="usia-si-kecil" className="text-headline-sm truncate">
            Usia {name}
          </h2>
        </div>
      </div>

      {/* Satu kolom bila tidak ada usia koreksi: ubin tunggal setengah lebar
          terbaca seperti ada ubin yang gagal dimuat di sebelahnya. */}
      <div className={`grid gap-2.5 ${corrected ? "grid-cols-2" : "grid-cols-1"}`}>
        <AgeTile
          icon="calendar_today"
          label="USIA KRONOLOGIS"
          age={formatAgeDetailed(chrono)}
          caption="Sejak tanggal lahir"
        />
        {corrected && (
          <AgeTile
            accent
            icon="history"
            label="USIA KOREKSI"
            age={corrected}
            caption={`Lahir ${ga!.gestationalAgeWeeks} mgg ${ga!.gestationalAgeDays} hr`}
          />
        )}
      </div>

      {/* Hitung mundur: angkanya tertulis, jadi bar-nya boleh murni hiasan. */}
      {/* <div className="bg-muted rounded-xl p-3">
        <div className="text-body-sm flex items-center justify-between gap-2 font-semibold">
          <span className="truncate">{milestone.label}</span>
          <span className="text-muted-foreground shrink-0 tabular-nums">
            {milestone.daysLeft === 0 ? "Hari ini! 🎉" : `${milestone.daysLeft} hari lagi`}
          </span>
        </div>
        <div aria-hidden className="bg-rule mt-2 h-1.5 overflow-hidden rounded-full">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-400"
            style={{ width: `${milestone.percent}%` }}
          />
        </div>
      </div> */}

      {corrected && (
        <p className="text-muted-foreground text-label-sm">
          Grafik WHO memakai usia koreksi selama si kecil punya riwayat prematur.
        </p>
      )}
    </section>
  );
}
