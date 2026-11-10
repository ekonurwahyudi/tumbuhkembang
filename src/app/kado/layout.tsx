import type { Metadata } from "next";

/**
 * Dapat dibuka tanpa akun — memang itu gunanya — tapi memuat nama anak, jadi
 * tidak boleh berakhir di hasil pencarian. robots.txt hanya menghalangi
 * perayapan; `noindex` juga menutup jalur tautan dari luar.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Layout({ children }: LayoutProps<"/">) {
  return children;
}
