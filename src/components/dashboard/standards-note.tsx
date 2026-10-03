import { Icon } from "@/components/ui/icon";

/**
 * Catatan acuan di kaki beranda. Bukan `MedicalDisclaimer` yang sudah ada:
 * komponen itu `Alert` satu kalimat untuk halaman grafik, sedangkan di sini yang
 * dibutuhkan adalah menyebut acuannya sekaligus batasnya, sekali, di paling bawah.
 *
 * Tiga nama standarnya memang yang dipakai aplikasi ini: WHO Child Growth
 * Standards 2006 (`lib/growth/who.ts`), Fenton 2013 untuk prematur
 * (`lib/growth/fenton.ts`), dan jadwal imunisasi IDAI (`lib/immunization/catalog.ts`).
 * Jangan menambah nama standar ke sini tanpa ada datanya di repo.
 */
export function StandardsNote() {
  return (
    <aside className="bg-accent text-accent-foreground mt-2 rounded-2xl p-4">
      <h2 className="text-body-md text-primary flex items-center gap-1.5 font-bold">
        <Icon name="verified_user" filled className="text-[18px]" />
        Standar IDAI, Fenton 2013 &amp; WHO 2006
      </h2>
      <p className="text-body-sm mt-1.5 opacity-80">
        Aplikasi ini sarana pemantauan tumbuh kembang mandiri keluarga. Hasil kurvanya bukan
        pengganti diagnosis, pemeriksaan, atau rekomendasi dokter spesialis anak (Sp.A), bidan,
        maupun tenaga kesehatan lain.
      </p>
    </aside>
  );
}
