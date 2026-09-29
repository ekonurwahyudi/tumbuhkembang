import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { RegisterForm } from "@/components/auth/register-form";
import { AuthDivider, GoogleButton } from "@/components/auth/google-auth";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Daftar" };

export default function RegisterPage() {
  return (
    <div className="flex flex-col pb-10">
        {/* Brand showcase */}
        <div className="mt-2 mb-6 flex flex-col items-center text-center">
          <div className="relative mb-3 grid size-16 place-items-center rounded-2xl bg-white p-2 shadow-md">
            <Image
              src="/brand-logo.png"
              alt="Logo Tumbuh Kembang"
              width={64}
              height={64}
              className="size-full object-contain"
            />
            <div className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-[#FEF08A] shadow-sm">
              <Icon name="favorite" filled className="text-[14px] text-[#805600]" />
            </div>
          </div>
          <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#E0F2FE] px-3 py-1">
            <Icon name="verified" filled className="text-[15px] text-[#006194]" />
            <span className="text-[11px] font-medium tracking-[0.02em] text-[#006194]">
              Gratis Selamanya untuk 1 Anak
            </span>
          </div>
          <h2 className="text-[24px] font-bold tracking-tight text-[#0F172A]">Daftar Akun Baru</h2>
          <p className="mt-1 max-w-[300px] text-[15px] leading-relaxed text-[#475569]">
            Mulai pantau grafik WHO &amp; Fenton, asupan nutrisi, dan imunisasi si kecil.
          </p>
        </div>

        <div className="mb-5 w-full">
          <GoogleButton label="Daftar Cepat dengan Google" variant="plain" />
        </div>

        <AuthDivider label="atau isi formulir pendaftaran" surface="page" />

        <RegisterForm />

        <div className="mt-5 mb-4 text-center">
          <p className="text-[15px] text-[#475569]">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="inline-flex items-center gap-0.5 font-semibold text-[#0284C7] hover:underline"
            >
              Masuk di sini
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
