"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminDeleteChildAction, adminDeleteParentAction } from "@/lib/actions/admin";
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
 * Hapus baris dari daftar admin. Satu komponen untuk orang tua dan anak: bedanya cuma
 * action dan kalimat akibatnya — dua berkas untuk itu tidak ada gunanya.
 *
 * Akibat cascade ditulis lengkap di deskripsi: menghapus akun orang tua ikut menghapus
 * seluruh data anaknya, dan itu harus terbaca sebelum tombolnya ditekan.
 */
export function AdminDeleteButton({
  kind,
  id,
  name,
}: {
  kind: "parent" | "child";
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const isParent = kind === "parent";

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive shrink-0"
          aria-label={`Hapus ${isParent ? "akun" : "data"} ${name}`}
        >
          <Icon name="delete" className="text-[16px]" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Hapus {isParent ? "akun" : "data"} {name}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isParent
              ? "Seluruh profil anak, pengukuran, catatan asupan, imunisasi, dan undangan pasangan milik akun ini ikut terhapus. Tindakan ini tidak dapat dibatalkan."
              : "Seluruh pengukuran, catatan asupan, dan imunisasi anak ini ikut terhapus. Tindakan ini tidak dapat dibatalkan."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              // Tanpa ini Radix menutup dialog sebelum action selesai.
              e.preventDefault();
              startTransition(async () => {
                const res = isParent
                  ? await adminDeleteParentAction(id)
                  : await adminDeleteChildAction(id);
                if (res.success) {
                  toast.success(`${isParent ? "Akun" : "Data"} ${name} dihapus.`);
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
