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
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "./rich-text-editor";
import type { BlogPost } from "@/db/schema";

const SELECT_CLASS =
  "border-input bg-background focus-visible:ring-ring aria-invalid:border-destructive h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px]";

/**
 * Form artikel blog. Isinya disunting lewat `RichTextEditor` — `contenteditable`
 * bawaan, bukan pustaka editor; alasannya ada di berkas itu.
 *
 * Yang tersimpan tetap dibersihkan di server (`blogPostSchema`), jadi apa pun yang
 * lolos dari editor tidak bisa masuk basis data apa adanya.
 */
export function AdminBlogForm({ post }: { post?: BlogPost }) {
  const router = useRouter();
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
        <legend className="px-1 text-sm font-medium">Isi Artikel</legend>
        <RichTextEditor
          name="contentHtml"
          defaultValue={post?.contentHtml}
          invalid={!!fields?.contentHtml}
        />
        <FieldError id="content-error" message={fields?.contentHtml} />
      </fieldset>

      <fieldset className="space-y-3 rounded-2xl border p-4">
        <legend className="px-1 text-sm font-medium">Terbitkan</legend>

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
              Selama mati, artikel ini hanya terlihat di halaman admin. Artikel terbaru tampil
              paling atas.
            </span>
          </span>
        </label>
      </fieldset>

      <SubmitButton pendingLabel="Menyimpan...">
        {post ? "Simpan Perubahan" : "Simpan Artikel"}
      </SubmitButton>
    </form>
  );
}
