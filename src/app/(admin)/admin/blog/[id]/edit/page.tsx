import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminGetBlogPost } from "@/lib/data/blog";
import { AdminBlogForm } from "@/components/admin/admin-blog-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Ubah Artikel" };

/** Query DB di tingkat atas, dan build Docker tidak punya DB. */
export const dynamic = "force-dynamic";

export default async function AdminEditBlogPostPage({
  params,
}: PageProps<"/admin/blog/[id]/edit">) {
  const { id } = await params;
  const post = await adminGetBlogPost(id);
  if (!post) notFound();

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Link
        href="/admin/blog"
        className="text-muted-foreground hover:text-foreground text-body-sm inline-flex w-fit items-center gap-1"
      >
        <Icon name="arrow_back" className="text-[16px]" />
        Blog
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Ubah {post.title}</CardTitle>
          <CardDescription>
            {post.isPublished
              ? "Artikel ini sudah terbit — perubahannya langsung terlihat orang tua."
              : "Artikel ini masih draf dan belum terlihat orang tua."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminBlogForm post={post} />
        </CardContent>
      </Card>
    </div>
  );
}
