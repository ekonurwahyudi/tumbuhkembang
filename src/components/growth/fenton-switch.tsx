import Link from "next/link";
import { referenceRange } from "@/lib/growth/engine";
import { formatWeeksDays } from "@/lib/growth/corrected-age";
import type { AgeBasis, Sex } from "@/lib/growth/types";
import { Icon } from "@/components/ui/icon";

/**
 * Penjelasan + saklar grafik Fenton, untuk orang tua, di atas grafiknya.
 *
 * Saklarnya sebuah tautan, bukan komponen berstate: pilihannya tinggal di URL
 * (`?fenton=off`), jadi ia bekerja tanpa JavaScript, bisa dibagikan apa adanya ke
 * tenaga kesehatan, dan tidak menambah komponen klien untuk satu boolean.
 * `role="switch"` + `aria-checked` membuat pembaca layar mengumumkannya sebagai
 * saklar, bukan tautan biasa.
 */

type Props = {
  /** Halaman yang sedang dibuka, tanpa query — saklar kembali ke sini. */
  basePath: string;
  useFenton: boolean;
  /** Sumbu yang benar-benar terpakai; "postmenstrual" berarti Fenton hidup sekarang. */
  ageBasis: AgeBasis;
  sex: Sex;
  gestationalAgeWeeks: number;
  gestationalAgeDays: number;
};

export function FentonSwitch({
  basePath,
  useFenton,
  ageBasis,
  sex,
  gestationalAgeWeeks,
  gestationalAgeDays,
}: Props) {
  const active = useFenton && ageBasis === "postmenstrual";
  const birthGa = formatWeeksDays(gestationalAgeWeeks * 7 + gestationalAgeDays);

  // Cakupan Fenton berbeda per indikator — kurva panjang badan keluar dari tepi
  // atas grafik sumbernya lebih awal daripada berat dan lingkar kepala. Batasnya
  // dibaca dari dataset, bukan diketik, supaya tidak berbohong bila datanya
  // didigitasi ulang.
  const limits = (["weight-for-age", "length-for-age", "head-circumference-for-age"] as const).map(
    (t) => Math.floor(referenceRange(t, sex, "postmenstrual").maxDay / 7),
  );
  const lo = Math.min(...limits);
  const hi = Math.max(...limits);
  const limitLabel = lo === hi ? `${lo} minggu` : `${lo}-${hi} minggu, berbeda per indikator`;

  return (
    <div className="border-border bg-card flex items-start gap-3 rounded-2xl border p-4 shadow-sm">
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-full ${
          active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon name={active ? "child_care" : "monitor_heart"} className="text-[20px]" />
      </span>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-body-md font-semibold">
          {active ? "Grafik Fenton untuk bayi kecil" : "Grafik WHO standar"}
        </p>
        <p className="text-muted-foreground text-label-sm">
          {active ? (
            <>
              Ananda lahir pada usia kehamilan {birthGa}, jadi pertumbuhannya dinilai dengan kurva
              Fenton — kurva khusus bayi prematur. Setelah usia pascamenstruasi {limitLabel}, grafik
              berpindah otomatis ke kurva WHO dengan usia terkoreksi.
            </>
          ) : useFenton ? (
            <>
              Ananda sudah melewati cakupan kurva Fenton, jadi grafik memakai kurva WHO dengan usia
              terkoreksi — sesuai usia kehamilan saat lahir, {birthGa}.
            </>
          ) : (
            <>
              Kurva Fenton dimatikan. Grafik memakai kurva WHO dengan usia terkoreksi; pengukuran
              sebelum ananda mencapai usia cukup bulan tidak dapat dinilai.
            </>
          )}
        </p>
      </div>

      {/* Status selalu tertulis di label, bukan hanya diwakili warna saklarnya. */}
      <Link
        href={useFenton ? `${basePath}?fenton=off` : basePath}
        replace
        scroll={false}
        role="switch"
        aria-checked={useFenton}
        aria-label="Pakai grafik Fenton"
        className="focus-visible:ring-ring flex shrink-0 flex-col items-center gap-1 focus-visible:ring-2 focus-visible:outline-none"
      >
        <span
          className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
            useFenton ? "bg-primary" : "bg-muted-foreground/40"
          }`}
        >
          <span
            className={`size-5 rounded-full bg-white shadow transition-transform ${
              useFenton ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </span>
        <span className="text-label-sm text-muted-foreground">
          {useFenton ? "Aktif" : "Nonaktif"}
        </span>
      </Link>
    </div>
  );
}
