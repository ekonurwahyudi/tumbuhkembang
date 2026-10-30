/**
 * Konversi sekali pakai: laporan riset berformat blok `KUNCI: nilai` menjadi
 * `scripts/blog-seed-data.ts`.
 *
 * Dipisah dari seed-nya sendiri supaya hasil riset tidak perlu disalin tangan —
 * dan supaya isinya lewat `blogPostSchema` (termasuk sanitizer) sebelum jadi
 * berkas, bukan sesudah masuk basis data.
 *
 * Jalankan: npx tsx scripts/blog-seed-build.mts <berkas-laporan>
 */
import { readFileSync, writeFileSync } from "node:fs";
import { blogPostSchema } from "../src/schemas/blog";

const source = process.argv[2];
if (!source) {
  console.error("Pemakaian: npx tsx scripts/blog-seed-build.mts <berkas-laporan>");
  process.exit(1);
}

const raw = readFileSync(source, "utf8");

/** Satu artikel = blok dari "SLUG:" sampai sebelum "SLUG:" berikutnya. */
const blocks = raw.split(/^SLUG:\s*/m).slice(1);

const field = (block: string, key: string): string => {
  const m = new RegExp(`^${key}:\\s*(.+)$`, "m").exec(block);
  return m?.[1].trim() ?? "";
};

/** `<` dan `&` di nama sumber tidak boleh jadi tag saat ditempel ke HTML. */
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const posts = blocks.map((block) => {
  const slug = block.split("\n")[0].trim();
  const html = block.split(/^KONTEN_HTML:\s*$/m)[1] ?? "";
  const sourceName = field(block, "SUMBER_NAMA");
  const sourceUrl = field(block, "SUMBER_URL");

  /*
    Sumber tidak lagi punya kolom sendiri, tapi artikel-artikel ini DITULIS dari
    halaman tersebut — membuangnya diam-diam berarti klaim kesehatan tanpa rujukan.
    Jadi ia ditempel sebagai paragraf penutup di dalam isinya, kecuali artikelnya
    sudah menyebut tautan itu sendiri.
  */
  const body = html.replace(/^---\s*$/m, "").trim();
  const contentHtml = body.includes(sourceUrl)
    ? body
    : `${body}\n<p>Sumber: <a href="${escapeHtml(sourceUrl)}">${escapeHtml(sourceName)}</a>.</p>`;

  const parsed = blogPostSchema.safeParse({
    title: field(block, "JUDUL"),
    slug,
    excerpt: field(block, "RINGKASAN"),
    contentHtml,
    category: field(block, "KATEGORI"),
    isPublished: true,
  });

  if (!parsed.success) {
    console.error(`GAGAL: ${slug}`);
    for (const issue of parsed.error.issues)
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    process.exit(1);
  }
  return parsed.data;
});

const header = `/**
 * Lima belas artikel awal, dihasilkan \`scripts/blog-seed-build.mts\` dari hasil
 * riset bersumber WHO, UNICEF, IDAI, CDC, dan AAP.
 *
 * JANGAN disunting tangan: \`contentHtml\` di sini SUDAH lewat \`sanitizeHtml()\`
 * (via \`blogPostSchema\`), dan suntingan tangan bisa memasukkan HTML yang belum
 * dibersihkan. Perlu ubah isi artikel? Lakukan lewat /admin/blog.
 *
 * Setiap artikel menutup dengan tautan sumbernya di dalam isi — aplikasi ini tidak
 * menilai kondisi medis sendiri, jadi klaimnya harus bisa diperiksa pembaca.
 */
import type { BlogPostValues } from "../src/lib/data/blog";

export const BLOG_SEED: BlogPostValues[] = `;

writeFileSync(
  "scripts/blog-seed-data.ts",
  `${header}${JSON.stringify(posts, null, 2)};\n`,
  "utf8",
);

console.log(`${posts.length} artikel ditulis ke scripts/blog-seed-data.ts`);
for (const p of posts) console.log(`  ${p.category.padEnd(15)} ${p.slug}`);
