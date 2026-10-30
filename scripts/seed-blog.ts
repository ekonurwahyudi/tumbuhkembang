/**
 * Isi tabel `blog_posts` dengan 15 artikel awal.
 *
 * Query-nya ditulis DI SINI, bukan diimpor dari `src/lib/data/blog.ts`: modul itu
 * `import "server-only"`, yang sengaja melempar di luar runtime React — termasuk
 * saat dijalankan tsx. Skrip lain (`seed-dev.ts`) memakai `src/db` langsung dengan
 * alasan yang sama.
 *
 * Aman diulang: `onConflictDoUpdate` pada slug, jadi menjalankannya dua kali
 * memperbarui isinya, bukan menggandakan barisnya.
 *
 * TIDAK menghapus apa pun — artikel yang ditulis admin lewat /admin/blog tidak
 * tersentuh, karena slug-nya tidak ada di daftar ini.
 *
 * Jalankan: npm run db:seed:blog
 */
import { db } from "../src/db";
import { blogPosts } from "../src/db/schema";
import { BLOG_SEED } from "./blog-seed-data";

async function main() {
  for (const post of BLOG_SEED) {
    await db
      .insert(blogPosts)
      .values(post)
      .onConflictDoUpdate({
        target: blogPosts.slug,
        set: {
          title: post.title,
          excerpt: post.excerpt,
          contentHtml: post.contentHtml,
          category: post.category,
          updatedAt: new Date(),
        },
      });
    console.log(`  ${post.category.padEnd(15)} ${post.slug}`);
  }
  console.log(`\n${BLOG_SEED.length} artikel tersimpan.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
