import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listChildrenForViewer } from "@/lib/data/children";
import { unreadCount } from "@/lib/data/notifications";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { OfflineBanner } from "@/components/offline-banner";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [childrenList, unread] = await Promise.all([
    listChildrenForViewer(session.user.id),
    unreadCount(session.user.id),
  ]);

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader
        name={session.user.name ?? "Pengguna"}
        email={session.user.email ?? ""}
        role={session.user.role}
        photoKey={session.user.photoKey}
        unread={unread}
      />
      {/* Hanya di dashboard: halaman publik /kado dan halaman auth tidak punya
          isian yang menunggu, jadi pita di sana cuma kebisingan. */}
      <OfflineBanner />
      {/* overflow-x-clip menahan slider yang sengaja "bleed" lewat -mx-4; relative
          memberi containing block agar label .sr-only (position:absolute) di dalam
          slider ikut terpotong, bukan melebarkan dokumen.

          `pt` membawa safe-area DAN jarak nafasnya: di HP <AppHeader> disembunyikan,
          jadi <main> jadi elemen teratas — tanpa inset isinya masuk ke bawah poni
          (layout.tsx memasang viewportFit:"cover"), dan tanpa 1.5rem di atasnya judul
          halaman menempel ke tepi layar. Di desktop headernya kembali dan sudah
          memberi jarak sendiri, jadi cukup pt-4 di sana. */}
      <main className="relative mx-auto w-full max-w-4xl flex-1 overflow-x-clip px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-24 md:pt-4 md:pb-8">
        {children}
      </main>
      <BottomNav
        quickRecordChildren={childrenList.map(({ child: c }) => ({
          id: c.id,
          name: c.name,
          dateOfBirth: c.dateOfBirth,
          photoKey: c.photoKey,
        }))}
      />
    </div>
  );
}
