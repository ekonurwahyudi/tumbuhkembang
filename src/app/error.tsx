"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Terjadi kesalahan</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        Halaman gagal dimuat. Silakan coba kembali.
      </p>
      <Button onClick={reset}>Coba lagi</Button>
    </main>
  );
}
