import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listChildrenForViewer } from "@/lib/data/children";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const childrenList = await listChildrenForViewer(session.user.id);

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader
        name={session.user.name ?? "Pengguna"}
        email={session.user.email ?? ""}
        role={session.user.role}
        photoKey={session.user.photoKey}
      />
      {/* overflow-x-clip menahan slider yang sengaja "bleed" lewat -mx-4; relative
          memberi containing block agar label .sr-only (position:absolute) di dalam
          slider ikut terpotong, bukan melebarkan dokumen. */}
      <main className="relative mx-auto w-full max-w-4xl flex-1 overflow-x-clip px-4 pt-4 pb-24 md:pb-8">
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
