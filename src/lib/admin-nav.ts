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

export const ADMIN_SECTIONS: AdminSection[] = [
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
    slug: "blog",
    label: "Blog",
    icon: "menu_book",
    description: "Tulis dan terbitkan artikel edukasi tumbuh kembang",
    ready: false,
  },
  {
    slug: "marketplace",
    label: "Marketplace",
    icon: "apps",
    description: "Kelola produk dan penjual di marketplace",
    ready: false,
  },
  {
    slug: "subscriptions",
    label: "Harga Langganan",
    icon: "card_giftcard",
    description: "Atur paket dan harga langganan aplikasi",
    ready: false,
  },
  {
    slug: "nurses",
    label: "Nurse",
    icon: "medical_services",
    description: "Kelola data nurse dan jadwal kunjungannya",
    ready: false,
  },
];

export const adminSection = (slug: string) => ADMIN_SECTIONS.find((s) => s.slug === slug);

export const adminHref = (s: AdminSection) => `/admin/${s.slug}`;
