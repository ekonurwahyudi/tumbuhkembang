"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminDeleteChildAction, adminDeleteParentAction } from "@/lib/actions/admin";
import { deleteShopProductAction } from "@/lib/actions/shop";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

/**
 * Hapus baris dari daftar admin. Satu komponen untuk tiga jenis baris: bedanya cuma
 * action, kata bendanya, dan kalimat akibatnya — tiga berkas untuk itu tidak ada gunanya.
 *
 * Akibatnya ditulis lengkap di deskripsi: menghapus akun orang tua ikut menghapus
 * seluruh data anaknya, dan itu harus terbaca sebelum tombolnya ditekan.
 */
const KIND = {
  parent: {
    noun: "akun",
    action: adminDeleteParentAction,
    consequence:
      "Seluruh profil anak, pengukuran, catatan asupan, imunisasi, dan undangan pasangan milik akun ini ikut terhapus. Tindakan ini tidak dapat dibatalkan.",
  },
  child: {
    noun: "data",
    action: adminDeleteChildAction,
    consequence:
      "Seluruh pengukuran, catatan asupan, dan imunisasi anak ini ikut terhapus. Tindakan ini tidak dapat dibatalkan.",
  },
  shopProduct: {
    noun: "produk",
    action: deleteShopProductAction,
    consequence:
      "Seluruh foto produk ini ikut terhapus. Produk yang sudah terbit akan hilang dari halaman Shop orang tua. Tindakan ini tidak dapat dibatalkan.",
  },
} as const;

export function AdminDeleteButton({
  kind,
  id,
  name,
}: {
  kind: keyof typeof KIND;
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const { noun, action, consequence } = KIND[kind];
  const Noun = noun.charAt(0).toUpperCase() + noun.slice(1);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive shrink-0"
          aria-label={`Hapus ${noun} ${name}`}
        >
          <Icon name="delete" className="text-[16px]" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Hapus {noun} {name}?
          </AlertDialogTitle>
          <AlertDialogDescription>{consequence}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              // Tanpa ini Radix menutup dialog sebelum action selesai.
              e.preventDefault();
              startTransition(async () => {
                const res = await action(id);
                if (res.success) {
                  toast.success(`${Noun} ${name} dihapus.`);
                  setOpen(false);
                  router.refresh();
                } else {
                  toast.error(res.error.message);
                }
              });
            }}
          >
            {pending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
