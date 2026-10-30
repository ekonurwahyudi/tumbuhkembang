/**
 * Pasang gambar sampul untuk artikel hasil seed.
 *
 * Satu gambar per KATEGORI, bukan per artikel: lima belas gambar berlisensi bebas
 * yang benar-benar cocok per topik jauh lebih sulit dicari daripada enam, dan
 * sampul yang keliru lebih buruk daripada sampul yang seragam.
 *
 * Dua pagar supaya skrip ini tidak pernah menimpa karya orang: hanya slug yang ada
 * di `BLOG_SEED` yang disentuh, dan artikel yang sudah punya sampul dilewati.
 *
 * Gambarnya diunduh lalu DISIMPAN di R2 kita, bukan di-hotlink: menautkan gambar
 * dari domain lain membocorkan siapa yang membaca ke pihak ketiga, dan sampulnya
 * ikut mati kapan pun sumbernya memindahkan berkasnya.
 *
 * Aman diulang: `--force` untuk menimpa yang sudah ada, tanpa itu hanya mengisi
 * yang kosong.
 *
 * Jalankan: npm run db:seed:blog-covers
 *
 * Skripnya dijalankan dengan `tsx --conditions=react-server`. Itu WAJIB: berkas ini
 * memakai `lib/fetch-image.ts` dan `lib/storage.ts` yang keduanya diawali
 * `import "server-only"`, dan penanda itu melempar di luar runtime React. Kondisi
 * `react-server` adalah jalur resmi paket itu sendiri — `exports` miliknya
 * memetakan kondisi tersebut ke `empty.js`, jadi penandanya diam tanpa ditambal.
 */
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../src/db";
import { blogPosts, type BlogCategory } from "../src/db/schema";
import { fetchImageFromUrl } from "../src/lib/fetch-image";
import { deletePhoto, photoStorageReady, putBlogCover } from "../src/lib/storage";
import { BLOG_SEED } from "./blog-seed-data";
import { COVER_SOURCES } from "./blog-cover-sources";

/**
 * HANYA slug dari seed yang disentuh. Artikel yang ditulis admin lewat /admin/blog
 * tidak pernah ikut — sampulnya urusan penulisnya, dan skrip seed tidak berhak
 * memutuskan gambar apa yang pantas untuk tulisan orang lain.
 */
const SEED_SLUGS = BLOG_SEED.map((p) => p.slug);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const force = process.argv.includes("--force");

async function main() {
  if (!photoStorageReady()) {
    console.error("Penyimpanan foto belum dikonfigurasi (R2_*). Tidak ada yang dikerjakan.");
    process.exit(1);
  }

  const rows = await db
    .select({ id: blogPosts.id, slug: blogPosts.slug, category: blogPosts.category, coverKey: blogPosts.coverKey })
    .from(blogPosts)
    .where(
      and(
        inArray(blogPosts.slug, SEED_SLUGS),
        force ? undefined : isNull(blogPosts.coverKey),
      ),
    );

  if (rows.length === 0) {
    console.log("Semua artikel seed sudah punya sampul. Pakai --force untuk menimpa.");
    return;
  }

  // Satu unduhan per kategori, dipakai ulang untuk semua artikel di kategori itu:
  // mengunduh gambar yang sama lima belas kali hanya membebani server sumbernya.
  const cache = new Map<BlogCategory, { bytes: Uint8Array; contentType: string } | null>();

  let dipasang = 0;
  let dilewati = 0;

  for (const row of rows) {
    const source = COVER_SOURCES[row.category];
    if (!source) {
      console.log(`  lewat  ${row.slug} — tidak ada gambar untuk ${row.category}`);
      dilewati++;
      continue;
    }

    if (!cache.has(row.category)) {
      // Wikimedia membalas 429 kalau unduhan ditembak cepat berurutan. Dicoba
      // beberapa kali dengan jeda yang menanjak, bukan sekali lalu menyerah:
      // kegagalan di sini berarti artikelnya kehilangan sampul sampai seed
      // dijalankan ulang.
      let image: { bytes: Uint8Array; contentType: string } | null = null;
      for (let attempt = 1; attempt <= 4; attempt++) {
        const res = await fetchImageFromUrl(source.url);
        if (res.ok) {
          image = res.image;
          break;
        }
        if (attempt === 4) {
          console.error(`  GAGAL  unduh ${row.category}: ${res.reason}`);
          break;
        }
        console.log(`  tunggu ${row.category} (${res.reason}) — coba lagi ke-${attempt + 1}`);
        await sleep(attempt * 3000);
      }
      cache.set(row.category, image);
      // Jeda sebelum kategori berikutnya: enam unduhan beruntun tanpa jeda itulah
      // yang memicu 429 sejak awal.
      await sleep(1500);
    }

    const image = cache.get(row.category);
    if (!image) {
      dilewati++;
      continue;
    }

    const key = await putBlogCover(row.id, image.bytes, image.contentType);
    const [updated] = await db
      .update(blogPosts)
      .set({ coverKey: key, updatedAt: new Date() })
      .where(eq(blogPosts.id, row.id))
      .returning({ id: blogPosts.id });

    if (!updated) {
      // Baris hilang di tengah proses — jangan tinggalkan objek yatim di R2.
      await deletePhoto(key);
      dilewati++;
      continue;
    }

    // Sampul lama dibuang SETELAH yang baru tercatat.
    if (row.coverKey) await deletePhoto(row.coverKey);

    console.log(`  ok     ${row.slug}`);
    dipasang++;
  }

  console.log(`\n${dipasang} sampul terpasang, ${dilewati} dilewati.`);
  console.log("Sumber & lisensi gambar tercatat di scripts/blog-cover-sources.ts");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
