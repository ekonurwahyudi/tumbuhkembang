/**
 * Menulis 15 artikel seed menjadi satu berkas migrasi SQL.
 *
 * Kenapa migrasi, bukan skrip seed: image production sengaja ramping — `scripts/`
 * tidak ikut disalin dan `tsx` dibuang `npm ci --omit=dev`, jadi `npm run db:seed:*`
 * memang tidak ada di sana. Migrasi sudah dijalankan otomatis saat container start
 * (lihat CMD di Dockerfile), jadi artikelnya ikut tanpa menambah apa pun ke image.
 *
 * `cover_key` ikut ditulis apa adanya dari basis data pengembangan. Key itu cuma
 * string penunjuk objek di R2 — ia TIDAK perlu cocok dengan uuid barisnya. Jadi
 * sampulnya langsung tampil di production ASALKAN bucket R2-nya sama dengan yang
 * dipakai saat `db:seed:blog-covers` dijalankan. Kalau bucketnya berbeda, artikelnya
 * tetap masuk dan sampulnya jatuh ke petak kategori berwarna — bukan halaman rusak.
 *
 * `ON CONFLICT (slug) DO NOTHING`: aman dijalankan di basis data yang artikelnya
 * sudah ada, dan tidak pernah menimpa suntingan admin.
 *
 * Jalankan: npx tsx --env-file=.env.local scripts/build-blog-migration.mts
 */
import { writeFileSync } from "node:fs";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

const rows = await sql<
  {
    slug: string;
    title: string;
    excerpt: string;
    content_html: string;
    category: string;
    cover_key: string | null;
  }[]
>`
  select slug, title, excerpt, content_html, category, cover_key
  from blog_posts
  where is_published = true
  order by created_at
`;

await sql.end();

if (rows.length === 0) {
  console.error("Tidak ada artikel terbit di basis data. Jalankan db:seed:blog dulu.");
  process.exit(1);
}

/** Kutip literal string PostgreSQL: satu-satunya escape yang perlu adalah '' */
const q = (v: string | null) => (v === null ? "NULL" : `'${v.replace(/'/g, "''")}'`);

const values = rows
  .map(
    (r) =>
      `  (${q(r.slug)}, ${q(r.title)}, ${q(r.excerpt)}, ${q(r.content_html)}, ` +
      `${q(r.category)}::"public"."blog_category", ${q(r.cover_key)}, true)`,
  )
  .join(",\n");

const sqlText = `-- 15 artikel edukasi awal, bersumber WHO, UNICEF, IDAI, CDC, dan AAP.
--
-- Ditulis sebagai migrasi, bukan skrip seed: image production tidak memuat
-- scripts/ maupun tsx, sementara migrasi sudah dijalankan otomatis saat container
-- start. Dihasilkan oleh scripts/build-blog-migration.mts — jangan disunting tangan.
--
-- ON CONFLICT (slug) DO NOTHING: aman diulang, dan tidak pernah menimpa artikel
-- yang sudah ada maupun suntingan admin.
--
-- cover_key menunjuk objek di R2. Sampulnya tampil bila bucket R2-nya sama dengan
-- yang dipakai saat sampul diunggah; bila tidak, artikelnya tetap masuk dan
-- sampulnya jatuh ke petak kategori berwarna.
INSERT INTO "blog_posts" ("slug", "title", "excerpt", "content_html", "category", "cover_key", "is_published") VALUES
${values}
ON CONFLICT ("slug") DO NOTHING;
`;

const path = "src/db/migrations/0020_seed_blog_posts.sql";
writeFileSync(path, sqlText, "utf8");

console.log(`${rows.length} artikel ditulis ke ${path}`);
console.log(`Ukuran: ${(sqlText.length / 1024).toFixed(1)} KB`);
console.log(`Bersampul: ${rows.filter((r) => r.cover_key).length}/${rows.length}`);
