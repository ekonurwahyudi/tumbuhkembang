import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader name={session.user.name ?? "Pengguna"} email={session.user.email ?? ""} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-4 pb-24 md:pb-8">{children}</main>
      <BottomNav />
    </div>
  );
}
