import "server-only";
import { and, asc, desc, eq, ilike, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts, type BlogCategory, type BlogPost } from "@/db/schema";

/**
 * Akses data blog. Dua sisi dengan otorisasi berbeda, persis seperti data/shop.ts:
 *
 * - Sisi baca tidak membawa userId karena artikelnya memang milik bersama; yang
 *   disaring di dalam query adalah `is_published`, bukan kepemilikan.
 * - Sisi admin juga tidak membawa userId, tapi alasannya berbeda: pemanggilnya
 *   WAJIB sudah lewat `requireSuperadmin()`. Tidak ada self-authorization di sini.
 *
 * `grep userId src/lib/data` tidak boleh menuduh berkas ini — sama seperti shop.ts.
 */

export type BlogPostValues = {
  slug: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  category: BlogCategory;
  sourceName: string;
  sourceUrl: string;
  isPublished: boolean;
  sortOrder: number;
};

// ------------------------------------------------------------------- sisi baca

export async function listBlogPosts(opts?: {
  category?: BlogCategory;
  q?: string;
  limit?: number;
}): Promise<BlogPost[]> {
  const term = opts?.q?.trim();
  const where = and(
    eq(blogPosts.isPublished, true),
    opts?.category ? eq(blogPosts.category, opts.category) : undefined,
    // Judul ATAU ringkasan: orang mencari dengan kata yang diingatnya, dan kata
    // itu sering ada di ringkasan, bukan di judul.
    term
      ? or(ilike(blogPosts.title, `%${term}%`), ilike(blogPosts.excerpt, `%${term}%`))
      : undefined,
  );

  const rows = db
    .select()
    .from(blogPosts)
    .where(where)
    .orderBy(asc(blogPosts.sortOrder), desc(blogPosts.createdAt));

  return opts?.limit ? rows.limit(opts.limit) : rows;
}

/**
 * Satu artikel menurut slug-nya. `undefined` untuk slug asing MAUPUN artikel draf —
 * pemanggil tidak boleh bisa membedakan keduanya.
 */
export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
  const [row] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.isPublished, true)))
    .limit(1)
    .catch(() => []);
  return row;
}

/** Bacaan lain di kaki artikel: kategori yang sama, artikel ini sendiri dikecualikan. */
export async function listRelatedPosts(
  post: Pick<BlogPost, "id" | "category">,
  limit = 3,
): Promise<BlogPost[]> {
  return db
    .select()
    .from(blogPosts)
    .where(
      and(
        eq(blogPosts.isPublished, true),
        eq(blogPosts.category, post.category),
        ne(blogPosts.id, post.id),
      ),
    )
    .orderBy(asc(blogPosts.sortOrder), desc(blogPosts.createdAt))
    .limit(limit);
}

/** Kategori yang benar-benar punya artikel terbit — untuk pil penyaring. */
export async function listBlogCategoryCounts(): Promise<Map<BlogCategory, number>> {
  const rows = await db
    .select({ category: blogPosts.category })
    .from(blogPosts)
    .where(eq(blogPosts.isPublished, true));

  const counts = new Map<BlogCategory, number>();
  for (const r of rows) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
  return counts;
}

// ------------------------------------------------------------------ sisi admin

/** Tanpa filter is_published: admin memang harus melihat drafnya sendiri. */
export async function adminListBlogPosts(q?: string): Promise<BlogPost[]> {
  const term = q?.trim();
  return db
    .select()
    .from(blogPosts)
    .where(term ? ilike(blogPosts.title, `%${term}%`) : undefined)
    .orderBy(asc(blogPosts.sortOrder), desc(blogPosts.createdAt));
}

export async function adminGetBlogPost(id: string): Promise<BlogPost | undefined> {
  const [row] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .limit(1)
    .catch(() => []);
  return row;
}

/**
 * Slug unik di tingkat basis data (`blog_posts_slug_unique`), jadi tabrakan
 * diselesaikan dengan menambah akhiran angka — bukan ditolak ke muka admin.
 * `excludeId` dipakai saat menyunting: artikel tidak bertabrakan dengan dirinya.
 */
async function uniqueSlug(slug: string, excludeId?: string): Promise<string> {
  const taken = await db
    .select({ slug: blogPosts.slug })
    .from(blogPosts)
    .where(excludeId ? ne(blogPosts.id, excludeId) : undefined);

  const used = new Set(taken.map((r) => r.slug));
  if (!used.has(slug)) return slug;

  for (let n = 2; n < 1000; n++) {
    const candidate = `${slug}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
  // Seribu artikel berslug sama praktis mustahil; timestamp sebagai jalan terakhir
  // supaya fungsinya tidak pernah mengembalikan slug yang pasti gagal disimpan.
  return `${slug}-${Date.now()}`;
}

export async function insertBlogPost(values: BlogPostValues): Promise<BlogPost> {
  const [row] = await db
    .insert(blogPosts)
    .values({ ...values, slug: await uniqueSlug(values.slug) })
    .returning();
  return row;
}

export async function updateBlogPost(
  id: string,
  values: BlogPostValues,
): Promise<BlogPost | undefined> {
  const [row] = await db
    .update(blogPosts)
    .set({ ...values, slug: await uniqueSlug(values.slug, id), updatedAt: new Date() })
    .where(eq(blogPosts.id, id))
    .returning();
  return row;
}

export async function deleteBlogPost(id: string): Promise<{ id: string } | undefined> {
  const [row] = await db.delete(blogPosts).where(eq(blogPosts.id, id)).returning({
    id: blogPosts.id,
  });
  return row;
}

export async function setBlogPostPublished(
  id: string,
  next: boolean,
): Promise<BlogPost | undefined> {
  const [row] = await db
    .update(blogPosts)
    .set({ isPublished: next, updatedAt: new Date() })
    .where(eq(blogPosts.id, id))
    .returning();
  return row;
}

/** Dipakai seed: tulis bila slug-nya belum ada, lewati bila sudah. */
export async function upsertBlogPostBySlug(values: BlogPostValues): Promise<void> {
  await db
    .insert(blogPosts)
    .values(values)
    .onConflictDoUpdate({
      target: blogPosts.slug,
      set: {
        title: values.title,
        excerpt: values.excerpt,
        contentHtml: values.contentHtml,
        category: values.category,
        sourceName: values.sourceName,
        sourceUrl: values.sourceUrl,
        updatedAt: new Date(),
      },
    });
}
