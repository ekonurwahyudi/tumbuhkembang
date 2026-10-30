import type { ReactNode } from "react";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap" });

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${jakarta.className} min-h-dvh bg-[#fafcfe] text-slate-950`}>
      <header className="border-b border-slate-200/70 bg-white/80 px-4 py-4 backdrop-blur-xl sm:px-6">
        <nav aria-label="Navigasi halaman hukum" className="mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-4">
          <Link href="/" className="font-extrabold tracking-tight text-[#005298] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005298]">Tumbuh Kembang</Link>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-700">
            <Link href="/" className="hover:text-[#005298] focus-visible:outline-2 focus-visible:outline-[#005298]">Beranda</Link>
            <Link href="/terms" className="hover:text-[#005298] focus-visible:outline-2 focus-visible:outline-[#005298]">Ketentuan</Link>
            <Link href="/privacy" className="hover:text-[#005298] focus-visible:outline-2 focus-visible:outline-[#005298]">Privasi</Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-[800px] px-4 py-12 sm:px-6 sm:py-16">{children}</main>
      <footer className="border-t border-slate-200 px-4 py-8 text-sm text-slate-600 sm:px-6">
        <div className="mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} Tumbuh Kembang</span>
          <div className="flex flex-wrap gap-5">
            <Link href="/terms" className="hover:text-[#005298]">Syarat & Ketentuan</Link>
            <Link href="/privacy" className="hover:text-[#005298]">Kebijakan Privasi</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
