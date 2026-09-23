import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
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

          <LogoutButton className="w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pasang aplikasi</CardTitle>
          <CardDescription>Buka dari layar utama seperti aplikasi biasa.</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>
            <span className="text-foreground font-medium">Android (Chrome):</span> buka menu
            titik tiga, pilih <em>Tambahkan ke layar utama</em>.
          </p>
          <p>
            <span className="text-foreground font-medium">iPhone/iPad (Safari):</span> ketuk
            tombol Bagikan, lalu pilih <em>Tambahkan ke Layar Utama</em>.
          </p>
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
