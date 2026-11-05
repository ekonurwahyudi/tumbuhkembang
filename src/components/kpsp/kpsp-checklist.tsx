"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { saveKpspAnswerAction } from "@/lib/actions/kpsp";
import { KPSP_CATEGORIES, KPSP_SOURCE, type KpspForm } from "@/lib/kpsp/catalog";
import { Icon } from "@/components/ui/icon";

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

      {/* Ringkasan hasil. aria-live supaya skor dan statusnya diumumkan saat centang berubah. */}
      <div className={`mt-5 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:gap-4 ${verdict.box}`} aria-live="polite">
        <span className={`grid size-14 shrink-0 place-items-center rounded-full text-base font-bold ${verdict.badge}`}>
          {yes}/{total}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            Hasil Skrining Usia {form.ageMonths} Bulan:
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${verdict.chip}`}>{verdict.label}</span>
          </p>
          <p className="text-muted-foreground mt-1 text-sm">{verdict.advice}</p>
        </div>
        <p className="text-muted-foreground shrink-0 text-xs sm:text-right">
          Standar Evaluasi
          <a href={KPSP_SOURCE} target="_blank" rel="noopener noreferrer"
            className="text-primary mt-0.5 block text-sm font-semibold underline underline-offset-2">
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
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{category}</h3>
            <ul className="mt-2.5 space-y-2.5">
              {questions.map((q) => {
                const checked = values[q.key];
                const inputId = `kpsp-${form.ageMonths}-${q.key}`;
                return (
                  /* Tercentang = hijau: warnanya mengulang arti "tercapai" yang sudah
                     dipakai di seluruh aplikasi. Bukan satu-satunya penanda — kotaknya
                     ikut tercentang dan terbaca oleh pembaca layar.

                     Yang belum dicentang memakai `--rule`, BUKAN `border-border`:
                     `--border` sengaja transparan di aplikasi ini (lihat globals.css),
                     jadi `border-border` tidak menggambar apa pun. `--rule` adalah token
                     untuk garis yang memang harus terlihat. */
                  <li key={q.key} className={`rounded-xl border-2 transition-colors ${checked ? "border-emerald-500 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-500/10" : "border-[var(--rule)]"}`}>
                    <label htmlFor={inputId} className="flex cursor-pointer items-start gap-3 p-4">
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={checked}
                        disabled={pending && busyKey !== q.key}
                        onChange={(e) => toggle(q.key, e.target.checked)}
                        /* `--rule` lagi, sebab alasan yang sama: kotak centang kosong
                           tanpa garis tidak terbaca sebagai tempat yang bisa diketuk. */
                        className="focus-visible:ring-ring mt-0.5 size-5 shrink-0 cursor-pointer rounded border-[var(--rule)] text-emerald-600 accent-current focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
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
