import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import {
  ArrowRight,
  ChartNoAxesCombined,
  Clock3,
  HeartHandshake,
  ShieldCheck,
  Syringe,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { SUPPORT_WA } from "@/lib/whatsapp";
import FeatureShowcase from "./feature-showcase";
import LandingHeader from "./landing-header";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Pantau tumbuh kembang si kecil lebih tenang",
  description:
    "Catat pertumbuhan dengan referensi WHO atau Fenton, usia koreksi prematur, imunisasi, artikel, wishlist kado, dan katalog dalam satu tempat.",
};

const features = [
  {
    icon: ChartNoAxesCombined,
    title: "Catat tumbuh kembang",
    description: "Simpan pengukuran berat, panjang badan, dan lingkar kepala. Lihat riwayatnya pada grafik yang sesuai.",
    art: { src: "/landing/growth-baby.png", width: 390, height: 656 },
    color: "bg-[#ddf5e4] text-emerald-900",
  },
  {
    icon: Syringe,
    title: "Jadwal imunisasi",
    description: "Lihat jadwal vaksin, tandai yang sudah diberikan, dan dapatkan pengingat untuk jadwal berikutnya.",
    art: { src: "/landing/vaksin.webp", width: 200, height: 195 },
    color: "bg-[#d7e8fb] text-sky-900",
  },
  {
    icon: Clock3,
    title: "Usia bayi prematur",
    description: "Usia kronologis dan usia koreksi tersedia berdampingan agar lebih mudah dibaca.",
    art: { src: "/landing/premature.png", width: 317, height: 423 },
    color: "bg-[#fbe0e3] text-rose-900",
  },
  {
    icon: HeartHandshake,
    title: "Rawat bersama",
    description: "Catat asupan, bagikan akses dengan pasangan, dan temukan bacaan seputar perawatan si kecil.",
    art: { src: "/landing/prenant.png", width: 1254, height: 1254 },
    color: "bg-[#fdf0cd] text-amber-900",
  },
];

