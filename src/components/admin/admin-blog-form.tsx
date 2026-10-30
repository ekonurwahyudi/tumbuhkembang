"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBlogPostAction, updateBlogPostAction } from "@/lib/actions/blog";
import { useFormAction } from "@/lib/use-form-action";
import {
  BLOG_CATEGORIES,
  BLOG_CATEGORY_LABEL,
  MAX_BLOG_EXCERPT,
  MAX_BLOG_TITLE,
  slugify,
} from "@/schemas/blog";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BlogPost } from "@/db/schema";

const SELECT_CLASS =
  "border-input bg-background focus-visible:ring-ring aria-invalid:border-destructive h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px]";

/**
 * Form artikel blog. Isinya HTML yang diketik/ditempel admin, dan itu disengaja:
 * artikel butuh heading, daftar, dan tautan.
 *
 * Pratinjau di sini memakai `sanitizeHtml` YANG SAMA dengan jalur simpannya, jadi
 * yang terlihat admin persis yang akan tersimpan — termasuk tag yang dibuang.
 * Pembersihan sungguhannya tetap di server (`blogPostSchema`); yang di sini hanya
 * supaya admin tidak perlu menyimpan dulu untuk tahu hasilnya.
 */
export function AdminBlogForm({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const [preview, setPreview] = useState(false);
  const [html, setHtml] = useState(post?.contentHtml ?? "");
  const [excerptLen, setExcerptLen] = useState(post?.excerpt.length ?? 0);

  const { action, fields, formError, values } = useFormAction(
    (formData) => (post ? updateBlogPostAction(post.id, formData) : createBlogPostAction(formData)),
    () => {
      toast.success(post ? "Artikel diperbarui." : "Artikel ditambahkan.");
      router.push("/admin/blog");
    },
  );

  return (
    <form action={action} className="space-y-5" noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <fieldset className="space-y-4 rounded-2xl border p-4">
        <legend className="px-1 text-sm font-medium">Artikel</legend>

        <div className="space-y-2">
          <Label htmlFor="title">Judul</Label>
          <Input
            id="title"
            name="title"
            required
            maxLength={MAX_BLOG_TITLE}
            placeholder="Kapan bayi mulai MPASI?"
            defaultValue={values.title ?? post?.title}
            aria-invalid={!!fields?.title}
            aria-describedby={fields?.title ? "title-error" : undefined}
          />
          <FieldError id="title-error" message={fields?.title} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug URL</Label>
          <Input
            id="slug"
            name="slug"
            maxLength={80}
            placeholder="kapan-bayi-mulai-mpasi"
            defaultValue={values.slug ?? post?.slug ?? ""}
            aria-invalid={!!fields?.slug}
            aria-describedby={fields?.slug ? "slug-error" : "slug-hint"}
            // Dirapikan saat kolomnya ditinggalkan, bukan tiap ketikan: menormalkan
            // per karakter membuat tanda hubung muncul sebelum kata berikutnya diketik.
            onBlur={(e) => {
              if (e.target.value) e.target.value = slugify(e.target.value);
            }}
          />
          <p id="slug-hint" className="text-muted-foreground text-xs">
            Opsional — dibuat dari judul bila dikosongkan. Alamatnya jadi{" "}
            <code>/blog/slug-artikel</code>. Slug yang sudah dipakai otomatis diberi akhiran angka.
          </p>
          <FieldError id="slug-error" message={fields?.slug} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt">Ringkasan</Label>
          <Textarea
            id="excerpt"
            name="excerpt"
            required
            rows={2}
            maxLength={MAX_BLOG_EXCERPT}
            placeholder="Satu-dua kalimat yang tampil di kartu daftar artikel."
            defaultValue={values.excerpt ?? post?.excerpt ?? ""}
            onChange={(e) => setExcerptLen(e.target.value.length)}
            aria-invalid={!!fields?.excerpt}
            aria-describedby="excerpt-count"
          />
          <p id="excerpt-count" className="text-muted-foreground text-xs tabular-nums">
            {excerptLen}/{MAX_BLOG_EXCERPT} karakter
          </p>
          <FieldError id="excerpt-error" message={fields?.excerpt} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Kategori</Label>
          <select
            id="category"
            name="category"
            defaultValue={values.category ?? post?.category ?? "TUMBUH_KEMBANG"}
            aria-invalid={!!fields?.category}
            aria-describedby={fields?.category ? "category-error" : undefined}
            className={SELECT_CLASS}
          >
            {BLOG_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {BLOG_CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
          <FieldError id="category-error" message={fields?.category} />
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-2xl border p-4">
        <legend className="px-1 text-sm font-medium">Isi Artikel (HTML)</legend>

        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs">
            Tag yang diizinkan: <code>p h2 h3 h4 ul ol li strong em blockquote br hr a</code>.
            Selain itu dibuang otomatis.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setPreview(!preview)}
          >
            <Icon name={preview ? "edit" : "visibility"} className="text-[14px]" />
            {preview ? "Sunting" : "Pratinjau"}
          </Button>
        </div>

        {/* Textarea tetap ada di DOM saat pratinjau terbuka — ia yang membawa
            nilainya ke FormData. Disembunyikan dengan `hidden`, bukan dilepas. */}
        <Textarea
          id="contentHtml"
          name="contentHtml"
          required
          rows={18}
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          hidden={preview}
          placeholder={"<h2>Subjudul</h2>\n<p>Paragraf pertama...</p>"}
          className="font-mono text-xs"
          aria-invalid={!!fields?.contentHtml}
          aria-describedby={fields?.contentHtml ? "content-error" : undefined}
        />

        {preview && (
          <div
            className="text-body-md [&_h2]:text-headline-md [&_h3]:text-headline-sm [&_a]:text-primary bg-muted min-h-40 space-y-3 rounded-xl p-3 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--rule)] [&_blockquote]:pl-3 [&_blockquote]:italic [&_h2]:mt-4 [&_h3]:mt-3 [&_li]:ml-4 [&_ol]:list-decimal [&_ul]:list-disc"
            /* Hasil sanitizer yang sama dengan jalur simpan — lihat catatan kepala. */
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
          />
        )}
        <FieldError id="content-error" message={fields?.contentHtml} />
      </fieldset>

      <fieldset className="space-y-4 rounded-2xl border p-4">
        <legend className="px-1 text-sm font-medium">Sumber</legend>
        <p className="text-muted-foreground text-xs">
          Wajib. Artikel kesehatan tanpa sumber tidak bisa diperiksa pembacanya.
        </p>

        <div className="space-y-2">
          <Label htmlFor="sourceName">Nama Sumber</Label>
          <Input
            id="sourceName"
            name="sourceName"
            required
            maxLength={120}
            placeholder="WHO, IDAI, Kemenkes RI..."
            defaultValue={values.sourceName ?? post?.sourceName ?? ""}
            aria-invalid={!!fields?.sourceName}
            aria-describedby={fields?.sourceName ? "source-name-error" : undefined}
          />
          <FieldError id="source-name-error" message={fields?.sourceName} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sourceUrl">URL Sumber</Label>
          <Input
            id="sourceUrl"
            name="sourceUrl"
            type="url"
            inputMode="url"
            required
            maxLength={500}
            placeholder="https://www.who.int/..."
            defaultValue={values.sourceUrl ?? post?.sourceUrl ?? ""}
            aria-invalid={!!fields?.sourceUrl}
            aria-describedby={fields?.sourceUrl ? "source-url-error" : undefined}
          />
          <FieldError id="source-url-error" message={fields?.sourceUrl} />
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-2xl border p-4">
        <legend className="px-1 text-sm font-medium">Tampilan &amp; Urutan</legend>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={post?.isPublished ?? false}
            className="accent-primary mt-0.5 size-4 shrink-0"
          />
          <span>
            <span className="text-body-sm block font-bold">Terbitkan ke Halaman Artikel</span>
            <span className="text-muted-foreground text-label-sm block">
              Selama mati, artikel ini hanya terlihat di halaman admin.
            </span>
          </span>
        </label>

        <div className="space-y-2">
          <Label htmlFor="sortOrder">Urutan Tampil</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            inputMode="numeric"
            min={0}
            max={9999}
            step={1}
            defaultValue={values.sortOrder ?? post?.sortOrder ?? 0}
            aria-invalid={!!fields?.sortOrder}
            aria-describedby={fields?.sortOrder ? "sort-error" : "sort-hint"}
          />
          <p id="sort-hint" className="text-muted-foreground text-xs">
            Angka kecil tampil lebih dulu. Yang sama urutannya diurutkan dari yang terbaru.
          </p>
          <FieldError id="sort-error" message={fields?.sortOrder} />
        </div>
      </fieldset>

      <SubmitButton pendingLabel="Menyimpan...">
        {post ? "Simpan Perubahan" : "Simpan Artikel"}
      </SubmitButton>
    </form>
  );
}
