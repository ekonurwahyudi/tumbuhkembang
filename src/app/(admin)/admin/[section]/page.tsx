import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminSection } from "@/lib/admin-nav";
import { Icon } from "@/components/ui/icon";

/**
 * Halaman modul yang belum punya tabel maupun aturan. Rute statis (/admin/parents,
 * /admin/children) menang atas segmen dinamis ini, jadi modul yang sudah jalan tidak
 * pernah sampai ke sini.
 *
 * Sengaja tanpa tabel kosong atau angka nol palsu: halaman yang mengaku belum siap
 * lebih jujur daripada UI yang terlihat berfungsi padahal tidak menyimpan apa pun.
 */
export async function generateMetadata({
  params,
}: PageProps<"/admin/[section]">): Promise<Metadata> {
  const { section } = await params;
  return { title: adminSection(section)?.label ?? "Modul" };
}

export default async function AdminSectionPage({ params }: PageProps<"/admin/[section]">) {
  const { section } = await params;
  const mod = adminSection(section);
  if (!mod) notFound();

  return (
    <div className="flex flex-col gap-4 pt-2">
      <header className="flex items-center gap-2.5">
        <span className="bg-accent text-primary grid size-10 shrink-0 place-items-center rounded-full shadow-sm">
          <Icon name={mod.icon} />
        </span>
        <div className="min-w-0">
          <h1 className="text-headline-lg truncate">{mod.label}</h1>
          <p className="text-muted-foreground text-body-sm mt-0.5">{mod.description}</p>
        </div>
      </header>

      <div className="bg-card rounded-2xl border p-4 shadow-sm">
        <p className="text-body-sm font-bold">Belum tersedia</p>
        <p className="text-muted-foreground text-body-sm mt-1">
          Modul ini belum punya struktur data, jadi belum ada yang bisa dikelola. Beri tahu apa
          yang perlu disimpan di {mod.label.toLowerCase()} — misalnya field, alur, dan siapa yang
          boleh mengubahnya — dan modulnya dibangun berikutnya.
        </p>
      </div>
    </div>
  );
}
