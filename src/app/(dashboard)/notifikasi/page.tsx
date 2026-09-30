import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { hasSubscription, listNotifications } from "@/lib/data/notifications";
import { formatRelative } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { NotificationList } from "@/components/notifications/notification-list";
import { PushToggle } from "@/components/notifications/push-toggle";

export const metadata: Metadata = { title: "Pemberitahuan" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const [rows, subscribed] = await Promise.all([
    listNotifications(user.id),
    hasSubscription(user.id),
  ]);

  // Waktu relatif dihitung di server: satu sumber jam, dan tidak ada Date yang
  // perlu menyeberang ke klien.
  const now = new Date();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-headline-lg">Pemberitahuan</h1>
        <p className="text-muted-foreground text-body-sm mt-0.5">
          Klaim kado, bukti pengiriman, dan jadwal vaksin si kecil.
        </p>
      </header>

      <PushToggle subscribed={subscribed} />

      {rows.length === 0 ? (
        <EmptyState
          icon="notifications"
          title="Belum ada pemberitahuan."
          description="Kami mengabari di sini saat ada yang mengklaim kado atau saat jadwal vaksin mendekat."
        />
      ) : (
        <NotificationList
          rows={rows.map((n) => ({
            id: n.id,
            kind: n.kind,
            title: n.title,
            body: n.body,
            url: n.url,
            read: n.readAt !== null,
            relative: formatRelative(n.createdAt, now),
          }))}
        />
      )}
    </div>
  );
}
