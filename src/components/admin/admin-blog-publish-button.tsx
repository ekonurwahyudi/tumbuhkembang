"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleBlogPublishedAction } from "@/lib/actions/blog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

/**
 * Terbitkan / jadikan draf. Tanpa dialog konfirmasi: keduanya bisa dibalik dengan
 * satu klik yang sama — beda tajam dari hapus. Pola sama dengan AdminShopPublishButton.
 */
export function AdminBlogPublishButton({
  id,
  title,
  isPublished,
}: {
  id: string;
  title: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = !isPublished;

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      aria-label={`${next ? "Terbitkan" : "Jadikan draf"} ${title}`}
      title={next ? "Terbitkan" : "Jadikan draf"}
      onClick={() =>
        startTransition(async () => {
          const res = await toggleBlogPublishedAction(id, next);
          if (res.success) {
            toast.success(next ? "Artikel diterbitkan." : "Artikel dijadikan draf.");
            router.refresh();
          } else {
            toast.error(res.error.message);
          }
        })
      }
    >
      <Icon
        name={next ? "visibility" : "visibility_off"}
        className={next ? "text-[16px]" : "text-muted-foreground text-[16px]"}
      />
    </Button>
  );
}
