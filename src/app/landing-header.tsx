"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className={`sticky top-0 z-30 border-b backdrop-blur-[40px] backdrop-saturate-180 supports-not-[backdrop-filter]:bg-white/95 ${scrolled ? "border-white/60 bg-white/40 shadow-[0_4px_16px_#0f172a0d] md:border-transparent md:bg-transparent md:shadow-none" : "border-white/60 bg-white/40 shadow-[0_4px_16px_#0f172a0d]"}`}>
      <div className={`mx-auto flex w-full max-w-[960px] items-center justify-between gap-2 px-4 py-3 md:w-[calc(100%-32px)] md:rounded-full md:px-6 ${scrolled ? "border border-transparent md:border-white/70 md:bg-white/55 md:shadow-[0_4px_16px_#0f172a1a] md:backdrop-blur-[40px] md:backdrop-saturate-180 supports-not-[backdrop-filter]:md:bg-white/95" : "border border-transparent"}`}>
        <Link href="/" className="flex min-w-0 items-center gap-2 font-extrabold tracking-tight focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005298]">
          <Image src="/brand-logo.png" alt="" width={45} height={38} priority className="h-9 w-auto" />
          <span className="text-sm sm:text-base">Tumbuh Kembang</span>
        </Link>
        <nav aria-label="Navigasi utama" className="hidden items-center gap-7 text-sm font-semibold text-slate-700 md:flex">
          <a href="#grafik" className="hover:text-[#005298] focus-visible:outline-2 focus-visible:outline-[#005298]">Grafik</a>
          <a href="#fitur" className="hover:text-[#005298] focus-visible:outline-2 focus-visible:outline-[#005298]">Fitur</a>
          <a href="#imunisasi" className="hover:text-[#005298] focus-visible:outline-2 focus-visible:outline-[#005298]">Imunisasi</a>
        </nav>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link href="/login" className="inline-flex min-h-11 items-center rounded-full px-2 text-xs font-semibold text-slate-700 hover:text-[#005298] focus-visible:outline-2 focus-visible:outline-[#005298] sm:px-4 sm:text-sm">Masuk</Link>
          <Link href="/register" className="inline-flex min-h-11 items-center rounded-full bg-slate-950 px-4 text-xs font-bold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 sm:px-5 sm:text-sm">Daftar gratis</Link>
        </div>
      </div>
    </header>
  );
}
