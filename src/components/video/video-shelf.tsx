"use client";

import { useState } from "react";
import { ShortsFeed } from "./shorts-feed";
import { Icon } from "@/components/ui/icon";
import type { FetchedVideo } from "@/lib/video/youtube";

/**
 * Rak video pendek: deret thumbnail yang digeser kiri-kanan, TANPA memutar apa pun.
 *
 * Tidak ada satu pun `<iframe>` sampai orang mengetuk salah satunya. Itu intinya:
 * sepuluh penyemat YouTube di halaman daftar artikel berarti beberapa MB skrip
 * pihak ketiga yang terunduh meski tidak ada yang menonton — mahal di kuota data
 * orang tua dan membuat halamannya tersendat di HP kelas menengah.
 *
 * Ketukan membuka `ShortsFeed` — komponen yang SAMA dengan halaman /video, bukan
 * salinan: pemutaran, perhentian geser, dan aturan "hanya slide aktif yang memasang
 * iframe" tetap satu tempat. Yang diubah di sini cuma urutan awalnya, supaya video
 * yang diketuk itulah yang pertama tampil.
 */
export function VideoShelf({ videos }: { videos: FetchedVideo[] }) {
  const [openAt, setOpenAt] = useState<number | null>(null);

  if (videos.length === 0) return null;

  // Daftar diputar mulai dari yang diketuk, bukan dipotong: video sebelumnya pindah
  // ke belakang, jadi geseran ke bawah tetap punya isi sampai habis.
  const ordered =
    openAt === null ? videos : [...videos.slice(openAt), ...videos.slice(0, openAt)];

  return (
    <>
      <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {videos.map((v, i) => (
          <li key={v.sourceId} className="w-[132px] shrink-0 sm:w-[150px]">
            <button
              type="button"
              onClick={() => setOpenAt(i)}
              className="group block w-full text-left"
              aria-label={`Putar video: ${v.title}`}
            >
              {/* 9:16 — bentuk Shorts, jadi raknya sudah menyiratkan isinya. */}
              <span className="bg-muted relative block aspect-[9/16] w-full overflow-hidden rounded-2xl shadow-sm">
                {v.thumbnailUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- thumbnail dari CDN YouTube, bukan aset lokal untuk next/image */
                  <img
                    src={v.thumbnailUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.04]"
                  />
                ) : (
                  <span className="grid size-full place-items-center bg-slate-800 text-white/40">
                    <Icon name="smartphone" filled className="text-[28px]" />
                  </span>
                )}

                {/* Gradien + tombol putar: penanda bahwa ini video, bukan gambar. */}
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
                />
                <span
                  aria-hidden
                  className="absolute top-1/2 left-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 backdrop-blur-sm"
                >
                  <Icon name="arrow_forward" filled className="text-[18px] text-white" />
                </span>

                <span className="text-label-sm absolute inset-x-0 bottom-0 line-clamp-2 p-2 font-bold text-white">
                  {v.title}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {openAt !== null && (
        /*
          Layar penuh, di atas segalanya. `fixed inset-0` + `z-50`: umpan Shorts
          menuntut tinggi penuh, dan menaruhnya di aliran halaman berarti ia ikut
          tergulung bersama artikel di bawahnya.
        */
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pemutar video pendek"
          className="fixed inset-0 z-50 bg-black"
        >
          <ShortsFeed videos={ordered} />

          <button
            type="button"
            onClick={() => setOpenAt(null)}
            aria-label="Tutup video"
            className="absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm"
            style={{ top: "calc(env(safe-area-inset-top) + 0.75rem)" }}
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>
      )}
    </>
  );
}
