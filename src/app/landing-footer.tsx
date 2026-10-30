import Link from "next/link";
import { SUPPORT_WA } from "@/lib/whatsapp";

export default function LandingFooter() {
  return (
    <footer className="rounded-t-[2rem] bg-black px-4 pb-10 pt-14 text-slate-400 lg:px-6 lg:pt-20">
      <div className="mx-auto grid max-w-[1200px] gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-12">
        <div className="max-w-md">
          <h2 className="max-w-xs text-2xl leading-snug font-bold tracking-tight text-white sm:text-3xl">Temani tumbuh kembang si kecil.</h2>
          <p className="mt-5 text-sm leading-7">Catat pertumbuhan, pantau usia koreksi, dan siapkan jadwal imunisasi dalam satu tempat untuk keluarga.</p>
        </div>
        <nav aria-label="Halaman utama footer" className="flex flex-col items-start gap-4 text-sm">
          <h3 className="mb-1 text-base font-semibold text-white">Halaman Utama</h3>
          <Link href="/" className="hover:text-white focus-visible:outline-2 focus-visible:outline-white">Beranda</Link>
          <Link href="/#fitur" className="hover:text-white focus-visible:outline-2 focus-visible:outline-white">Fitur</Link>
          <Link href="/#unggulan" className="hover:text-white focus-visible:outline-2 focus-visible:outline-white">Detail Fitur</Link>
        </nav>
        <nav aria-label="Informasi footer" className="flex flex-col items-start gap-4 text-sm">
          <h3 className="mb-1 text-base font-semibold text-white">Informasi</h3>
          <Link href="/terms" className="hover:text-white focus-visible:outline-2 focus-visible:outline-white">Syarat & Ketentuan</Link>
          <Link href="/privacy" className="hover:text-white focus-visible:outline-2 focus-visible:outline-white">Kebijakan Privasi</Link>
        </nav>
        <div className="flex flex-col items-start gap-4 text-sm">
          <h3 className="mb-1 text-base font-semibold text-white">Kontak</h3>
          <a href={`https://wa.me/${SUPPORT_WA}`} target="_blank" rel="noopener noreferrer" className="hover:text-white focus-visible:outline-2 focus-visible:outline-white">WhatsApp: 0812-1555-423 <span className="sr-only">(membuka WhatsApp)</span></a>
          {/* <Link href="/login" className="hover:text-white focus-visible:outline-2 focus-visible:outline-white">Masuk ke aplikasi</Link>
          <Link href="/register" className="hover:text-white focus-visible:outline-2 focus-visible:outline-white">Daftar gratis</Link> */}
        </div>
      </div>
      {/* <div aria-hidden="true" className="mx-auto mt-16 max-w-[1200px] select-none overflow-hidden text-center text-[clamp(3.2rem,11vw,9rem)] leading-none font-extrabold tracking-[-0.07em] text-white/15">Tumbuh Kembang</div> */}
      <div className="mx-auto mt-10 flex max-w-[1200px] flex-wrap justify-between gap-3 border-t border-white/15 pt-6 text-xs"><span>© {new Date().getFullYear()} Tumbuh Kembang</span><span>Catatan keluarga, bukan pengganti tenaga kesehatan.</span></div>
    </footer>
  );
}
