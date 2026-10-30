import type { BlogCategory } from "../src/db/schema";

/**
 * Gambar sampul per kategori artikel, beserta lisensi dan halaman sumbernya.
 *
 * Lisensinya DICATAT di sini, bukan hanya URL-nya: tanpa catatan ini tidak ada yang
 * tahu gambar mana yang menuntut atribusi enam bulan dari sekarang. Jangan menambah
 * entri tanpa membuka halaman sumbernya dan memverifikasi lisensinya di sana —
 * nama berkas bukan bukti lisensi.
 *
 * Seluruh entri di bawah CC0 atau Public Domain (PD-USGov): tidak ada yang menuntut
 * atribusi, dan tidak ada yang share-alike. Kandidat CC BY-SA sengaja ditolak —
 * syarat share-alike-nya menular ke karya turunan, dan itu beban yang tidak sepadan
 * untuk sekadar gambar sampul.
 *
 * Kategori yang tidak ada di sini akan dilewati `seed-blog-covers.ts` — artikelnya
 * tetap tampil dengan petak kategori berwarna, bukan gambar yang salah.
 *
 * URL-nya memakai varian `/thumb/.../1280px-...` milik Wikimedia, bukan berkas
 * aslinya. Dua alasan, keduanya terukur: berkas asli beberapa di antaranya dijawab
 * 429 secara konsisten (diuji berulang, bukan dugaan), dan aslinya 1,7–2,4 MB
 * sementara varian 1280px cuma 0,1–0,3 MB — jauh lebih pantas untuk gambar sampul
 * yang dirender selebar kartu.
 */
export type CoverSource = {
  /** Tautan https LANGSUNG ke berkas gambarnya, bukan halaman deskripsinya. */
  url: string;
  license: string;
  /** Kosong untuk Public Domain / CC0 yang tidak menuntut atribusi. */
  attribution?: string;
  sourcePage: string;
};

export const COVER_SOURCES: Partial<Record<BlogCategory, CoverSource>> = {
  NUTRISI: {
    url: "https://upload.wikimedia.org/wikipedia/commons/9/9b/Baby_feeding_-_spoon_and_bowl.jpg",
    license: "CC0",
    // Tidak wajib, tapi dicatat sebagai kesopanan ke pembuatnya.
    attribution: "MAKY.OREL",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Baby_feeding_-_spoon_and_bowl.jpg",
  },
  TUMBUH_KEMBANG: {
    url: "https://upload.wikimedia.org/wikipedia/commons/0/0a/Follow_my_lead_%286623478%29.jpg",
    license: "Public Domain (PD-USGov)",
    attribution: "U.S. Air Force photo by Senior Airman Andrew J. Alvarado",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Follow_my_lead_(6623478).jpg",
  },
  IMUNISASI: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/A_nurse_at_Magogoni_PHCU_in_Zanzibar_vaccinates_a_baby_while_her_dad_holds_her._2018_Hannah_KoenkerVectorWorks._%2843928491301%29.jpg/1280px-A_nurse_at_Magogoni_PHCU_in_Zanzibar_vaccinates_a_baby_while_her_dad_holds_her._2018_Hannah_KoenkerVectorWorks._%2843928491301%29.jpg",
    license: "Public Domain (PD-USGov)",
    attribution: "President's Malaria Initiative / Hannah Koenker, VectorWorks",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:A_nurse_at_Magogoni_PHCU_in_Zanzibar_vaccinates_a_baby_while_her_dad_holds_her._2018_Hannah_KoenkerVectorWorks._(43928491301).jpg",
  },
  KESEHATAN: {
    url: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Stethoscope_A.jpg",
    license: "Public Domain (PD-USGov)",
    attribution: "U.S. Air Force",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Stethoscope_A.jpg",
  },
  PERAWATAN: {
    // Halaman berkasnya memasang "Personality rights warning": lisensi HAK CIPTANYA
    // tetap CC0, tapi orang di dalam foto punya hak atas citranya sendiri. Untuk
    // sampul artikel edukasi ini aman; jangan dipakai untuk iklan atau kemasan.
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Newborn_baby_sleeps_in_a_basket.jpg/1280px-Newborn_baby_sleeps_in_a_basket.jpg",
    license: "CC0 (lihat catatan personality rights di halaman sumber)",
    attribution: "Elizabeth, via Pixabay",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Newborn_baby_sleeps_in_a_basket.jpg",
  },
  IBU: {
    url: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Mothers_celebrate_breastfeeding_week_in_Sierra_Leone_%286189456718%29.jpg",
    license: "Public Domain (PD-USGov)",
    attribution: "USAID Africa Bureau",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:Mothers_celebrate_breastfeeding_week_in_Sierra_Leone_(6189456718).jpg",
  },
};
