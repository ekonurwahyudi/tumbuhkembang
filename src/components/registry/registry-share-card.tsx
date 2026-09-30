"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { shareRegistryAction } from "@/lib/actions/registry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

/**
 * Kartu bagikan wishlist. `origin` datang dari server (lihat request-origin.ts)
 * supaya tautannya sudah utuh pada render pertama, tanpa effect maupun beda
 * tampilan antara server dan client.
 */
export function RegistryShareCard({
  token,
  isPublic,
  ownerName,
  origin,
  summary,
  shippingAction,
}: {
  token: string | null;
  isPublic: boolean;
  ownerName: string;
  origin: string;
  /** Tiga penghitung + progres, dari registrySummary() di server. */
  summary: { listed: number; gifted: number; waiting: number };
  /**
   * Tombol alamat kirim. Node, bukan impor: dirender halaman supaya kartu ini tidak
   * ikut tahu bentuk data alamat. Duduk di baris yang sama dengan Salin Link —
   * alamat adalah bagian dari "wishlist ini siap dibagikan".
   */
  shippingAction?: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const link = token ? `${origin}/kado/${token}` : null;

  const copy = () =>
    link &&
    navigator.clipboard
      .writeText(link)
      .then(() => toast.success("Tautan tersalin"))
      .catch(() => toast.error("Gagal menyalin — salin manual dari teks"));

  const toggle = (on: boolean) =>
    startTransition(async () => {
      const res = await shareRegistryAction(on);
      if (res.success) {
        toast.success(on ? "Wishlist kini publik" : "Wishlist kembali privat");
        router.refresh();
      } else {
        toast.error(res.error.message);
      }
    });

  const waText = `Bantu kami melengkapi kebutuhan bayi — ini wishlist ${ownerName}: ${link ?? ""}`;

  const percent =
    summary.listed === 0 ? 0 : Math.round((summary.gifted / summary.listed) * 100);

  return (
    <section className="bg-accent flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-[var(--color-sky-tint)] to-[var(--color-sky-tint)]/30 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-primary text-headline-sm">Bagikan Wishlist</h2>
          <p className="text-primary/80 text-label-sm">
            Siapa pun yang punya tautan bisa melihat dan menghadiahi barang di daftar Anda.
          </p>
        </div>
        <Badge variant={isPublic ? "default" : "secondary"} className="shrink-0">
          {isPublic ? "Publik" : "Privat"}
        </Badge>
      </div>

      {/* Status pemenuhan: angka dulu, bar hanya penguat. */}
      <div className="bg-background/70 space-y-2.5 rounded-xl p-3 backdrop-blur-sm">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-label-sm font-bold">Status Pemenuhan Kado</h3>
          <span className="text-muted-foreground text-label-sm tabular-nums">
            {percent}% terpenuhi
          </span>
        </div>
        <dl className="grid grid-cols-3 gap-2.5">
          <Counter label="Terdaftar" value={summary.listed} />
          <Counter label="Dihadiahi" value={summary.gifted} />
          <Counter label="Menunggu" value={summary.waiting} />
        </dl>
        <div
          className="bg-border h-2 overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={summary.gifted}
          aria-valuemin={0}
          aria-valuemax={summary.listed}
          aria-label="Kemajuan pemenuhan wishlist"
        >
          <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {isPublic && link && (
        <>
          <p className="text-primary/80 max-h-16 overflow-y-auto text-[12px] break-all">{link}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copy}
              className="text-primary inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-semibold shadow-sm active:scale-95 dark:bg-white/10"
            >
              <Icon name="content_copy" className="text-[14px]" />
              Salin Link
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-semibold shadow-sm active:scale-95 dark:bg-white/10"
            >
              <Icon name="link" className="text-[14px]" />
              Via WhatsApp
            </a>
          </div>
        </>
      )}

      {/* Alamat kirim tampil baik wishlist sudah publik maupun belum: diisi lebih
          dulu berarti halaman publiknya lengkap sejak dibagikan pertama kali. */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={isPublic ? "outline" : "default"}
          size="sm"
          disabled={pending}
          onClick={() => toggle(!isPublic)}
          className="rounded-full"
        >
          <Icon name={isPublic ? "visibility_off" : "visibility"} className="text-[16px]" />
          {isPublic ? "Jadikan Privat" : "Bagikan ke Publik"}
        </Button>
        {shippingAction}
      </div>
    </section>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card border-border rounded-xl border p-2.5 text-center">
      <dd className="text-metric tabular-nums">{value}</dd>
      <dt className="text-muted-foreground text-label-sm font-bold">{label}</dt>
    </div>
  );
}
