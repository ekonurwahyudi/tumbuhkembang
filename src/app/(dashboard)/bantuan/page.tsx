import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { greetingNow, waLink } from "@/lib/whatsapp";
import { WhatsAppGlyph } from "@/components/brand-glyphs";
import { Icon, type IconName } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Bantuan" };

/**
 * Bantuan & Dukungan. Tidak ada formulir, tidak ada tabel tiket, tidak ada tabel
 * pesan di basis data: setiap kartu adalah tautan WhatsApp berisi kalimat pembuka
 * yang sudah diketik, dan percakapannya hidup di WhatsApp.
 *
 * Itu pilihan sadar — kotak masuk yang harus dijawab orang sungguhan tidak akan
 * terbaca kalau ia hanya tabel di aplikasi ini.
 */
const TOPICS: {
  icon: IconName;
  tone: string;
  title: string;
  description: string;
  /** Lanjutan kalimat setelah sapaan; sengaja menggantung agar diteruskan sendiri. */
  message: string;
}[] = [
  // Ikonnya dipilih dari subset font yang sudah ada — `help` dan `bug_report` akan
  // menuntut subset woff2-nya dibuat ulang, dan tidak ada yang bertambah jelas dari itu.
  {
    icon: "info",
    tone: "bg-accent text-primary",
    title: "Tanya Apa Saja",
    description: "Punya pertanyaan seputar pemakaian aplikasi? Kami siap membantu.",
    message: "saya mau bertanya tentang ",
  },
  {
    icon: "edit_note",
    tone: "bg-[var(--color-status-normal)]/15 text-[var(--color-status-normal-text)]",
    title: "Berikan Masukan",
    description: "Masukan kamu membantu kami berkembang. Ceritakan pendapatmu.",
    message: "saya mau memberi masukan tentang ",
  },
  {
    icon: "auto_awesome",
    tone: "bg-[var(--color-butter-pastel)] text-[var(--color-on-butter)]",
    title: "Minta Fitur Baru",
    description: "Punya ide fitur baru? Kami ingin mendengar saranmu.",
    message: "saya mau request fitur baru, yaitu ",
  },
  {
    icon: "alarm",
    tone: "bg-destructive/10 text-destructive",
    title: "Laporkan Masalah",
    description: "Menemukan sesuatu yang tidak berfungsi? Bantu kami memperbaikinya.",
    message: "saya menemukan masalah, yaitu ",
  },
];

export default async function BantuanPage() {
  // Halaman ini tidak memakai datanya; `requireUser` yang menjaganya tetap di balik sesi.
  await requireUser();

  // Dihitung sekali di server: keempat kartu memakai sapaan yang sama.
  const hello = greetingNow();

  return (
    <div className="flex flex-col gap-7 pt-2">
      <header>
        <h1 className="text-headline-lg">Bantuan &amp; Dukungan</h1>
        <p className="text-muted-foreground text-body-sm mt-2">
          Kami siap membantu kamu memakai aplikasi ini semaksimalnya.
        </p>
      </header>

      {/* Kartu kontak di atas daftar topik: orang yang sudah tahu mau bertanya apa
          tidak perlu membaca empat kartu dulu untuk menemukan jalan ke WhatsApp. */}
      <section
        aria-labelledby="kontak"
        className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-[var(--color-butter-bright)] to-[var(--color-butter-pastel)]/60 p-5 text-[var(--color-on-butter)] shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <span className="bg-card/70 text-label-sm inline-flex items-center rounded-full px-3 py-1 font-bold tracking-wide uppercase">
            Bantuan
          </span>
          <h2 id="kontak" className="text-headline-lg mt-3">
            Ada kendala?
          </h2>
          <p className="text-body-md mt-1.5 opacity-80">
            Tim kami akan membantu kamu secepat mungkin.
          </p>
        </div>

        <a
          href={waLink("saya butuh bantuan.", hello)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-body-md bg-foreground text-background flex h-12 shrink-0 items-center justify-center gap-2.5 rounded-full px-5 font-bold shadow-sm transition-transform active:scale-[0.98]"
        >
          {/* Hijau mereknya dipakai di sini dan hanya di sini: di atas tombol gelap
              ia terbaca, dan logo itulah yang mengabarkan tujuannya sebelum teksnya. */}
          <WhatsAppGlyph className="size-[22px] text-[#25D366]" />
          Hubungi Kami
          <span className="sr-only">(membuka WhatsApp)</span>
        </a>
        {/*
          Email sengaja belum ada: tombol yang membuka pengarang surat ke alamat yang
          tidak dibaca siapa pun lebih buruk daripada tombol yang absen. Tambahkan di
          sini begitu alamatnya ditentukan.
        */}
      </section>

      <section className="space-y-3.5" aria-labelledby="topik">
        <h2 id="topik" className="text-headline-sm">
          Ada yang bisa kami bantu?
        </h2>

        {TOPICS.map((t) => (
          <a
            key={t.title}
            href={waLink(t.message, hello)}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card hover:border-primary/40 flex items-start gap-3.5 rounded-2xl border p-4 shadow-sm transition-transform active:scale-[0.99]"
          >
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${t.tone}`}>
              <Icon name={t.icon} filled className="text-[22px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-headline-sm block">{t.title}</span>
              <span className="text-muted-foreground text-body-sm mt-1.5 block leading-relaxed">
                {t.description}
              </span>
            </span>
            {/*
              Setiap kartu membuka WhatsApp, bukan halaman di dalam aplikasi. Ikonnya
              menyebutkan itu sebelum diketuk — begitu pula `sr-only` di bawah, karena
              ikon di sini dekoratif dan tidak terbaca pembaca layar.
            */}
            <Icon name="link" className="text-muted-foreground mt-1 text-[18px]" />
            <span className="sr-only">(membuka WhatsApp)</span>
          </a>
        ))}
      </section>
    </div>
  );
}
