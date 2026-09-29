import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { acceptAllPendingSharesFromOwner, findShareByToken, getChild } from "@/lib/data/children";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Undangan Akses Anak" };

/** Halaman penerimaan undangan "Akses Pasangan" — di luar grup (dashboard). */
export default async function InvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  // Kedaluwarsa sudah disaring di query — sisanya hanya beda email/login.
  const share = await findShareByToken(token);

  if (!share)
    return (
      <main className="bg-surface flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <div className="bg-card flex size-16 items-center justify-center rounded-2xl shadow-sm">
          <Icon name="link" className="text-muted-foreground text-[32px]" />
        </div>
        <h1 className="text-headline-md mt-4">Undangan Tidak Valid</h1>
        <p className="text-muted-foreground text-body-sm mt-1 max-w-xs">
          Link undangan sudah kedaluwarsa atau tidak dikenal. Minta pemilik akun membuat
          undangan baru.
        </p>
      </main>
    );

  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    // Belum masuk: arahkan ke login, lalu kembali ke halaman ini.
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const email = session.user.email;
  if (email.toLowerCase() !== share.inviteeEmail.toLowerCase()) {
    return (
      <main className="bg-surface flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <div className="bg-card flex size-16 items-center justify-center rounded-2xl shadow-sm">
          <Icon name="alternate_email" className="text-muted-foreground text-[32px]" />
        </div>
        <h1 className="text-headline-md mt-4">Email Tidak Cocok</h1>
        <p className="text-muted-foreground text-body-sm mt-1 max-w-xs">
          Undangan ini ditujukan untuk <strong>{share.inviteeEmail}</strong>, sedangkan Anda
          masuk sebagai <strong>{email}</strong>. Keluar dan masuk kembali dengan email yang
          dituju.
        </p>
      </main>
    );
  }

  const child = await getChild(share.ownerId, share.childId);
  if (!child) redirect("/login");

  // Idempoten: link yang sudah diterima cukup diarahkan ke profil anak.
  if (share.status === "PENDING")
    await acceptAllPendingSharesFromOwner(share.ownerId, session.user.id, email);

  return (
    <main className="bg-surface flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="bg-card flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border p-6 shadow-sm">
        <div className="bg-accent text-primary flex size-14 items-center justify-center rounded-full">
          <Icon name="family_restroom" className="text-[28px]" />
        </div>
        <h1 className="text-headline-md">Undangan Diterima</h1>
        <p className="text-muted-foreground text-body-sm">
          Anda kini memiliki akses ke profil <strong>{child.name}</strong>: melihat riwayat
          serta mencatat pengukuran, asupan, dan imunisasi.
        </p>
        <Button asChild className="text-body-md h-12 w-full rounded-xl font-bold">
          <Link href={`/children/${child.id}`}>Buka Profil {child.name}</Link>
        </Button>
      </div>
    </main>
  );
}
