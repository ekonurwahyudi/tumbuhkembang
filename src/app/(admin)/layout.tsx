import { redirect } from "next/navigation";
import { requireSuperadmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { AppHeader } from "@/components/layout/app-header";

/**
 * Penjaga /admin yang sebenarnya: requireSuperadmin() membaca peran dari DB, jadi
 * pencabutan langsung berlaku. Middleware sengaja tidak menjaga rute ini — peran di
 * klaim JWT basi sampai user login ulang.
 *
 * Tanpa <BottomNav>: nav bawah berisi menu anak sendiri, bukan urusan admin. Modul
 * admin pakai <AdminNav> yang bisa di-scroll — jumlahnya melewati empat tab.
 */
export default async function AdminLayout({ children }: LayoutProps<"/">) {
  let user;
  try {
    user = await requireSuperadmin();
  } catch (err) {
    redirect((err as Error).message === "FORBIDDEN" ? "/dashboard" : "/login");
  }

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader
        name={user.name || "Pengguna"}
        email={user.email}
        role={user.role}
        photoKey={user.photoKey}
        admin
      />
      <AdminNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-4 pb-10">{children}</main>
    </div>
  );
}
