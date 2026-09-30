import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { LogoutMenuItem } from "@/components/logout-button";
import { TopNav } from "./top-nav";
import type { UserRole } from "@/db/schema";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

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
   * Mode superadmin: judul dan tautan brand berganti, TopNav orang tua disembunyikan.
   * Satu prop, bukan header kedua — sisanya (avatar, menu akun, logout) identik.
   */
  admin?: boolean;
}) {
  return (
    <header className="bg-card/90 supports-[backdrop-filter]:bg-card/80 sticky top-0 z-40 border-b shadow-[0_1px_8px_rgb(0_0_0/0.03)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-4">
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
          {!admin && <TopNav unread={unread} />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Menu akun">
                <Avatar className="ring-accent size-8 ring-2">
                  {photoKey && (
                    <AvatarImage
                      src={`/user/photo?v=${encodeURIComponent(photoKey)}`}
                      alt={`Foto ${name}`}
                    />
                  )}
                  <AvatarFallback className="bg-accent text-accent-foreground text-body-sm font-bold">
                    {initials(name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <span className="block text-sm font-medium">{name}</span>
                <span className="text-muted-foreground block truncate text-xs">{email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">Profil &amp; pengaturan</Link>
              </DropdownMenuItem>
              {/* Menyembunyikan item ini bukan penjaganya — /admin dijaga
                  requireSuperadmin() di layout-nya, yang membaca peran dari DB. */}
              {role === "SUPERADMIN" && (
                <DropdownMenuItem asChild>
                  <Link href={admin ? "/dashboard" : "/admin"} className="gap-2">
                    <Icon name={admin ? "home" : "shield"} className="text-[16px]" />
                    {admin ? "Kembali ke aplikasi" : "Superadmin"}
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {/* Keluar lewat komponen tersendiri agar cache service worker
                  ikut dibersihkan, sama seperti dari halaman Profil. */}
              <LogoutMenuItem />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
