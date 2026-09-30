"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteNotificationAction, markAllReadAction } from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import type { NotificationKind } from "@/db/schema";

/**
 * Daftar pemberitahuan.
 *
 * Klien karena hapus dan "tandai terbaca" butuh transisi; isinya sendiri sudah
 * dirender server (`relative` ikut dikirim sebagai string, bukan Date, supaya
 * tidak ada selisih jam antara server dan HP).
 */

export type NotificationRow = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  url: string | null;
  read: boolean;
  relative: string;
};

/*
  Ikon per jenis. Nama di luar peta ini tidak mungkin ada — enum DB yang membatasinya.
  Pengiriman memakai `check_circle`, bukan truk: font ikonnya adalah subset dan
  `local_shipping` tidak ada di dalamnya.
*/
const ICON: Record<NotificationKind, IconName> = {
  REGISTRY_CLAIM: "card_giftcard",
  REGISTRY_PROOF: "check_circle",
  VACCINE_DUE: "vaccines",
};

export function NotificationList({ rows }: { rows: NotificationRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const unread = rows.filter((r) => !r.read).length;

  const markAll = () =>
    startTransition(async () => {
      const res = await markAllReadAction();
      if (res.success) router.refresh();
      else toast.error(res.error.message);
    });

  return (
    <div className="space-y-3">
      {unread > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-body-sm text-muted-foreground">{unread} belum dibaca</p>
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={markAll}>
            <Icon name="check" className="text-[16px]" />
            Tandai semua terbaca
          </Button>
        </div>
      )}

      <ul className="space-y-2">
        {rows.map((n) => (
          <NotificationItem key={n.id} n={n} />
        ))}
      </ul>
    </div>
  );
}

function NotificationItem({ n }: { n: NotificationRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const remove = () =>
    startTransition(async () => {
      const res = await deleteNotificationAction(n.id);
      if (res.success) router.refresh();
      else toast.error(res.error.message);
    });

  return (
    <li
      /* Yang belum dibaca berlatar aksen DAN membawa titik + label "Baru":
         warna tidak pernah jadi satu-satunya penanda. */
      className={`flex items-start gap-3 rounded-2xl border p-3.5 shadow-sm transition-colors ${
        n.read ? "bg-card" : "bg-accent/40 border-[var(--color-sky-tint)]"
      } ${pending ? "opacity-50" : ""}`}
    >
      <span className="bg-card text-primary grid size-10 shrink-0 place-items-center rounded-full shadow-sm">
        <Icon name={ICON[n.kind]} filled={!n.read} className="text-[20px]" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-body-md min-w-0 font-bold">{n.title}</p>
          {!n.read && (
            <span className="bg-primary text-primary-foreground text-label-sm rounded-full px-2 py-0.5 font-bold">
              Baru
            </span>
          )}
        </div>
        <p className="text-body-sm text-muted-foreground mt-0.5">{n.body}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-label-sm text-muted-foreground">{n.relative}</span>
          {n.url && (
            <Link
              href={n.url}
              className="text-primary text-label-sm inline-flex items-center gap-0.5 font-bold hover:underline"
            >
              Lihat
              <Icon name="chevron_right" className="text-[16px]" />
            </Link>
          )}
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        onClick={remove}
        aria-label={`Hapus pemberitahuan: ${n.title}`}
      >
        <Icon name="close" className="text-[18px]" />
      </Button>
    </li>
  );
}
