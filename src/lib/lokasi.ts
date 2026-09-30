import "server-only";
import raw from "@/data/lokasi.json";

/**
 * Daftar kecamatan Indonesia: 7215 baris berbentuk
 * "KECAMATAN, KABUPATEN/KOTA, PROVINSI".
 *
 * `server-only` menjaga yang penting: berkasnya 376 KB dan TIDAK pernah ikut ke
 * bundle klien. Yang menyeberang hanya paling banyak `LIMIT` hasil per pencarian,
 * lewat `searchLokasiAction`.
 *
 * Diurai sekali per proses (module scope), bukan per permintaan.
 */
export type Lokasi = { district: string; city: string; province: string };

const LIMIT = 12;
/** Tiga huruf: di bawah itu hasilnya ribuan baris dan tidak menolong siapa pun. */
export const MIN_QUERY = 3;

const rows: Lokasi[] = (raw as string[]).flatMap((line) => {
  const [district, city, province] = line.split(", ");
  return district && city && province ? [{ district, city, province }] : [];
});

/** Pencarian substring pada baris utuh, jadi "demak" maupun "wedung" sama-sama kena. */
export function searchLokasi(query: string): Lokasi[] {
  const q = query.trim().toUpperCase();
  if (q.length < MIN_QUERY) return [];

  const out: Lokasi[] = [];
  for (const r of rows) {
    if (`${r.district}, ${r.city}, ${r.province}`.includes(q)) {
      out.push(r);
      if (out.length === LIMIT) break;
    }
  }
  return out;
}
