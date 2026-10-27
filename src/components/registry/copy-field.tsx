"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

/**
 * Satu baris "label + nilai + tombol salin" untuk panel alamat publik.
 *
 * Klien karena clipboard hanya ada di browser; teks yang disalin diteruskan
 * sebagai prop `value` dari server, bukan dibaca ulang dari DOM — nilai yang
 * tampil dan nilai yang tersalin dijamin sama.
 *
 * Ikon centang bertahan 2 detik selain toast: pembeli yang menyalin nama, HP, dan
 * alamat satu per satu perlu tahu baris mana yang sudah diambil, dan toast yang
 * bertumpuk tidak menjawab itu.
 */
export function CopyField({
  label,
  value,
  display,
  icon,
  mono,
}: {
  label: string;
  /** Teks yang disalin. Bisa berbeda dari yang ditampilkan. */
  value: string;
  /** Tampilan bila berbeda dari `value` — mis. alamat berbaris. */
  display?: React.ReactNode;
  icon: React.ComponentProps<typeof Icon>["name"];
  mono?: boolean;
}) {
  const [done, setDone] = useState(false);

  const copy = () =>
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setDone(true);
        setTimeout(() => setDone(false), 2000);
        toast.success(`${label} tersalin`);
      })
      .catch(() => toast.error("Gagal menyalin — salin manual dari teks"));

  return (
    /* Tiap baris jadi kepingan sendiri berlatar kartu: di dalam panel bernada, baris
       tanpa latar mengalir jadi satu blok teks dan batas "mana yang tersalin kalau
       tombol ini ditekan" jadi kabur. */
    <div className="bg-card flex items-start gap-2.5 rounded-xl p-2.5">
      <Icon name={icon} className="text-muted-foreground mt-0.5 shrink-0 text-[16px]" />
      <div className="min-w-0 flex-1">
        {/* Label 11px biasa, nilainya 14px tebal: sebelumnya labelnya yang `font-bold`
            sementara nilainya biasa, jadi "Nama Penerima" terbaca lebih kuat daripada
            nama orangnya sendiri — padahal nilainya yang dicari mata. */}
        <p className="text-muted-foreground text-label-sm">{label}</p>
        <div className={cn("text-body-md font-semibold break-words", mono && "tabular-nums")}>
          {display ?? value}
        </div>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Salin ${label}`}
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg transition-colors active:scale-95",
          // `bg-muted`, bukan `border`: garisnya tak terlihat lagi sejak --border
          // dibuat transparan, jadi tombolnya akan jadi ikon mengambang tanpa bentuk.
          done ? "bg-accent text-primary" : "bg-muted text-muted-foreground hover:text-foreground",
        )}
      >
        <Icon name={done ? "check" : "content_copy"} className="text-[16px]" />
      </button>
    </div>
  );
}

/** Tombol "salin semuanya" — satu tempel ke kolom alamat di marketplace. */
export function CopyAllButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard
          .writeText(text)
          .then(() => {
            setDone(true);
            setTimeout(() => setDone(false), 2000);
            toast.success("Alamat lengkap tersalin");
          })
          .catch(() => toast.error("Gagal menyalin — salin manual dari teks"))
      }
      className={cn(
        "text-label-sm inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full font-bold transition-colors active:scale-[0.98]",
        done ? "bg-accent text-primary" : "bg-primary text-primary-foreground hover:bg-[#1C74CC]",
      )}
    >
      <Icon name={done ? "check" : "content_copy"} className="text-[16px]" />
      {done ? "Tersalin" : label}
    </button>
  );
}
