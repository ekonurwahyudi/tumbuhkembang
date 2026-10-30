import { blogPostSchema } from "@/schemas/blog";
import type { BlogPostValues } from "@/lib/data/blog";

/**
 * Parsing form blog. Dipisah dari actions/blog.ts karena berkas `"use server"`
 * hanya boleh mengekspor fungsi async — pola yang sama dengan shop-form.ts.
 *
 * Daftar field-nya eksplisit, bukan `Object.fromEntries(formData)`: itulah yang
 * membuat field buatan tangan di FormData tidak pernah terbaca.
 */

/** Checkbox tidak terkirim sama sekali saat tidak dicentang. */
const checked = (v: FormDataEntryValue | null) => v !== null;

export function parseBlogPostForm(formData: FormData) {
  return blogPostSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    contentHtml: formData.get("contentHtml"),
    category: formData.get("category"),
    isPublished: checked(formData.get("isPublished")),
  });
}

/**
 * `contentHtml` di sini SUDAH bersih — `blogPostSchema` membersihkannya di
 * `.transform()`. Jangan membersihkannya lagi di tempat lain, dan jangan
 * melewati schema ini untuk menulis ke tabelnya.
 */
export const toBlogPostRow = (d: ReturnType<typeof blogPostSchema.parse>): BlogPostValues => ({
  slug: d.slug,
  title: d.title,
  excerpt: d.excerpt,
  contentHtml: d.contentHtml,
  category: d.category,
  isPublished: d.isPublished,
});
