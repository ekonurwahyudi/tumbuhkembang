import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Masuk</CardTitle>
        <CardDescription>Gunakan email dan password akun Anda.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <LoginForm />
        <div className="space-y-2 text-center text-sm">
          <p>
            <Link href="/forgot-password" className="underline underline-offset-4">
              Lupa password?
            </Link>
          </p>
          <p className="text-muted-foreground">
            Belum punya akun?{" "}
            <Link href="/register" className="text-foreground underline underline-offset-4">
              Daftar
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
