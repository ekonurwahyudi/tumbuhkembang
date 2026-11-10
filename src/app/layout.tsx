import type { Metadata, Viewport } from "next";
import { Geist_Mono, Onest } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { Toaster } from "@/components/ui/sonner";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
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
  /*
    Wajib ada sebelum openGraph.images boleh memakai path relatif: tanpa ini
    build gagal, dan kartu yang dibagikan akan menunjuk URL yang tidak lengkap.
    Diambil dari env supaya preview/staging tidak mengiklankan domain produksi.
  */
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — ${SITE_TAGLINE}`, template: "%s · Kembangku" },
  description: SITE_DESCRIPTION,
  applicationName: "Kembangku",
  keywords: [
    "tumbuh kembang anak",
    "grafik WHO",
    "kurva Fenton",
    "usia koreksi bayi prematur",
    "jadwal imunisasi anak",
    "KPSP",
    "catatan pertumbuhan bayi",
    "berat badan anak",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Kembangku", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Kembangku",
    locale: "id_ID",
    url: "/",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  /*
    Halaman di balik login menimpanya dengan noindex sendiri; yang di sini hanya
    default untuk halaman publik. robots.txt melengkapi, bukan menggantikan —
    keduanya cuma permintaan, penjaga sebenarnya tetap autentikasi.
  */
  robots: { index: true, follow: true },
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
