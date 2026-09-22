import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Profil" };

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Profil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Akun</CardTitle>
          <CardDescription>Informasi akun Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Nama</dt>
              <dd className="font-medium">{user.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium break-all">{user.email}</dd>
            </div>
          </dl>

          <Separator />

          <form action={logoutAction}>
            <Button type="submit" variant="outline" className="w-full">
              <LogOut className="size-4" aria-hidden />
              Keluar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tentang</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>
            Tumbuh Kembang Anak adalah alat pencatatan dan pemantauan, bukan alat diagnosis medis.
          </p>
          <p>
            Perhitungan usia mengikuti AAP, <em>Age Terminology During the Perinatal Period</em>,
            Pediatrics 2004;114(5):1362–1364.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
