import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import { AuthDivider, GoogleButton } from "@/components/auth/google-auth";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Hanya path internal yang diteruskan — cegah open redirect.
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : undefined;

  return (
    <div className="flex flex-col pb-10">
      {/* Brand showcase */}
      <div className="mt-2 mb-6 flex flex-col items-center text-center">
        <div className="relative mb-3.5">
          <div className="relative z-10 grid size-20 place-items-center rounded-2xl bg-white p-2.5 shadow-md">
            <Image
              src="/brand-logo.png"
              alt="Logo Tumbuh Kembang"
              width={80}
              height={80}
              className="size-full object-contain"
            />
          </div>
          <div className="absolute -right-1 -bottom-1 z-20 grid size-6 place-items-center rounded-full bg-[#FEF08A] shadow-sm">
            <Icon name="favorite" filled className="text-[14px] text-[#805600]" />
          </div>
          <div className="absolute -top-1.5 -left-1.5 z-0 grid size-5 animate-pulse place-items-center rounded-full bg-[#E0F2FE]">
            <Icon name="auto_awesome" className="text-[12px] text-[#0284C7]" />
          </div>
        </div>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#E0F2FE] px-3 py-1 shadow-sm">
          <Icon name="verified" className="text-[14px] text-[#0284C7]" />
          <span className="text-[11px] font-medium tracking-[0.02em] text-[#0284C7]">
            Standar Pediatri IDAI &amp; WHO
          </span>
        </div>
        <h2 className="text-[24px] font-bold tracking-tight text-[#0F172A]">Tumbuh Kembang</h2>
        <p className="mt-1 max-w-[300px] text-[15px] leading-relaxed text-[#475569]">
          Pantau Tumbuh Kembang Si Kecil dengan Tenang &amp; Akurat
        </p>
      </div>

      <div className="mb-5 w-full">
        <GoogleButton label="Lanjutkan dengan Google" variant="plain" />
      </div>

      <AuthDivider label="atau masuk dengan email" surface="page" />

      <LoginForm next={safeNext} />

      <div className="mt-5 mb-4 text-center">
        <p className="text-[15px] text-[#475569]">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="inline-flex items-center gap-0.5 font-semibold text-[#0284C7] hover:underline"
          >
            Daftar Sekarang
          </Link>
        </p>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#eff4ff] p-4 shadow-sm">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#E0F2FE]">
          <Icon name="health_and_safety" filled className="text-[22px] text-[#0284C7]" />
        </div>
        <div className="flex min-w-0 flex-col">
          <h3 className="text-[13px] font-semibold leading-tight text-[#0F172A]">
            Keamanan Data Terenkripsi
          </h3>
          <p className="mt-0.5 text-[12px] leading-snug text-[#94A3B8]">
            Tersertifikasi Keamanan Data Medis &amp; Tanpa Iklan Mengganggu.
          </p>
        </div>
      </div>
    </div>
  );
}
