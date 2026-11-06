"use client";

import Image from "next/image";
import { useState } from "react";
import { BookOpen, CalendarDays, ChartNoAxesCombined, Check, Clock3, Gift, ListChecks, ShoppingBag } from "lucide-react";

const highlights = [
  {
    title: "Grafik WHO & Fenton",
    subtitle: "Pantau pertumbuhan sesuai usia",
    description: "Setiap kali kamu menimbang dan mengukur si kecil, angkanya langsung masuk ke kurva pertumbuhan. Berat badan, panjang atau tinggi badan, dan lingkar kepala punya grafiknya sendiri, lengkap dengan rentang normal di sekitarnya, sehingga kamu bisa melihat arah pertumbuhan dari waktu ke waktu, bukan hanya angka hari ini.",
    points: [
      "Berat, panjang badan, dan lingkar kepala tersimpan dalam satu riwayat.",
      "Setiap pengukuran dilengkapi z-score dan persentil terakhir.",
      "Kurva Fenton 2013 dipakai untuk bayi prematur selama usia pascamenstruasi masih tercakup datanya.",
    ],
    note: "Referensi ditampilkan sesuai cakupan, bukan digabung dalam satu sumbu.",
    screenshot: { src: "/landing/Grafik-WHO.webp", width: 465, height: 957 },
    alt: "Tampilan grafik WHO dengan titik pengukuran dari data contoh",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Usia kronologis & koreksi",
    subtitle: "Dua usia, satu pandangan jelas",
    description: "Untuk bayi prematur, usia di kalender sering berbeda dengan usia yang dipakai menilai pertumbuhan. Beranda anak menampilkan keduanya berdampingan, jadi kamu tidak perlu menghitung ulang setiap kali mengisi catatan atau menyiapkan pertanyaan untuk tenaga kesehatan.",
    points: [
      "Usia kronologis dihitung sejak tanggal lahir si kecil.",
      "Usia koreksi mengikuti usia kehamilan saat lahir.",
      "Ringkasan pengukuran terakhir tampil di layar yang sama.",
    ],
    note: "Usia koreksi tidak menggantikan tanggal lahir.",
    screenshot: { src: "/landing/usia-kronologis.webp", width: 523, height: 1076 },
    alt: "Tampilan beranda data contoh dengan usia kronologis dan usia koreksi",
    icon: Clock3,
  },
  {
    title: "Jadwal imunisasi",
    subtitle: "Ingat jadwal vaksin si kecil",
    description: "Daftar vaksin tersusun rapi beserta status masing-masing, sehingga kamu tahu mana yang sudah diberikan dan mana yang menunggu giliran. Setelah imunisasi selesai, cukup catat tanggalnya dan daftar ikut diperbarui.",
    points: [
      "Status vaksin terbagi jelas: sudah, perlu diberikan, dan belum waktunya.",
      "Tanggal pemberian dicatat langsung dari daftar.",
      "Pengingat disiapkan untuk jadwal berikutnya.",
    ],
    note: "Jadwal dan riwayat tersimpan bersama catatan anak.",
    screenshot: { src: "/landing/vaksin-all.webp", width: 465, height: 957 },
    alt: "Tampilan jadwal imunisasi anak dengan data contoh",
    icon: CalendarDays,
  },
  {
    title: "Skrining perkembangan anak",
    subtitle: "Centang capaian sesuai usianya",
    description: "Kuesioner Pra Skrining Perkembangan (KPSP) membantu kamu mengamati capaian si kecil pada usia tertentu: gerak kasar, gerak halus, bicara dan bahasa, serta sosialisasi dan kemandirian. Pertanyaannya disalin apa adanya dari Buku Bagan SDIDTK Kemenkes RI, lengkap dengan contoh gambar untuk butir yang memerlukannya.",
    points: [
      "Formulir usia 3, 6, 9 bulan s/d 6 tahun dengan sepuluh pertanyaan masing-masing.",
      "Pertanyaan dikelompokkan per aspek perkembangan.",
      "Hasilnya terbaca langsung: sesuai, perlu stimulasi, atau perlu pemeriksaan lanjutan.",
    ],
    note: "Pra-skrining, bukan diagnosis; hasilnya tidak menggantikan pemeriksaan tenaga kesehatan.",
    screenshot: { src: "/landing/KPSP.webp", width: 432, height: 890 },
    alt: "Tampilan skrining perkembangan KPSP dengan data contoh",
    icon: ListChecks,
  },
  {
    title: "Tips imunisasi & MPASI",
    subtitle: "Bacaan untuk mendampingi keluarga",
    description: "Banyak pertanyaan muncul di luar jam praktik: kapan mulai MPASI, apa yang wajar setelah imunisasi, bagaimana membaca grafik pertumbuhan. Kumpulan artikel di dalam aplikasi membantu kamu menyiapkan jawaban sementara dan menyusun pertanyaan sebelum bertemu tenaga kesehatan.",
    points: [
      "Topik mencakup imunisasi, MPASI, nutrisi, dan perawatan harian.",
      "Artikel dapat dicari berdasarkan judul atau topik.",
      "Materi dirangkum dari rujukan lembaga kesehatan.",
    ],
    note: "Konten edukasi tidak menggantikan konsultasi medis.",
    screenshot: { src: "/landing/artikel.webp", width: 465, height: 957 },
    alt: "Tampilan daftar artikel tumbuh kembang dengan data contoh",
    icon: BookOpen,
  },
  {
    title: "Wishlist kado",
    subtitle: "Bagikan kebutuhan si kecil",
    description: "Saat keluarga dan teman bertanya si kecil butuh apa, kamu cukup membagikan satu tautan. Mereka melihat daftar kebutuhan yang kamu susun, memilih sendiri, lalu menandainya, sehingga kado tidak dobel dan kebutuhan yang benar-benar penting lebih cepat terpenuhi.",
    points: [
      "Tautan dibagikan lewat WhatsApp atau disalin manual.",
      "Status terdaftar, dihadiahi, dan menunggu terlihat sekaligus.",
      "Penerima tautan memilih kado tanpa perlu membuat akun.",
    ],
    note: "Daftar dapat dibuat sesuai kebutuhan keluarga.",
    screenshot: { src: "/landing/kado.webp", width: 465, height: 957 },
    alt: "Tampilan wishlist kado dengan data contoh",
    icon: Gift,
  },
  {
    title: "Shop katalog",
    subtitle: "Temukan pilihan untuk keluarga",
    description: "Katalog mengumpulkan perlengkapan anak dalam satu halaman dengan kategori seperti alat kesehatan, menyusui, dan nutrisi. Harga dan potongan tampil langsung pada kartu produk, jadi kamu bisa membandingkan dulu sebelum memutuskan.",
    points: [
      "Produk dikelompokkan per kategori kebutuhan anak.",
      "Harga dan potongan tampil pada setiap kartu.",
      "Pilihan favorit disimpan untuk dilihat kembali.",
    ],
    note: "Pilihan bergantung pada produk yang tersedia.",
    screenshot: { src: "/landing/shop.webp", width: 465, height: 957 },
    alt: "Tampilan katalog produk anak dengan data contoh",
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
        <div id="fitur-panel" role="tabpanel" aria-labelledby={`fitur-tab-${active}`} tabIndex={0} className="relative grid min-w-0 gap-6 overflow-hidden rounded-3xl bg-[#f3f8fd] p-5 focus-visible:outline-2 focus-visible:outline-[#005298] sm:p-8 lg:grid-cols-[1fr_0.95fr] lg:gap-6">
          <div className="min-w-0 self-start">
            <h3 className="text-xl font-extrabold text-[#005298] sm:text-2xl">{feature.title}</h3>
            <p className="mt-4 text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">{feature.description}</p>
            <ul className="mt-5 grid gap-3">
              {feature.points.map((point) => (
                <li key={point} className="flex gap-2.5 text-sm leading-6 text-slate-700">
                  <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#005298]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-5 text-slate-600 sm:text-sm">{feature.note}</p>
          </div>
          <div className="relative -mr-5 -mb-5 min-h-[25rem] lg:-mr-8 lg:-mb-8 lg:min-h-0">
            <Image src={feature.screenshot.src} alt={feature.alt} width={feature.screenshot.width} height={feature.screenshot.height} sizes="(max-width: 1024px) 80vw, 320px" className="absolute right-0 bottom-0 h-[110%] w-auto max-w-none origin-bottom-right translate-x-[12%] translate-y-[9%] -rotate-6 lg:h-[104%] drop-shadow-[0_18px_30px_#0f172a2e] lg:w-auto lg:max-w-[82%] lg:translate-y-[7%] xl:max-w-[92%]" />
          </div>
        </div>
      </div>
    </section>
  );
}
