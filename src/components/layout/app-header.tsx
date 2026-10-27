import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AdminHelpdeskLink, AdminNav } from "@/components/admin/admin-nav";
import { AccountMenu } from "./account-menu";
import { TopNav } from "./top-nav";
import type { UserRole } from "@/db/schema";

export function AppHeader({
  name,
  email,
  role,
  photoKey,
  unread = 0,
  admin = false,
}: {
  name: string;
  email: string;
  /** Jumlah pemberitahuan belum terbaca; 0 berarti lonceng tanpa titik. */
  unread?: number;
  /** Item "Superadmin" hanya muncul untuk SUPERADMIN. */
  role?: UserRole;
  /**
   * Foto profil dari `users.photoKey`. Dipakai sebagai penanda versi di URL
   * juga: key berubah tiap unggah, jadi avatar lama tidak tertinggal di cache.
   */
  photoKey?: string | null;
  /**
   * Mode superadmin: judul dan tautan brand berganti, dan <AdminNav> + Helpdesk
   * menggantikan <TopNav> orang tua. Satu prop, bukan header kedua — sisanya
   * (avatar, menu akun, logout) identik.
   */
  admin?: boolean;
}) {
  return (
    /*
      Disembunyikan di HP untuk orang tua: nav bawah sudah membawa seluruh tujuannya,
      dan baris brand setinggi 64px di atasnya hanya mendorong isi halaman ke bawah
      tanpa menambah jalan ke mana pun. Avatar dan loncengnya pindah ke sapaan beranda.

      Mode admin tetap tampak di segala lebar: /admin TIDAK punya nav bawah, jadi
      menyembunyikan headernya akan menghilangkan satu-satunya navigasinya.
    */
    <header
      className={cn(
        "bg-card/90 supports-[backdrop-filter]:bg-card/80 sticky top-0 z-40 border-b shadow-[0_1px_8px_rgb(0_0_0/0.03)] backdrop-blur-xl",
        !admin && "hidden md:block",
      )}
    >
      {/* Lebih lebar di mode admin: tabel datanya tujuh kolom, dan max-w-4xl
          memaksanya di-scroll mendatar bahkan di layar desktop. */}
      <div
        className={cn(
          "mx-auto flex h-16 items-center gap-3 px-4",
          admin ? "max-w-6xl" : "max-w-4xl",
        )}
      >
        <Link href={admin ? "/admin" : "/dashboard"} className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/brand-logo.png"
            alt="Logo Tumbuh Kembang"
            width={32}
            height={32}
            className="shadow-xs size-8 shrink-0 rounded-xl object-contain"
          />
          <span className="flex min-w-0 flex-col leading-none">
            <span className="text-muted-foreground text-label-sm font-medium">Tumbuh Kembang</span>
            <span className="text-headline-sm mt-0.5 truncate tracking-tight">
              {admin ? "Superadmin" : "Buku KIA Digital"}
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {/* Lonceng terpisah dihapus: tab "Notifikasi" di nav sudah jadi pintu
              masuknya, dan dua tautan ke halaman yang sama hanya membingungkan.
              Jumlah belum terbaca ikut ke nav, di desktop maupun di HP. */}
          {admin ? (
            <>
              <AdminNav />
              <AdminHelpdeskLink />
            </>
          ) : (
            <TopNav unread={unread} />
          )}
          <AccountMenu
            name={name}
            email={email}
            role={role}
            photoKey={photoKey}
            admin={admin}
          />
        </div>
      </div>
    </header>
  );
}
