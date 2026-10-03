import type { IconName } from "@/components/ui/icon";

/**
 * Satu daftar menu superadmin, dipakai tiga tempat: nav di header admin, kartu di
 * dashboard admin, dan halaman placeholder `[section]`. Menambah modul = satu baris
 * di sini, bukan menyunting tiga berkas yang gampang keluar sinkron.
 *
 * `ready: false` berarti modulnya belum punya tabel/aturan apa pun. Rutenya tetap ada
 * dan menjelaskan apa yang akan dikelola — halaman dengan tabel kosong palsu lebih
 * menyesatkan daripada halaman yang mengakui belum ada datanya.
 */
export type AdminSection = {
  /** Segmen setelah /admin/ — jadi href dan kunci lookup. */
  slug: string;
  label: string;
  icon: IconName;
  description: string;
  ready: boolean;
};

/** Satu dropdown di nav, dan satu blok di dashboard admin. */
export type AdminGroup = { label: string; icon: IconName; sections: AdminSection[] };

/*
  Ikon diambil dari union IconName, bukan dari nama yang paling pas.

  Font ikonnya subset (public/fonts/material-symbols-subset.woff2), jadi
  `storefront`, `movie`, `payments`, dan `support_agent` tidak ada glyph-nya —
  nama yang tidak ada di subset akan tampil sebagai teks mentah, bukan ikon.
  Regenerate subset demi hiasan tidak sepadan; label tokonya selalu tertulis,
  jadi ikon di sini tidak pernah jadi satu-satunya penanda.
*/
export const ADMIN_GROUPS: AdminGroup[] = [
  {
    label: "Master Data",
    icon: "manage_accounts",
    sections: [
      {
        slug: "parents",
        label: "Orang Tua",
        icon: "person",
        description: "Lihat, ubah, dan hapus akun orang tua terdaftar",
        ready: true,
      },
      {
        slug: "children",
        label: "Anak",
        icon: "child_care",
        description: "Lihat, ubah, dan hapus profil anak terdaftar",
        ready: true,
      },
      {
        slug: "tarif",
        label: "Tarif Layanan",
        icon: "list_alt",
        description: "Atur tarif shop, nurse, dan baby sitter",
        ready: false,
      },
    ],
  },
  {
    label: "Tips & Trik",
    icon: "auto_awesome",
    sections: [
      {
        slug: "mpasi",
        label: "MPASI",
        icon: "nutrition",
        description: "Kelola resep dan panduan MPASI",
        ready: false,
      },
      {
        slug: "video-short",
        label: "Video Short",
        icon: "smartphone",
        description: "Kelola video pendek edukasi tumbuh kembang",
        ready: false,
      },
      {
        slug: "blog",
        label: "Blog",
        icon: "menu_book",
        description: "Tulis dan terbitkan artikel edukasi tumbuh kembang",
        ready: false,
      },
    ],
  },
  {
    label: "Layanan",
    icon: "apps",
    sections: [
      {
        slug: "shop",
        label: "Shop",
        icon: "card_giftcard",
        description: "Kelola produk katalog untuk ibu, bayi, dan anak",
        ready: true,
      },
      {
        slug: "nurse",
        label: "Nurse",
        icon: "medical_services",
        description: "Kelola data nurse dan jadwal kunjungannya",
        ready: false,
      },
      {
        slug: "babysitter",
        label: "Baby Sitter",
        icon: "face",
        description: "Kelola data baby sitter dan jadwalnya",
        ready: false,
      },
    ],
  },
];

/**
 * Berdiri sendiri di sebelah avatar, bukan di dalam dropdown: helpdesk adalah
 * jalan keluar saat yang lain membingungkan, jadi menyembunyikannya di balik satu
 * klik tambahan justru melawan gunanya.
 */
export const HELPDESK: AdminSection = {
  slug: "helpdesk",
  label: "Helpdesk",
  icon: "info",
  description: "Tangani pertanyaan dan keluhan pengguna",
  ready: false,
};

/** Daftar rata, diturunkan dari grup — bukan salinan kedua yang bisa keluar sinkron. */
export const ADMIN_SECTIONS: AdminSection[] = [
  ...ADMIN_GROUPS.flatMap((g) => g.sections),
  HELPDESK,
];

export const adminSection = (slug: string) => ADMIN_SECTIONS.find((s) => s.slug === slug);

export const adminHref = (s: AdminSection) => `/admin/${s.slug}`;
