"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  importBlogCoverAction,
  removeBlogCoverAction,
  uploadBlogCoverAction,
} from "@/lib/actions/blog";
import { PhotoField } from "@/components/registry/registry-photo-field";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BlogPost } from "@/db/schema";

/**
 * Sampul artikel: unggah berkas ATAU tempel tautan gambar.
 *
 * Bagian unggahnya menyuntik prop ke `<PhotoField>` — kompresi, validasi, dan petak
 * thumbnail-nya milik satu komponen bersama, bukan salinan.
 *
 * `max: 1`: artikel punya tepat satu sampul, jadi tombolnya mati begitu ada satu
 * dan mengganti berarti menghapus dulu. `photoKeys` dibentuk jadi array berisi nol
 * atau satu key supaya cocok dengan bentuk yang diminta `PhotoOwner`.
 */
export function AdminBlogCoverField({ post }: { post: BlogPost }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [pending, startTransition] = useTransition();

  const importFromUrl = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error("Tempel tautan gambarnya dulu.");
      return;
    }
    startTransition(async () => {
      const res = await importBlogCoverAction(post.id, trimmed);
      if (res.success) {
        toast.success("Sampul terpasang dari tautan.");
        setUrl("");
        router.refresh();
      } else {
        toast.error(res.error.message);
      }
    });
  };

  return (
    <div className="space-y-3">
      <PhotoField
        owner={{
          id: post.id,
          photoKeys: post.coverKey ? [post.coverKey] : [],
          upload: uploadBlogCoverAction,
          // Argumen key diabaikan: artikel cuma punya satu sampul, tidak ada yang
          // perlu dipilih.
          remove: (id) => removeBlogCoverAction(id),
          // `v=` memaksa browser mengambil ulang setelah sampulnya diganti —
          // route-nya ber-`immutable`, jadi tanpa ini yang lama tetap terlihat.
          src: (id) => `/blog/${post.slug}/cover?v=${encodeURIComponent(post.coverKey ?? id)}`,
          max: 1,
          label: "Gambar Sampul",
          hint: "Opsional, satu gambar (JPG/PNG/WebP, otomatis dikecilkan). Tampil di kartu daftar artikel dan di kepala artikelnya.",
        }}
      />

      {/* Jalur kedua: tempel tautan. Gambarnya tetap diunduh dan disimpan di
          penyimpanan kita — tidak di-hotlink dari domain lain. */}
      <div className="space-y-2">
        <Label htmlFor="coverUrl">Atau ambil dari tautan gambar</Label>
        <div className="flex gap-2">
          <Input
            id="coverUrl"
            type="url"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={pending}
            maxLength={1000}
            placeholder="https://upload.wikimedia.org/.../gambar.jpg"
            aria-describedby="cover-url-hint"
          />
          <Button
            type="button"
            className="shrink-0"
            disabled={pending}
            onClick={importFromUrl}
            aria-busy={pending}
          >
            <Icon name={pending ? "sync" : "download"} className="text-[16px]" />
            {pending ? "Mengambil..." : "Ambil"}
          </Button>
        </div>
        <p id="cover-url-hint" className="text-muted-foreground text-xs">
          Tautan <strong>https</strong> langsung ke berkas gambarnya (berakhiran .jpg/.png/.webp),
          bukan halaman webnya. Gambarnya disalin ke penyimpanan kita, jadi tetap tampil walau
          sumbernya berubah. Pastikan Anda berhak memakai gambar itu.
        </p>
      </div>
    </div>
  );
}
