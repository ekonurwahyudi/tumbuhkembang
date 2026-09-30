import type { Metadata } from "next";
import { findClaimByToken } from "@/lib/data/registry";
import { TrackingForm } from "@/components/registry/tracking-form";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Bukti Pengiriman Kado" };

/**
 * Pengklaim mengirim bukti pengirimannya — nomor resi atau foto barangnya.
 * `claimToken` di URL adalah satu-satunya otorisasinya — tidak ada akun untuk
 * diperiksa. Token yang tidak dikenal dijawab halaman ramah, sama seperti halaman
 * publiknya.
 */
export default async function ClaimTrackingPage({
  params,
}: PageProps<"/kado/[token]/klaim/[claimToken]">) {
  const { token, claimToken } = await params;
  const row = await findClaimByToken(claimToken);

  // Token klaim harus benar-benar milik registry di URL ini, bukan hanya ada.
  if (!row || row.registryToken !== token)
    return (
      <main className="bg-background flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <div className="bg-card flex size-16 items-center justify-center rounded-2xl shadow-sm">
          <Icon name="link" className="text-muted-foreground text-[32px]" />
        </div>
        <h1 className="text-headline-md mt-4">Tautan Klaim Tidak Valid</h1>
        <p className="text-muted-foreground text-body-sm mt-1 max-w-xs">
          Tautan ini tidak dikenal atau klaimnya sudah dihapus. Buka kembali wishlist-nya untuk
          mengklaim ulang.
        </p>
      </main>
    );

  const { claim, itemName } = row;

  return (
    <main className="bg-background min-h-dvh px-4 pt-10 pb-10">
      <div className="bg-card mx-auto w-full max-w-sm space-y-4 rounded-2xl border p-6 shadow-sm">
        <header className="text-center">
          <span className="bg-accent text-primary mx-auto grid size-14 place-items-center rounded-full">
            <Icon name="card_giftcard" filled className="text-[28px]" />
          </span>
          <h1 className="text-headline-md mt-3">Kado Anda</h1>
          <p className="text-muted-foreground text-body-sm mt-1">
            {itemName} · atas nama <strong>{claim.claimerName}</strong>
            {claim.qty > 1 && ` (${claim.qty} unit)`}
          </p>
        </header>

        {/* Satu ringkasan untuk kedua bentuk bukti, supaya tidak ada dua kotak sejenis. */}
        {(claim.trackingNumber || claim.photoKey) && (
          <p className="bg-accent text-primary text-body-sm flex items-start gap-2 rounded-xl p-3">
            <Icon name="check_circle" filled className="mt-0.5 text-[16px]" />
            <span>
              Bukti tersimpan
              {claim.trackingNumber ? (
                <>
                  : resi <strong>{claim.trackingNumber}</strong>
                </>
              ) : (
                ": foto barangnya"
              )}
              . Anda masih bisa memperbaikinya di bawah.
            </span>
          </p>
        )}

        <TrackingForm
          token={token}
          claimToken={claimToken}
          current={claim.trackingNumber}
          hasPhoto={claim.photoKey !== null}
        />

        <p className="text-muted-foreground text-xs">
          Simpan tautan halaman ini. Kami tidak punya akun Anda, jadi tidak bisa mengirimkannya
          ulang.
        </p>
      </div>
    </main>
  );
}
