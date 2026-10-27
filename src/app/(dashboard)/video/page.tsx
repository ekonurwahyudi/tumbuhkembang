import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { interleave } from "@/lib/video/feed";
import { fetchYoutubeVideos, TOPIC_QUERIES } from "@/lib/video/youtube";
import { ShortsFeed } from "@/components/video/shorts-feed";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Video" };

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
    Empat kata kunci ditarik bersamaan, bukan berurutan: `Promise.all` membuat
    totalnya selama satu permintaan terlambat, bukan jumlah keempatnya. Semuanya
    terpisah di cache, jadi penarikan berikutnya tidak menyentuh jaringan sama sekali.

    OTHER sengaja dilewati — kata kuncinya ("perawatan bayi") terlalu dekat dengan
    tiga lainnya dan hasilnya banyak bertumpuk.
  */
  const results = await Promise.all(
    (["MPASI", "GROWTH", "HEALTH", "PARENTING"] as const).map((t) =>
      fetchYoutubeVideos(TOPIC_QUERIES[t], 8),
    ),
  );

  const videos = interleave(results.map((r) => (r.ok ? r.videos : [])));
  // Alasan dari penarikan pertama yang gagal — keempatnya gagal karena sebab yang
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
