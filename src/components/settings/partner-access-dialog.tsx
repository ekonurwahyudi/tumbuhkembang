"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createShareAction, revokeShareAction } from "@/lib/actions/shares";
import { useFormAction } from "@/lib/use-form-action";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ShareRow = {
  id: string;
  childName: string;
  inviteeEmail: string;
  status: "PENDING" | "ACCEPTED";
  expiresAt: string;
};

const FIELD =
  "h-12 border-transparent bg-white pl-11 text-[15px] text-[#0F172A] placeholder:text-[#94A3B8]/60 shadow-sm focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#006194]/20";

const STATUS_LABEL = { PENDING: "Menunggu", ACCEPTED: "Aktif" } as const;

function ShareList({ shares }: { shares: ShareRow[] }) {
  const [rows, setRows] = useState(shares);
  const [pending, startTransition] = useTransition();

  const revoke = (id: string) =>
    startTransition(async () => {
      const res = await revokeShareAction(id);
      if (res.success) {
        setRows((r) => r.filter((s) => s.id !== id));
        toast.success("Akses dicabut");
      } else toast.error(res.error.message);
    });

  if (rows.length === 0)
    return (
      <p className="text-muted-foreground text-[13px]">
        Belum ada undangan. Bagikan link ke pasangan lewat WhatsApp atau email.
      </p>
    );

  return (
    <ul className="flex flex-col divide-y">
      {rows.map((s) => (
        <li key={s.id} className="flex items-center gap-2 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-[#0F172A]">
              {s.childName} → {s.inviteeEmail}
            </p>
            <p className="text-muted-foreground text-[11px]">
              {STATUS_LABEL[s.status]} • berlaku sampai{" "}
              {new Date(s.expiresAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => revoke(s.id)}
            className="text-label-sm shrink-0 rounded-full px-2.5 py-1 font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
          >
            Cabut
          </button>
        </li>
      ))}
    </ul>
  );
}

export function PartnerAccessDialog({
  childCount,
  shares,
}: {
  childCount: number;
  shares: ShareRow[];
}) {
  const [token, setToken] = useState<string | null>(null);

  const { action, fields, formError } = useFormAction(createShareAction, (data) => {
    setToken(data.token);
    toast.success("Undangan dibuat — salin linknya dan kirim ke pasangan");
  });

  const link = token ? `${window.location.origin}/invite/${token}` : null;

  const copy = () =>
    link &&
    navigator.clipboard
      .writeText(link)
      .then(() => toast.success("Link tersalin"))
      .catch(() => toast.error("Gagal menyalin — salin manual dari teks"));

  return (
    <Dialog onOpenChange={() => setToken(null)}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="bg-accent text-primary hover:bg-sky-100 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold transition-all active:scale-[0.98]"
        >
          <Icon name="family_restroom" className="text-[18px]" />
          Akses Pasangan
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] max-w-md gap-0 overflow-y-auto px-5 pt-6 pb-5">
        <DialogHeader className="px-0">
          <DialogTitle className="text-left text-[17px]">Akses Pasangan</DialogTitle>
          <DialogDescription className="text-left text-[13px]">
            Bagikan semua profil anak ke pasangan. Penerima harus masuk dengan email yang
            Anda tuju, lalu dapat melihat dan mencatat data semua anak Anda.
          </DialogDescription>
        </DialogHeader>

        {childCount === 0 ? (
          <p className="text-muted-foreground text-[13px]">
            Belum ada profil anak untuk dibagikan.
          </p>
        ) : (
          <form action={action} className="flex flex-col gap-4" noValidate>
            {formError && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] text-rose-600">
                {formError}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-email" className="text-[13px] font-semibold text-[#0F172A]">
                Email Pasangan
              </Label>
              <div className="relative flex w-full items-center">
                <span className="pointer-events-none absolute left-3.5 flex items-center text-[#94A3B8]">
                  <Icon name="mail" className="text-[20px]" />
                </span>
                <Input
                  id="invite-email"
                  name="email"
                  type="email"
                  required
                  placeholder="pasanganku@email.id"
                  className={FIELD}
                  aria-describedby={fields?.email ? "invite-email-error" : undefined}
                  aria-invalid={!!fields?.email}
                />
              </div>
              <FieldError id="invite-email-error" message={fields?.email} />
            </div>

            <SubmitButton
              pendingLabel="Membuat undangan..."
              className="h-12 rounded-xl bg-[#0284C7] text-[15px] font-semibold hover:bg-[#006194]"
            >
              Buat Link Undangan
            </SubmitButton>
          </form>
        )}

        {link && (
          <div className="bg-accent mt-4 flex flex-col gap-2 rounded-xl p-3">
            <span className="text-primary text-label-sm font-bold uppercase tracking-wider">
              Link undangan (7 hari)
            </span>
            <p className="text-primary/80 max-h-16 overflow-y-auto text-[12px] break-all">
              {link}
            </p>
            <button
              type="button"
              onClick={copy}
              className="inline-flex h-9 items-center justify-center gap-1.5 self-start rounded-full bg-white px-3 text-[12px] font-semibold text-[#0284C7] shadow-sm active:scale-95"
            >
              <Icon name="content_copy" className="text-[14px]" />
              Salin Link
            </button>
          </div>
        )}

        {childCount > 0 && (
          <>
            <div className="relative my-5 flex items-center justify-center">
              <div className="bg-border h-px w-full" />
              <span className="absolute px-3 text-[11px] font-medium tracking-[0.02em] text-muted-foreground">
                undangan terkirim
              </span>
            </div>
            <ShareList shares={shares} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