export default async function RootPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  return (
    <div className={`${jakarta.className} min-h-dvh overflow-x-clip bg-[#fafcfe] text-slate-950 zoom-[1.1]`}>
      <a href="#konten" className="sr-only rounded-lg bg-white px-4 py-3 focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50">Lewati navigasi</a>
      <LandingHeader />

      <main id="konten" className="relative">
        <section className="relative isolate mx-auto max-w-[1200px] px-4 pb-12 pt-12 text-center sm:pt-16 lg:px-6">
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 overflow-hidden">
            <div className="absolute top-0 -left-[8%] h-[620px] w-[38%] rounded-full bg-[#9ece58]/20 blur-[48px] sm:w-[30%]" />
            <div className="absolute top-0 -right-[8%] h-[620px] w-[38%] rounded-full bg-[#93e4f1]/30 blur-[48px] sm:w-[30%]" />
            <svg className="absolute inset-0 h-full w-full text-[#005298]/8" viewBox="0 0 1200 900" fill="none" preserveAspectRatio="xMidYMin slice" xmlns="http://www.w3.org/2000/svg">
              <path d="M-210 175C-50 105 55 205 140 155S245 15 340 50" stroke="currentColor" strokeWidth="45" strokeLinecap="round" />
              <path d="M1120-110C930 15 965 145 1140 112S1310 195 1120 300 1180 475 1320 430" stroke="currentColor" strokeWidth="36" strokeLinecap="round" />
              <path d="M-130 620C50 485 155 495 210 615S265 790 365 755" stroke="currentColor" strokeWidth="28" strokeLinecap="round" />
            </svg>
          </div>
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm sm:text-sm">
            <span className="rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-bold text-white">BARU</span>
            Skrining Perkembang IDAI
          </p>
          <h1 className="mx-auto mt-8 max-w-[680px] text-[2.25rem] leading-[1.16] font-extrabold tracking-[-0.035em] sm:text-5xl sm:leading-[1.14]">Pantau tumbuh kembang si kecil <span className="text-[#005298]">lebih tenang.</span></h1>
          <p className="mx-auto mt-5 max-w-[580px] text-base leading-7 text-slate-600">Catatan pertumbuhan, usia koreksi bayi prematur, dan jadwal imunisasi dalam satu tempat yang mudah dijangkau.</p>
          <div className="mx-auto mt-8 grid max-w-[330px] gap-3 sm:flex sm:max-w-none sm:justify-center">
            <Link href="/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-8 text-sm font-bold text-white shadow-sm hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950">Mulai pantau gratis <ArrowRight aria-hidden="true" className="size-4" /></Link>
            <a href="#fitur" className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-sm font-semibold text-slate-800 hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005298]">Jelajahi fitur</a>
          </div>
          {/* <p className="mt-5 text-sm text-slate-500">Gratis untuk mulai mencatat satu anak</p> */}
          <div className="relative mx-auto mt-10 flex min-h-[510px] w-full max-w-[760px] items-start justify-center sm:min-h-[640px]">
            <Image src="/landing/home-Hero.png" alt="Mockup ponsel Tumbuh Kembang dengan usia kronologis, usia koreksi, dan catatan pertumbuhan data contoh" width={523} height={1076} priority sizes="(max-width: 640px) 58vw, 280px" className="relative z-10 w-[min(58vw,280px)] drop-shadow-[0_20px_26px_#0f172a30]" />
            <Image src="/landing/tumbuh.png" alt="Kartu pertumbuhan data contoh: pengukuran terakhir dan kisaran asupan susu" width={850} height={856} sizes="(max-width: 640px) 40vw, 220px" className="absolute top-20 right-0 z-20 w-[40%] max-w-[160px] rounded-2xl border border-sky-100 bg-white shadow-[0_12px_30px_#0f172a1a] motion-safe:animate-[hero-float_6s_ease-in-out_infinite] sm:top-28 sm:right-3 sm:max-w-[220px]" />
            <Image src="/landing/grafik.png" alt="Grafik WHO data contoh: berat badan menurut usia dan titik pengukuran" width={848} height={1234} sizes="(max-width: 640px) 42vw, 190px" className="absolute top-56 left-0 z-20 w-[42%] max-w-[165px] rounded-2xl border border-emerald-100 bg-white shadow-[0_12px_30px_#0f172a1a] motion-safe:animate-[hero-float_7s_ease-in-out_infinite_reverse] sm:top-72 sm:left-2 sm:max-w-[190px]" />
          </div>
        </section>

        <div className="mx-auto max-w-[1200px] space-y-16 px-4 pb-20 sm:space-y-20 lg:px-6">
          <section id="fitur" className="scroll-mt-6">
            <div className="mx-auto max-w-[640px] text-center"><h2 className="mt-2 text-2xl leading-8 font-extrabold tracking-tight sm:text-3xl">Semua yang kamu butuhkan.</h2><p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Dari catatan harian sampai jadwal penting, tersusun dalam satu tempat.</p></div>
            {/* <p className="mt-5 text-sm font-medium text-slate-600 sm:hidden">Geser kartu untuk melihat fitur lainnya →</p> */}
            <div role="region" aria-label="Kartu fitur, geser ke samping untuk melihat semuanya" tabIndex={0} className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-3 scroll-px-4 focus-visible:outline-2 focus-visible:outline-[#005298] sm:mx-0 sm:mt-6 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, description, art, color }) => (
                <article key={title} className={`flex w-[82%] max-w-[300px] shrink-0 snap-start flex-col rounded-3xl p-5 sm:w-auto sm:max-w-none ${color}`}>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950"><Icon aria-hidden="true" className="size-6 shrink-0" />{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700 pb-4">{description}</p>
                  <div className="relative mt-auto self-end pt-6 after:absolute after:bottom-1 after:left-1/2 after:h-2 after:w-20 after:-translate-x-1/2 after:rounded-full after:bg-slate-950/20 after:blur-sm">
                    <Image src={art.src} alt="" width={art.width} height={art.height} sizes="(max-width: 640px) 30vw, 120px" className="relative z-10 h-24 w-auto object-contain sm:h-30" />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <FeatureShowcase />

          <aside className="mx-auto flex max-w-[760px] gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600"><ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#005298]" /> Tumbuh Kembang membantu mencatat dan memantau. Aplikasi ini tidak menggantikan konsultasi atau penilaian tenaga kesehatan.</aside>

          <section className="mx-auto max-w-[760px] rounded-3xl bg-slate-950 px-5 py-10 text-center text-white sm:px-10">
            <h2 className="text-2xl leading-8 font-extrabold sm:text-3xl">Mulai pantau tumbuh kembang hari ini.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-300">Catat perjalanan si kecil, satu langkah pada satu waktu.</p>
            <Link href="/register" className="mt-6 inline-flex min-h-12 w-full max-w-[320px] items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-slate-950 hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Daftar gratis <ArrowRight aria-hidden="true" className="size-4" /></Link>
          </section>
        </div>
      </main>
      <footer className="rounded-t-[2rem] bg-black px-4 pb-10 pt-14 text-slate-400 lg:px-6 lg:pt-20">
        <div className="mx-auto grid max-w-[1200px] gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-12">
          <div className="max-w-md">
            <h2 className="max-w-xs text-2xl leading-snug font-bold tracking-tight text-white sm:text-3xl">Temani tumbuh kembang si kecil.</h2>
            <p className="mt-5 text-sm leading-7">Catat pertumbuhan, pantau usia koreksi, dan siapkan jadwal imunisasi dalam satu tempat untuk keluarga.</p>
          </div>
          <nav aria-label="Halaman utama footer" className="flex flex-col items-start gap-4 text-sm">
            <h3 className="mb-1 text-base font-semibold text-white">Halaman Utama</h3>
            <a href="#konten" className="hover:text-white focus-visible:outline-2 focus-visible:outline-white">Beranda</a>
            <a href="#fitur" className="hover:text-white focus-visible:outline-2 focus-visible:outline-white">Fitur</a>
            <a href="#unggulan" className="hover:text-white focus-visible:outline-2 focus-visible:outline-white">Detail Fitur</a>
          </nav>
          <nav aria-label="Informasi footer" className="flex flex-col items-start gap-4 text-sm">
            <h3 className="mb-1 text-base font-semibold text-white">Informasi</h3>
            <Link href="/terms" className="hover:text-white focus-visible:outline-2 focus-visible:outline-white">Syarat & Ketentuan</Link>
            <Link href="/privacy" className="hover:text-white focus-visible:outline-2 focus-visible:outline-white">Kebijakan Privasi</Link>
          </nav>
          <div className="flex flex-col items-start gap-4 text-sm">
            <h3 className="mb-1 text-base font-semibold text-white">Kontak</h3>
            <a href={`https://wa.me/${SUPPORT_WA}`} target="_blank" rel="noopener noreferrer" className="hover:text-white focus-visible:outline-2 focus-visible:outline-white">WhatsApp: 0812-1555-423 <span className="sr-only">(membuka WhatsApp)</span></a>
            <Link href="/login" className="hover:text-white focus-visible:outline-2 focus-visible:outline-white">Masuk ke aplikasi</Link>
            <Link href="/register" className="hover:text-white focus-visible:outline-2 focus-visible:outline-white">Daftar gratis</Link>
          </div>
        </div>
        <div aria-hidden="true" className="mx-auto mt-16 max-w-[1200px] select-none overflow-hidden text-center text-[clamp(3.2rem,11vw,9rem)] leading-none font-extrabold tracking-[-0.07em] text-white/15">Tumbuh Kembang</div>
        <div className="mx-auto mt-10 flex max-w-[1200px] flex-wrap justify-between gap-3 border-t border-white/15 pt-6 text-xs"><span>© {new Date().getFullYear()} Tumbuh Kembang</span><span>Catatan keluarga, bukan pengganti tenaga kesehatan.</span></div>
      </footer>
    </div>
  );
}
