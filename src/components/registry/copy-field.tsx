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
    <div className="flex items-start gap-2">
      <Icon name={icon} className="text-muted-foreground mt-0.5 shrink-0 text-[16px]" />
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-label-sm font-bold">{label}</p>
        <div className={cn("text-body-sm break-words", mono && "tabular-nums")}>
          {display ?? value}
        </div>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Salin ${label}`}
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg border transition-colors active:scale-95",
          done ? "bg-accent text-primary border-transparent" : "bg-card hover:bg-muted",
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
        done ? "bg-accent text-primary" : "bg-primary text-primary-foreground hover:bg-[#006194]",
      )}
    >
      <Icon name={done ? "check" : "content_copy"} className="text-[16px]" />
      {done ? "Tersalin" : label}
    </button>
  );
}
