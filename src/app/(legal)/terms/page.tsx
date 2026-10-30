import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT_WA } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: "Ketentuan penggunaan aplikasi Tumbuh Kembang untuk keluarga.",
};

export default function TermsPage() {
  return (
    <article className="space-y-9 text-base leading-8 text-slate-700">
      <header className="border-b border-slate-200 pb-8">
        <p className="text-sm font-bold text-[#005298]">INFORMASI LAYANAN</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Syarat & Ketentuan</h1>
        <p className="mt-3 text-sm text-slate-500">Terakhir diperbarui: 31 Oktober 2026</p>
      </header>
      <section>
        <h2 className="text-xl font-bold text-slate-950">Penggunaan layanan</h2>
        <p className="mt-3">Tumbuh Kembang membantu keluarga mencatat pertumbuhan anak, usia kronologis dan koreksi, asupan, imunisasi, serta mengakses artikel, wishlist kado, dan katalog. Dengan membuat akun atau memakai layanan, kamu setuju menggunakan fitur sesuai ketentuan ini dan hukum yang berlaku.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-slate-950">Akun dan tanggung jawab</h2>
        <p className="mt-3">Berikan informasi yang benar, jaga keamanan akunmu, dan batasi akses orang lain ke perangkatmu. Orang tua atau pengasuh yang memasukkan data anak bertanggung jawab memastikan mereka berwenang mengelola dan membagikan data tersebut. Bila kamu mengundang pasangan atau membagikan wishlist, periksa kembali siapa yang menerima akses atau tautan.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-slate-950">Catatan kesehatan bukan diagnosis</h2>
        <p className="mt-3">Grafik WHO dan Fenton, perhitungan usia koreksi, jadwal imunisasi, pengingat, serta artikel disediakan sebagai alat bantu pencatatan dan edukasi. Informasi ini tidak menggantikan pemeriksaan, diagnosis, atau saran tenaga kesehatan. Konsultasikan keputusan medis dan jadwal vaksin dengan tenaga kesehatan; segera cari pertolongan medis bila diperlukan.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-slate-950">Konten dan berbagi</h2>
        <p className="mt-3">Kamu bertanggung jawab atas data, foto, dan informasi yang kamu unggah. Kami memproses konten tersebut untuk menjalankan fitur yang kamu gunakan. Jangan mengunggah materi yang melanggar hak pihak lain, mengganggu layanan, atau mencoba mengakses data tanpa izin. Tautan wishlist yang kamu aktifkan dapat dilihat oleh siapa pun yang memiliki tautan, termasuk alamat pengiriman dan informasi rekening jika kamu memilih menampilkannya; hindari membagikannya kepada pihak yang tidak kamu kehendaki.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-slate-950">Ketersediaan dan perubahan</h2>
        <p className="mt-3">Fitur, konten edukasi, dan ketersediaan katalog dapat berubah. Kami berupaya menjaga layanan tetap tersedia dan data tetap aman, tetapi gangguan teknis dapat terjadi. Jika ketentuan berubah, versi terbaru dan tanggal pembaruannya akan ditampilkan di halaman ini.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-slate-950">Privasi dan kontak</h2>
        <p className="mt-3">Cara kami memproses data dijelaskan dalam <Link href="/privacy" className="font-semibold text-[#005298] underline underline-offset-4">Kebijakan Privasi</Link>. Untuk pertanyaan tentang ketentuan ini, hubungi kami melalui <a href={`https://wa.me/${SUPPORT_WA}`} className="font-semibold text-[#005298] underline underline-offset-4" target="_blank" rel="noopener noreferrer">WhatsApp dukungan</a>.</p>
      </section>
    </article>
  );
}
