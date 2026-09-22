import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Disclaimer medis. Ditampilkan sekali per halaman growth/feeding —
 * bukan di setiap kartu, agar aplikasi tetap nyaman dipakai.
 */
export function MedicalDisclaimer({ className }: { className?: string }) {
  return (
    <Alert className={className}>
      <Info className="size-4" aria-hidden />
      <AlertDescription>
        Informasi pada aplikasi ini digunakan untuk membantu pencatatan dan pemantauan pertumbuhan
        anak dan bukan pengganti diagnosis, pemeriksaan, atau rekomendasi dokter, dokter anak,
        bidan, maupun tenaga kesehatan.
      </AlertDescription>
    </Alert>
  );
}
