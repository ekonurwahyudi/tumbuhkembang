import Link from "next/link";
import { cn } from "@/lib/utils";
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
import type { UserRole } from "@/db/schema";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

/**
 * Avatar + menu akun (Pengaturan, Superadmin, Keluar).
 *
 * Tinggal di komponennya sendiri karena dipakai dua tempat: `AppHeader` di desktop,
 * dan sapaan beranda di HP — di mana headernya disembunyikan. Tanpa ini, menyalin
 * dropdownnya ke beranda berarti jalan keluar dan tautan Superadmin bisa berbeda
 * diam-diam antara dua tempat yang seharusnya sama.
 */
export function AccountMenu({
  name,
  email,
  role,
  photoKey,
  admin = false,
  className,
  avatarClassName,
}: {
  name: string;
  email: string;
  role?: UserRole;
  /** Key foto ikut jadi penanda versi di URL supaya avatar lama tidak tertinggal di cache. */
  photoKey?: string | null;
  admin?: boolean;
  /** Untuk pemicunya — mis. `md:hidden` saat dipakai di beranda. */
  className?: string;
  avatarClassName?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("rounded-full", className)}
          aria-label="Menu akun"
        >
          <Avatar className={cn("ring-accent size-8 ring-2", avatarClassName)}>
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
  );
}
