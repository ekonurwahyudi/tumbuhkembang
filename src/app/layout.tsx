import type { Metadata, Viewport } from "next";
import { Geist_Mono, Onest } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

/*
  `next/font/google` mengunduh font saat build dan menyajikannya dari domain
  sendiri — bukan <link> ke fonts.googleapis.com. Jadi tidak ada permintaan ke
  pihak ketiga saat halaman dibuka, tidak ada preconnect yang perlu ditulis, dan
  `display: "swap"` sudah bawaannya.

  Onest punya variable weight 100–900; `axes` tidak perlu disebut karena berat
  adalah sumbu bawaannya. Yang dipakai repo ini cuma 400/600/700, tapi satu
  berkas variable tetap lebih kecil daripada tiga berkas statis.
*/
const onest = Onest({ variable: "--font-onest", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Tumbuh Kembang Anak", template: "%s · Tumbuh Kembang" },
  description:
    "Catat dan pantau pertumbuhan anak — berat, tinggi, lingkar kepala, dan asupan — untuk bayi cukup bulan maupun prematur.",
  applicationName: "Tumbuh Kembang",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Tumbuh Kembang", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#006194",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${onest.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="bg-background text-foreground flex min-h-full flex-col">
        {children}
        <ServiceWorkerRegister />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
