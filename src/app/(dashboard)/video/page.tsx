import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { interleave, shuffle } from "@/lib/video/feed";
import { VIDEO_TOPICS } from "@/schemas/video";
import { fetchYoutubeVideos, TOPIC_QUERIES } from "@/lib/video/youtube";
import { ShortsFeed } from "@/components/video/shorts-feed";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Video" };

/*
  Dirender ulang tiap permintaan. Wajib: urutan umpannya diacak di dalam komponen
  (lihat `shuffle` di bawah), dan hasil render yang di-cache akan membekukan satu
  urutan — pengacakannya jadi tidak pernah terasa sekalipun kodenya benar.

  Ini TIDAK menambah panggilan API: penarikan YouTube punya cache enam jamnya
  sendiri di `fetchYoutubeVideos`, jadi yang diulang tiap permintaan hanya penyusunan
  ulang daftar yang sudah ada di memori.
*/
export const dynamic = "force-dynamic";

/**
 * Umpan video pendek: buka, langsung menonton, geser atas-bawah. Tanpa pil kategori
 * dan tanpa daftar — bentuknya mengikuti Shorts/Reels, yang sudah jadi kebiasaan
 * orang dan tidak perlu dipelajari lagi.
 *
 * Topiknya tidak hilang, hanya tidak ditanya lebih dulu: hasil beberapa kata kunci
 * digabung berselang-seling (lihat `interleave`), jadi satu umpan berisi campuran
 * MPASI, tumbuh kembang, dan kesehatan.
 *
 * Ditarik langsung dari YouTube saat dirender — tidak ada tabel video di database.
 * Hasilnya di-cache 6 jam di memori proses supaya kuota API tidak habis oleh lalu
 * lintas biasa (lihat `fetchYoutubeVideos`).
 */
export default async function VideoPage() {
  await requireUser();

  /*
    Seluruh topik ditarik bersamaan, bukan berurutan: `Promise.all` membuat totalnya
    selama satu permintaan terlambat, bukan jumlah kesepuluhnya. Masing-masing punya
    entri cache sendiri, jadi penarikan berikutnya tidak menyentuh jaringan.

    12 per topik × 10 topik = sampai 120 kandidat; setelah duplikat antar-kata kunci
    dibuang, umpannya mendarat di sekitar seratus video.

    Kuota: tiap topik 101 unit per penarikan, cache enam jam → ~4.040 unit/hari dari
    kuota harian 10.000. Lihat catatan di `VIDEO_TOPICS` sebelum menambah topik lagi.
  */
  const results = await Promise.all(
    VIDEO_TOPICS.map((t) => fetchYoutubeVideos(TOPIC_QUERIES[t], 12)),
  );

  /*
    Diacak tiap render supaya umpannya terasa berbeda tiap dibuka — hasil penarikan
    di-cache enam jam, jadi tanpa ini video pertamanya selalu sama sepanjang pagi.

    `interleave` tetap dipanggil lebih dulu: ia yang membuang duplikat antar-kata
    kunci. Mengacak saja tidak menghilangkan video yang muncul dua kali.
  */
  const videos = shuffle(interleave(results.map((r) => (r.ok ? r.videos : []))));
  // Alasan dari penarikan pertama yang gagal — semuanya gagal karena sebab yang
  // sama (API key kosong, kuota habis), jadi satu sudah mewakili.
  const firstFailure = results.find((r) => !r.ok);
  const reason = firstFailure && !firstFailure.ok ? firstFailure.reason : null;

  if (videos.length === 0) return <VideoEmpty reason={reason} />;

  /*
    `fixed inset-0`, bukan mengalir di dalam <main>: umpan ini menuntut tinggi layar
    penuh, sementara layout dashboard memberi padding dan nav bawah setinggi 64px.
    Tanpa dilepas dari aliran itu, tiap slide "setinggi layar" justru terpotong nav.

    `z-30`: di bawah nav bawah (z-40) supaya nav tetap bisa diketuk untuk keluar.
  */
  return (
    <div className="fixed inset-0 z-30 bg-black">
      {/* Tanpa padding bawah untuk nav: videonya memang harus mengisi layar sampai
          tepi, seperti Shorts. Nav bawah (z-40) melayang DI ATASnya dan tetap bisa
          diketuk; keterangan video diberi jarak bawah supaya tidak tertutup nav. */}
      <ShortsFeed videos={videos} />

      {/* Tombol kembali melayang: tanpa header (disembunyikan di HP) dan dengan nav
          bawah yang tertutup umpan, ini satu-satunya jalan keluar yang terlihat. */}
      <Link
        href="/dashboard"
        aria-label="Kembali ke beranda"
        className="absolute top-[calc(env(safe-area-inset-top)+0.75rem)] left-3 z-10 grid size-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm"
      >
        <Icon name="arrow_back" className="text-[20px]" />
      </Link>
    </div>
  );
}

/** Dipisah supaya halaman utamanya tidak bercabang panjang. */
function VideoEmpty({ reason }: { reason: string | null }) {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <header className="min-w-0">
        <h1 className="text-headline-lg">Video</h1>
        <p className="text-muted-foreground text-body-sm mt-0.5">
          Video pendek seputar tumbuh kembang si kecil.
        </p>
      </header>

      <div className="bg-card flex flex-col items-center gap-3 rounded-2xl py-10 text-center shadow-sm">
        <span className="grid size-16 place-items-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-300">
          <Icon name="history_edu" filled className="text-[30px]" />
        </span>
        <div className="space-y-1">
          <h2 className="text-headline-sm">Video belum bisa dimuat.</h2>
          {/* Alasannya ditulis apa adanya: yang membuka halaman ini saat gagal hampir
              selalu pemiliknya sendiri, dan pesan samar membuatnya menebak-nebak. */}
          <p className="text-muted-foreground text-body-sm mx-auto max-w-xs">
            {reason ?? "Coba lagi beberapa saat lagi."}
          </p>
        </div>
      </div>
    </div>
  );
}
