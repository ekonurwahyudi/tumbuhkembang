import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
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
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="bg-background text-foreground flex min-h-full flex-col">
        {children}
        <ServiceWorkerRegister />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
