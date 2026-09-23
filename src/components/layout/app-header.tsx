import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoutButton } from "@/components/logout-button";
import { TopNav } from "./top-nav";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

export function AppHeader({ name, email }: { name: string; email: string }) {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon.svg" alt="" width={28} height={28} className="rounded-md" />
          <span className="text-base">Tumbuh Kembang</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <TopNav />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Menu akun">
                <Avatar className="size-8">
                  {/* text-foreground, bukan warna muted bawaan: pasangan muted/muted-foreground
                      hanya mencapai rasio kontras 4.34:1, di bawah ambang WCAG AA 4.5:1. */}
                  <AvatarFallback className="text-foreground font-medium">
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
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                {/* Keluar lewat komponen tersendiri agar cache service worker
                    ikut dibersihkan, sama seperti dari halaman Profil. */}
                <LogoutButton variant="ghost" className="h-auto w-full justify-start px-2 py-1.5 font-normal" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
