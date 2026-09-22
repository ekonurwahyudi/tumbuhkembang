import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Daftar" };

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Buat Akun</CardTitle>
        <CardDescription>Satu akun untuk mencatat semua anak Anda.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RegisterForm />
        <p className="text-muted-foreground text-center text-sm">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Masuk
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
