"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { saveKpspAnswerAction } from "@/lib/actions/kpsp";
import { KPSP_CATEGORIES, KPSP_SOURCE, type KpspCategory, type KpspForm } from "@/lib/kpsp/catalog";
import { Icon, type IconName } from "@/components/ui/icon";

/**
 * Keping ikon per kategori perkembangan. Nama ikon diambil dari union `IconName`,
 * bukan dari yang paling pas maknanya: font ikonnya subset
 * (public/fonts/material-symbols-subset.woff2), dan nama di luar subset akan tampil
 * sebagai teks mentah. Yang paling pas (`directions_run`, `pan_tool`, `chat_bubble`)
 * tidak ada di subset, jadi dipakai padanan terdekat yang ada; regenerasi subset
 * bila ingin ikon yang lebih tepat. Ikonnya murni pembeda tempat — nama kategorinya
 * selalu tertulis di sebelahnya, jadi tidak ada makna yang hilang bila ikonnya
 * tidak terbaca.
 */
const CATEGORY_STYLE: Record<KpspCategory, { icon: IconName; tone: string }> = {
  "Gerak kasar": {
    icon: "height",
    tone: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  },
  "Gerak halus": {
    icon: "edit",
    tone: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  },
  "Bicara dan bahasa": {
    icon: "menu_book",
    tone: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  },
  "Sosialisasi dan kemandirian": {
    icon: "family_restroom",
    tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
};

/**
 * Checklist KPSP: satu kotak centang per butir, bukan sepasang tombol Ya/Tidak.
 * Tercentang = "Ya"; tidak tercentang = belum tercapai. Bedanya dengan versi
 * sebelumnya: tidak ada keadaan "belum dijawab" yang terpisah, jadi hasilnya
 * selalu bisa dibaca — persis seperti kartu skrining yang diminta.
 */
export function KpspChecklist({ childId, name, form, ages, answers, preterm }: {
  childId: string;
  name: string;
  form: KpspForm;
  /** Usia formulir yang dibuka aplikasi, untuk tab di kanan atas. */
  ages: readonly number[];
  answers: { questionKey: string; answer: boolean }[];
  /** Anak lahir prematur — KPSP dipakai dengan usia koreksi sampai 24 bulan. */
  preterm: boolean;
}) {
  const [values, setValues] = useState<Record<string, boolean>>(
    Object.fromEntries(form.questions.map((q) => [q.key, answers.find((a) => a.questionKey === q.key)?.answer ?? false])),
  );
  const [pending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const total = form.questions.length;
  const yes = form.questions.filter((q) => values[q.key]).length;
  const verdict = kpspVerdict(yes, total);

  function toggle(key: string, next: boolean) {
    if (pending) return;
    setBusyKey(key);
    // Optimistis: centang langsung terlihat, dikembalikan bila server menolak.
    setValues((current) => ({ ...current, [key]: next }));
    startTransition(async () => {
      const response = await saveKpspAnswerAction(childId, form.ageMonths, key, next);
      if (!response.success) {
        setValues((current) => ({ ...current, [key]: !next }));
        toast.error(response.error.message);
      }
      setBusyKey(null);
    });
  }

  return (
    <section className="bg-card rounded-2xl p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-headline-sm flex items-center gap-2">
            <span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-full">
              <Icon name="psychology" filled className="text-[18px]" />
            </span>
            Skrining Perkembangan KPSP
          </h2>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Kuesioner Pra Skrining Perkembangan berkala untuk deteksi dini tumbuh kembang anak.
          </p>
        </div>

        {/* Tab usia. Tetap tautan, bukan tombol: setiap usia punya URL sendiri,
            jadi bisa dibagikan dan tombol kembali bekerja. */}
        <nav aria-label="Usia formulir KPSP" className="bg-muted flex shrink-0 gap-1 self-start rounded-full p-1">
          {ages.map((age) => (
            <Link key={age} href={`?usia=${age}`} aria-current={age === form.ageMonths ? "page" : undefined}
              className={`inline-flex min-h-9 items-center rounded-full px-3 text-sm font-medium transition-colors sm:px-4 ${
                age === form.ageMonths ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              Usia {age} Bulan
            </Link>
          ))}
        </nav>
      </div>

      {/* Ringkasan hasil. aria-live supaya skor dan statusnya diumumkan saat centang berubah.

          Dua bentuk, satu isi:
          - Layar kecil: skor | (judul di atas status). Saran dan sumber turun ke bawah,
            keduanya kalimat penuh yang tidak muat di samping.
          - Desktop (sm+): skor | (judul + status sebaris, saran di bawahnya) | sumber.
            Saran ikut masuk kolom tengah supaya lebarnya terbatas dan tidak melintang
            sampai ke bawah keping skor. */}
      <div className={`mt-5 rounded-xl border p-4 ${verdict.box}`} aria-live="polite">
        <div className="flex items-center gap-3 sm:items-start sm:gap-4">
          <span className={`grid size-14 shrink-0 place-items-center rounded-full text-base font-bold ${verdict.badge} sm:self-center`}>
            {yes}/{total}
          </span>
          <div className="min-w-0 flex-1">
            <div className="sm:flex sm:flex-wrap sm:items-center sm:gap-2">
              <p className="text-sm font-semibold">
                Hasil Skrining Usia {form.ageMonths} Bulan<span className="hidden sm:inline">:</span>
              </p>
              <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold sm:mt-0 ${verdict.chip}`}>
                {verdict.label}
              </span>
            </div>
            {/* Saran: di bawah kartu pada layar kecil, di dalam kolom ini pada desktop. */}
            <p className="text-muted-foreground mt-1 hidden text-sm sm:block">{verdict.advice}</p>
          </div>
          <p className="text-muted-foreground hidden shrink-0 self-center text-right text-xs sm:block">
            Standar Evaluasi
            <a href={KPSP_SOURCE} target="_blank" rel="noopener noreferrer"
              className="text-primary mt-0.5 block text-sm font-semibold underline underline-offset-2">
              Buku Bagan SDIDTK Kemenkes RI 2022
            </a>
          </p>
        </div>
        <p className="text-muted-foreground mt-3 text-sm sm:hidden">{verdict.advice}</p>
        <p className="text-muted-foreground mt-2 text-xs sm:hidden">
          Standar Evaluasi:{" "}
          <a href={KPSP_SOURCE} target="_blank" rel="noopener noreferrer"
            className="text-primary font-semibold underline underline-offset-2">
            Buku Bagan SDIDTK Kemenkes RI 2022
          </a>
        </p>
      </div>

      {/* Progress bar ikut jumlah centang, bukan jumlah butir yang sudah disentuh:
          itu angka yang sama dengan skor di atas, jadi keduanya tidak pernah beda. */}
      <div className="bg-muted mt-4 h-2 overflow-hidden rounded-full" role="progressbar" aria-label={`Capaian skrining usia ${form.ageMonths} bulan`}
        aria-valuenow={yes} aria-valuemin={0} aria-valuemax={total}>
        <div className={`h-full rounded-full transition-[width] ${verdict.bar}`} style={{ width: `${(yes / total) * 100}%` }} />
      </div>

      {/* Catatan usia koreksi. Ditampilkan ke semua orang, bukan hanya pemilik anak
          prematur: ini aturan pemakaian KPSP, dan orang tua anak cukup bulan pun
          perlu tahu kenapa usia temannya dihitung lain. Kalimatnya menegas untuk
          anak yang memang prematur. */}
      <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
        <Icon name="info" aria-hidden="true" className="mt-px shrink-0 text-[14px]" />
        <span>
          {preterm
            ? `${name} lahir prematur, jadi pakai usia koreksi — bukan usia sejak lahir — saat memilih formulir dan memantau tumbuh kembangnya, sampai usia 24 bulan.`
            : "Bila bayi lahir prematur, gunakan usia koreksi untuk memantau tumbuh kembangnya, sampai usia 24 bulan."}
        </span>
      </p>

      {KPSP_CATEGORIES.map((category) => {
        const questions = form.questions.filter((q) => q.category === category);
        if (!questions.length) return null;
        return (
          <div key={category} className="mt-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${CATEGORY_STYLE[category].tone}`}>
                <Icon name={CATEGORY_STYLE[category].icon} filled className="text-[16px]" />
              </span>
              {category}
            </h3>
            <ul className="mt-2.5 space-y-2.5">
              {questions.map((q) => {
                const checked = values[q.key];
                const inputId = `kpsp-${form.ageMonths}-${q.key}`;
                return (
                  /* Tercentang = hijau: warnanya mengulang arti "tercapai" yang sudah
                     dipakai di seluruh aplikasi. Bukan satu-satunya penanda — kotaknya
                     ikut tercentang dan terbaca oleh pembaca layar.

                     Yang belum dicentang memakai `border-border` biasa. */
                  <li key={q.key} className={`rounded-xl border-2 transition-colors ${checked ? "border-emerald-500 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-500/10" : "border-border"}`}>
                    <label htmlFor={inputId} className="flex cursor-pointer items-start gap-3 p-4">
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={checked}
                        disabled={pending && busyKey !== q.key}
                        onChange={(e) => toggle(q.key, e.target.checked)}
                        className="border-border focus-visible:ring-ring mt-0.5 size-5 shrink-0 cursor-pointer rounded text-emerald-600 accent-current focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm leading-relaxed font-medium sm:text-[15px]">{q.text}</span>
                        {q.illustration && !q.figure && (
                          <span className="text-muted-foreground mt-1 block text-xs">
                            Butir ini memakai contoh gambar pada halaman {q.sourcePage} sumber.
                          </span>
                        )}
                      </span>
                    </label>

                    {q.figure && (
                      <figure className="px-4 pb-4 pl-12">
                        {/* Latar putih tetap di mode gelap: gambarnya garis hitam di atas putih. */}
                        <Image src={q.figure.src} alt={`Contoh gambar untuk pertanyaan ${q.key} usia ${form.ageMonths} bulan`}
                          width={q.figure.width} height={q.figure.height}
                          className="h-auto w-full max-w-[240px] rounded-lg bg-white p-2" />
                        <figcaption className="text-muted-foreground mt-1 text-xs">
                          <a href={`${KPSP_SOURCE}#page=${q.sourcePage}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                            Buku Bagan SDIDTK halaman {q.sourcePage}
                          </a>
                        </figcaption>
                      </figure>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <p className="text-muted-foreground mt-6 text-xs leading-relaxed">
        Pra-skrining untuk {name}, bukan diagnosis klinis. Centang hanya bila anak benar-benar
        melakukannya sesuai petunjuk dan contoh gambar pada sumber.
      </p>
    </section>
  );
}

/**
 * Ambang resmi KPSP dinyatakan untuk 10 pertanyaan: 9–10 sesuai, 7–8 meragukan,
 * ≤6 kemungkinan penyimpangan. Dihitung proporsional agar tetap benar bila suatu
 * saat sebuah formulir ditampilkan tidak utuh.
 */
function kpspVerdict(yes: number, total: number) {
  const ratio = total ? yes / total : 0;
  if (ratio >= 0.9)
    return {
      label: "Sesuai Perkembangan",
      advice: "Lanjutkan stimulasi sesuai usia dan pemeriksaan berkala.",
      box: "border-primary/30 bg-primary/5",
      badge: "bg-primary/15 text-primary",
      chip: "bg-primary/15 text-primary",
      bar: "bg-primary",
    };
  if (ratio >= 0.7)
    return {
      label: "Perlu Stimulasi Tambahan",
      advice: "Lakukan stimulasi lebih sering, lalu evaluasi ulang bersama tenaga kesehatan dalam 2 minggu.",
      box: "border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
      chip: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
      bar: "bg-amber-500",
    };
  return {
    label: "Perlu Pemeriksaan Lanjutan",
    advice: "Temui dokter atau tenaga kesehatan untuk evaluasi dan rujukan tumbuh kembang.",
    box: "border-rose-300 bg-rose-50 dark:border-rose-500/40 dark:bg-rose-500/10",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
    chip: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
    bar: "bg-rose-500",
  };
}
