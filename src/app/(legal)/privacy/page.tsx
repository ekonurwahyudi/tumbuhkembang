import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT_WA } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Informasi tentang pengelolaan data keluarga dan anak di Tumbuh Kembang.",
};

export default function PrivacyPage() {
  return (
    <article className="space-y-9 text-base leading-8 text-slate-700">
      <header className="border-b border-slate-200 pb-8">
        <p className="text-sm font-bold text-[#005298]">INFORMASI LAYANAN</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Kebijakan Privasi</h1>
        <p className="mt-3 text-sm text-slate-500">Terakhir diperbarui: 31 Oktober 2026</p>
      </header>
      <section>
        <h2 className="text-xl font-bold text-slate-950">Data yang kami kelola</h2>
        <p className="mt-3">Saat kamu membuat akun, kami menyimpan nama, alamat email, serta informasi autentikasi. Jika masuk lewat Google, layanan autentikasi tersebut membantu menghubungkan akunmu. Data yang kamu masukkan dapat mencakup profil dan foto anak, tanggal lahir, riwayat kehamilan prematur, pengukuran pertumbuhan, catatan asupan, imunisasi, pengingat, dan wishlist kado. Bila kamu mengaktifkan fitur terkait, kami juga menyimpan data undangan pasangan, alamat pengiriman, informasi rekening yang kamu pilih untuk dibagikan, dan langganan notifikasi perangkat.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-slate-950">Tujuan penggunaan</h2>
        <p className="mt-3">Kami menggunakan data untuk mengelola akun, menampilkan riwayat pertumbuhan serta usia koreksi, menyiapkan jadwal dan pengingat imunisasi, memproses fitur wishlist dan berbagi, serta menanggapi permintaan bantuan. Informasi anak diperlukan untuk menjalankan fitur pencatatan yang kamu gunakan; hindari memasukkan data yang tidak diperlukan.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-slate-950">Akses dan berbagi</h2>
        <p className="mt-3">Catatan anak dapat diakses pemilik akun, pasangan yang menerima undangan akses, dan pengelola yang berwenang untuk administrasi layanan. Saat berbagi wishlist diaktifkan, siapa pun yang memiliki tautannya dapat melihat item yang dipublikasikan, nama dan foto anak serta usia yang dihitung bila terkait item, dan alamat pengiriman. Informasi rekening tampil jika kamu memilih untuk membagikannya. Periksa informasi tersebut sebelum menyebarkan tautan. Foto pada halaman publik dapat tersimpan di cache browser atau pihak lain setelah berbagi dinonaktifkan.</p>
        <p className="mt-3">Penyedia infrastruktur memproses data untuk menjalankan aplikasi, termasuk penyimpanan data dan foto, autentikasi Google jika kamu memilihnya, serta layanan push perangkat jika notifikasi diaktifkan. Saat membuka video, tautan toko, atau WhatsApp dukungan, layanan pihak tersebut dapat memproses informasi sesuai kebijakannya.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-slate-950">Keamanan dan penyimpanan</h2>
        <p className="mt-3">Kami membatasi akses catatan anak berdasarkan akun dan menyajikan foto pribadi melalui jalur yang memeriksa izin akses. Kata sandi akun yang didaftarkan melalui email disimpan dalam bentuk hash, bukan teks asli. Kami menyimpan data selama diperlukan untuk menjalankan akun dan fitur yang kamu gunakan atau selama diperlukan untuk memenuhi kewajiban yang berlaku. Tidak ada sistem daring yang bebas dari risiko keamanan.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-slate-950">Pilihan dan permintaanmu</h2>
        <p className="mt-3">Kamu dapat memperbarui sebagian data melalui aplikasi, menghapus catatan tertentu, dan menonaktifkan berbagi wishlist atau notifikasi perangkat. Untuk bantuan mengakses, memperbaiki, atau meminta penghapusan data dan akun, hubungi <a href={`https://wa.me/${SUPPORT_WA}`} className="font-semibold text-[#005298] underline underline-offset-4" target="_blank" rel="noopener noreferrer">WhatsApp dukungan</a>. Aplikasi belum menyediakan tombol hapus akun mandiri. Kami dapat meminta verifikasi identitas sebelum menindaklanjuti permintaan demi melindungi data anak. Penghapusan catatan akun tidak selalu langsung menghapus salinan pada cache publik atau berkas unggahan yang masih tersimpan di penyimpanan layanan; hubungi dukungan bila kamu perlu menindaklanjuti berkas tertentu.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-slate-950">Perubahan kebijakan</h2>
        <p className="mt-3">Jika cara kami mengelola data berubah, versi terbaru dan tanggal pembaruannya akan ditampilkan di halaman ini. Baca juga <Link href="/terms" className="font-semibold text-[#005298] underline underline-offset-4">Syarat & Ketentuan</Link> untuk ketentuan penggunaan layanan.</p>
      </section>
    </article>
  );
}
