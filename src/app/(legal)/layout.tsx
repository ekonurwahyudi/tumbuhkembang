import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import LandingFooter from "../landing-footer";
import LandingHeader from "../landing-header";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap" });

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${jakarta.className} min-h-dvh overflow-x-clip bg-[#fafcfe] text-slate-950 zoom-[1.1]`}>
      <a href="#konten" className="sr-only rounded-lg bg-white px-4 py-3 focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50">Lewati navigasi</a>
      <LandingHeader />
      <main id="konten" className="mx-auto max-w-[800px] px-4 py-12 sm:px-6 sm:py-16">{children}</main>
      <LandingFooter />
    </div>
  );
}
