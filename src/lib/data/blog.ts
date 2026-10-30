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
  isPublished: boolean;
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
    .orderBy(desc(blogPosts.createdAt));

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

/**
 * Artikel "populer" untuk blok sorotan di halaman daftar.
 *
 * ponytail: BELUM ada penghitung tampilan, jadi yang dipakai `sort_order` — angka
 * yang disetel admin, bukan perilaku pembaca. Itu sebabnya labelnya di layar
 * "Pilihan Redaksi", bukan "Terpopuler": menyebut sesuatu populer tanpa data
 * tontonan adalah klaim yang tidak bisa dipertanggungjawabkan.
 *
 * Mau populer sungguhan? Tambah kolom `view_count` dan naikkan di route artikel,
 * lalu ganti `orderBy` di sini. Tanda tangan fungsinya tidak perlu berubah.
 */
export async function listCuratedPosts(limit = 4): Promise<BlogPost[]> {
  return db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.isPublished, true))
    .orderBy(asc(blogPosts.sortOrder), desc(blogPosts.createdAt))
    .limit(limit);
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
    .orderBy(desc(blogPosts.createdAt))
    .limit(limit);
}

/**
 * Key sampul untuk route-nya. Filter `is_published` ada di dalam query, jadi
 * sampul artikel draf tidak bisa diraba lewat slug.
 *
 * `.catch` menangkap slug yang menyebabkan kesalahan tipe di Postgres — route-nya
 * harus menjawab 404, bukan 500.
 */
export async function getBlogCoverKey(slug: string): Promise<string | undefined> {
  const [row] = await db
    .select({ coverKey: blogPosts.coverKey })
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.isPublished, true)))
    .limit(1)
    .catch(() => []);
  return row?.coverKey ?? undefined;
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
    .orderBy(desc(blogPosts.createdAt));
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

/** `coverKey` ikut dikembalikan supaya action bisa membuang objeknya di R2. */
export async function deleteBlogPost(
  id: string,
): Promise<{ id: string; coverKey: string | null } | undefined> {
  const [row] = await db.delete(blogPosts).where(eq(blogPosts.id, id)).returning({
    id: blogPosts.id,
    coverKey: blogPosts.coverKey,
  });
  return row;
}

/**
 * Pasang atau lepas sampul. Key LAMA yang dikembalikan, bukan yang baru: tanpa
 * itu, mengganti sampul meninggalkan objek yatim di R2 setiap kali.
 *
 * Dalam transaksi dengan `FOR UPDATE` — `returning` pada UPDATE memberi nilai
 * SETELAH perubahan, jadi key lamanya harus dibaca lebih dulu, dan pembacaan itu
 * harus terkunci supaya dua unggahan bersamaan tidak saling menimpa.
 */
export async function setBlogCover(
  id: string,
  coverKey: string | null,
): Promise<{ previous: string | null } | undefined> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ coverKey: blogPosts.coverKey })
      .from(blogPosts)
      .where(eq(blogPosts.id, id))
      .limit(1)
      .for("update");
    if (!existing) return undefined;

    await tx
      .update(blogPosts)
      .set({ coverKey, updatedAt: new Date() })
      .where(eq(blogPosts.id, id));
    return { previous: existing.coverKey };
  });
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
