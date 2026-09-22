import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Halaman tidak ditemukan</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.
      </p>
      <Button asChild>
        <Link href="/dashboard">Kembali ke beranda</Link>
      </Button>
    </main>
  );
}
