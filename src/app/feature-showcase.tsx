"use client";

import Image from "next/image";
import { useState } from "react";
import { BookOpen, CalendarDays, ChartNoAxesCombined, Clock3, Gift, ShoppingBag } from "lucide-react";

const highlights = [
  {
    title: "Grafik WHO & Fenton",
    subtitle: "Pantau pertumbuhan sesuai usia",
    description: "Ikuti berat, panjang badan, dan lingkar kepala. Referensi WHO tersedia sesuai usia; Fenton 2013 digunakan untuk bayi prematur selama usia pascamenstruasi berada dalam cakupan datanya.",
    note: "Referensi ditampilkan sesuai cakupan, bukan digabung dalam satu sumbu.",
    screenshot: "growth.webp",
    art: { src: "/landing/growth-baby.png", width: 390, height: 656 },
    alt: "Tampilan grafik WHO dengan titik pengukuran dari data contoh",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Usia kronologis & koreksi",
    subtitle: "Dua usia, satu pandangan jelas",
    description: "Lihat usia sejak lahir dan usia yang disesuaikan dengan tanggal perkiraan lahir. Keduanya tampil berdampingan pada beranda anak prematur.",
    note: "Usia koreksi tidak menggantikan tanggal lahir.",
    screenshot: "home.webp",
    art: { src: "/landing/premature.png", width: 317, height: 423 },
    alt: "Tampilan beranda data contoh dengan usia kronologis dan usia koreksi",
    icon: Clock3,
  },
  {
    title: "Jadwal imunisasi",
    subtitle: "Ingat jadwal vaksin si kecil",
    description: "Lihat jadwal vaksinasi, catat imunisasi yang diberikan, dan siapkan langkah berikutnya dengan pengingat.",
    note: "Jadwal dan riwayat tersimpan bersama catatan anak.",
    screenshot: "vaccine-schedule.webp",
    art: { src: "/landing/vaksin.webp", width: 200, height: 195 },
    alt: "Tampilan jadwal imunisasi anak dengan data contoh",
    icon: CalendarDays,
  },
  {
    title: "Tips imunisasi & MPASI",
    subtitle: "Bacaan untuk mendampingi keluarga",
    description: "Baca artikel seputar imunisasi, MPASI, nutrisi, dan perawatan untuk membantu menyiapkan pertanyaan saat konsultasi.",
    note: "Konten edukasi tidak menggantikan konsultasi medis.",
    art: { src: "/landing/prenant.png", width: 1254, height: 1254 },
    icon: BookOpen,
  },
  {
    title: "Wishlist kado",
    subtitle: "Bagikan kebutuhan si kecil",
    description: "Susun daftar kebutuhan anak dan bagikan tautannya kepada keluarga atau teman agar mereka bisa memilih kado.",
    note: "Daftar dapat dibuat sesuai kebutuhan keluarga.",
    icon: Gift,
  },
  {
    title: "Shop katalog",
    subtitle: "Temukan pilihan untuk keluarga",
    description: "Jelajahi katalog produk anak dan simpan pilihan favorit saat produk tersedia.",
    note: "Pilihan bergantung pada produk yang tersedia.",
    icon: ShoppingBag,
  },
];

export default function FeatureShowcase() {
  const [active, setActive] = useState(0);
  const feature = highlights[active];

  return (
    <section id="unggulan" className="scroll-mt-24 mx-auto max-w-[1120px]">
      <h2 className="text-center text-2xl leading-8 font-extrabold tracking-tight sm:text-3xl">Dirancang untuk hari-hari bersama si kecil.</h2>
      <p className="mt-3 text-center text-sm leading-6 text-slate-600 sm:text-base">Pilih fitur untuk melihat tampilannya. Tangkapan layar memakai data contoh.</p>
      <div className="mt-8 grid gap-5 lg:grid-cols-[0.7fr_1.3fr] lg:gap-10">
        <div role="tablist" aria-label="Detail fitur unggulan" aria-orientation="vertical" className="grid content-start gap-2">
          {highlights.map(({ title, subtitle, icon: ItemIcon }, index) => (
            <button
              key={title}
              id={`fitur-tab-${index}`}
              type="button"
              role="tab"
              aria-selected={active === index}
              aria-controls="fitur-panel"
              tabIndex={active === index ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={(event) => {
                if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
                event.preventDefault();
                const next = event.key === "Home" ? 0 : event.key === "End" ? highlights.length - 1 : (active + (event.key === "ArrowDown" ? 1 : -1) + highlights.length) % highlights.length;
                setActive(next);
                document.getElementById(`fitur-tab-${next}`)?.focus();
              }}
              className={`flex min-h-20 w-full cursor-pointer items-start gap-3 rounded-2xl px-4 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005298] ${active === index ? "bg-slate-100 text-[#005298]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <ItemIcon aria-hidden="true" className="mt-0.5 size-6 shrink-0" />
              <span className="min-w-0"><span className="block text-base font-bold">{title}</span><span className="mt-1 block text-sm leading-5 text-slate-500">{subtitle}</span></span>
            </button>
          ))}
        </div>
        <div id="fitur-panel" role="tabpanel" aria-labelledby={`fitur-tab-${active}`} tabIndex={0} className="flex min-w-0 flex-col overflow-hidden rounded-3xl bg-[#f3f8fd] p-5 focus-visible:outline-2 focus-visible:outline-[#005298] sm:p-8 lg:min-h-[580px]">
          <h3 className="text-xl font-extrabold text-[#005298] sm:text-2xl">{feature.title}</h3>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">{feature.description}</p>
          <p className="mt-3 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">{feature.note}</p>
          <div className="relative mt-6 flex min-h-64 flex-1 items-end justify-center gap-4 overflow-hidden sm:min-h-80 sm:gap-8">
            {feature.art && <Image src={feature.art.src} alt="" width={feature.art.width} height={feature.art.height} sizes="(max-width: 640px) 35vw, 220px" className="h-36 w-auto max-w-[38%] shrink-0 object-contain sm:h-52" />}
            {feature.screenshot && <Image src={`/landing/${feature.screenshot}`} alt={feature.alt} width={390} height={844} sizes="(max-width: 640px) 45vw, 280px" className="h-auto w-[48%] max-w-[260px] self-end rounded-t-3xl border-4 border-slate-800 border-b-0 bg-white shadow-xl" />}
          </div>
        </div>
      </div>
    </section>
  );
}
