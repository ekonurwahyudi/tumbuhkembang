import type { Metadata } from "next";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Lupa Password" };

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lupa Password</CardTitle>
        <CardDescription>Pemulihan password lewat email.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTitle>Belum tersedia</AlertTitle>
          <AlertDescription>
            Fitur reset password membutuhkan layanan pengiriman email dan belum diaktifkan.
            Untuk sementara, hubungi pengelola aplikasi untuk mengatur ulang password Anda.
          </AlertDescription>
        </Alert>
        <p className="text-center text-sm">
          <Link href="/login" className="underline underline-offset-4">
            Kembali ke halaman masuk
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
