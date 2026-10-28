"use client";

import { useEffect, useRef, useState } from "react";
import { embedUrl, watchUrl } from "@/schemas/video";
import { Icon } from "@/components/ui/icon";
import type { FetchedVideo } from "@/lib/video/youtube";

/**
 * Umpan video bergaya Shorts: satu video memenuhi layar, digeser atas-bawah.
 *
 * `snap-y snap-mandatory` + tiap slide `h-full snap-start`: perhentian gesernya
 * ditangani browser, bukan ditulis sendiri dengan listener scroll — momentum di iOS
 * dan Android sudah benar tanpa kode tambahan.
 *
 * HANYA slide yang sedang terlihat yang memuat `<iframe>`; tetangganya tetap
 * thumbnail. Dua belas iframe YouTube sekaligus menarik beberapa MB skrip pihak
 * ketiga — di kuota data orang tua itu mahal, dan di HP kelas menengah halamannya
 * tersendat. `IntersectionObserver` yang menentukan mana yang aktif, bukan indeks
 * yang dihitung dari posisi scroll: yang terakhir itu meleset tiap kali tinggi
 * viewport berubah (bilah alamat browser HP yang menyusut saat digeser).
 *
 * Videonya selalu diputar dari server YouTube lewat penyemat resmi — aplikasi ini
 * tidak pernah mengunduh atau menyimpan berkasnya.
 */
export function ShortsFeed({ videos }: { videos: FetchedVideo[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.idx);
          if (Number.isNaN(i)) continue;
          setActiveIdx(i);
        }
      },
      // 0.6: slide dianggap aktif saat sebagian besarnya terlihat, bukan saat ujungnya
      // baru menyembul — tanpa ambang ini video berganti di tengah geseran.
      { root, threshold: 0.6 },
    );

    for (const el of root.querySelectorAll("[data-idx]")) io.observe(el);
    return () => io.disconnect();
  }, [videos.length]);

  /**
   * Hanya slide aktif + satu tetangga di tiap sisi yang memasang `<iframe>`; sisanya
   * kembali jadi thumbnail dan iframe-nya DILEPAS dari DOM.
   *
   * Dulu memakai himpunan "pernah aktif" yang hanya bertambah: setelah melewati
   * sepuluh slide ada sebelas iframe hidup sekaligus, dan di daftar seratus video itu
   * berarti seratus pemutar YouTube menumpuk di satu halaman — cukup untuk membuat
   * HP kelas menengah tersendat dan menghabiskan kuota data.
   *
   * Tetangganya ikut dimuat supaya video berikutnya sudah siap saat digeser; tanpa itu
   * tiap geseran dijeda pemuatan pemutar dari nol.
   */
  const live = (i: number) => Math.abs(i - activeIdx) <= 1;

  return (
    <div
      ref={rootRef}
      className="no-scrollbar bg-background h-full snap-y snap-mandatory overflow-y-auto overscroll-contain"
    >
      {videos.map((v, i) => (
        <section
          key={v.sourceId}
          data-idx={i}
          className="relative h-full w-full shrink-0 snap-start snap-always"
          aria-label={`Video ${i + 1} dari ${videos.length}: ${v.title}`}
        >
          {/*
            Bingkai pemutar: setinggi layar, selebar layar, dipusatkan.

            TIDAK diperbesar-lalu-dipotong seperti sebelumnya. Umpan ini mencampur dua
            bentuk video: Shorts yang memang tegak 9:16, dan video biasa yang 16:9.
            Memaksa keduanya mengisi layar tegak berarti yang 16:9 kehilangan sebagian
            besar kiri-kanannya — pada video ceramah atau demo masak, yang terpotong
            justru orang dan bahannya.

            Jadi iframe-nya dibiarkan seukuran bingkai dan YouTube sendiri yang
            menyesuaikan isinya: video tegak mengisi penuh, video 16:9 menyisakan pita
            hitam di atas-bawah — sama persis dengan perilaku Shorts asli saat
            menampilkan video lanskap. Pita itu jauh lebih baik daripada subjek yang
            terpotong keluar bingkai.
          */}
          <div className="absolute inset-0 overflow-hidden bg-black">
            {live(i) ? (
              <iframe
                src={`${embedUrl("YOUTUBE", v.sourceId)}?autoplay=${i === activeIdx ? 1 : 0}&playsinline=1&rel=0&modestbranding=1&controls=0`}
                title={v.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 size-full border-0"
              />
            ) : v.thumbnailUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element -- thumbnail dari CDN YouTube, bukan aset lokal untuk next/image */
              <img
                src={v.thumbnailUrl}
                alt=""
                className="size-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className="grid size-full place-items-center text-white/40">
                <Icon name="history_edu" filled className="text-[40px]" />
              </span>
            )}
          </div>

          {/*
            Keterangan melayang di atas video, bukan di bawahnya: slide setinggi layar
            penuh tidak menyisakan ruang di luar bingkainya. Gradien gelap menjamin
            teks putihnya terbaca di atas thumbnail apa pun — kontras yang tidak
            bergantung pada gambar di belakangnya.
          */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pt-16"
            /* Jarak bawah setinggi nav melayang (64px + jaraknya + safe-area), supaya
               kredit kreator dan tombol "Buka di YouTube" tidak tertutup nav. */
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 6rem)" }}
          >
            <h2 className="text-body-md line-clamp-2 font-bold text-white">{v.title}</h2>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              {/* Kredit kreator selalu tertulis: videonya karya mereka. */}
              <span className="text-label-sm min-w-0 truncate text-white/80">
                {v.author ?? "—"}
              </span>
              <a
                href={watchUrl("YOUTUBE", v.sourceId)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-label-sm pointer-events-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 font-bold text-white backdrop-blur-sm"
              >
                Buka di YouTube
                <Icon name="arrow_forward" className="text-[14px]" />
              </a>
            </div>
          </div>

          {/* Petunjuk geser, hanya di slide pertama — setelah itu orang sudah paham.
              Ditaruh di BAWAH, bukan di atas: penyemat YouTube menggambar judul dan
              nama kanalnya sendiri di pita atas iframe, dan badge di sana bertumpuk
              dengan tulisan yang tidak bisa kita atur. */}
          {i === 0 && videos.length > 1 && (
            <span
              className="text-label-sm pointer-events-none absolute inset-x-0 mx-auto w-fit rounded-full bg-black/60 px-3 py-1.5 font-bold text-white/90 backdrop-blur-sm"
              style={{ bottom: "calc(env(safe-area-inset-bottom) + 11rem)" }}
            >
              Geser ke atas untuk video berikutnya
            </span>
          )}
        </section>
      ))}
    </div>
  );
}
