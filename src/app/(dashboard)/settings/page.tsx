import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { listChildrenWithLatestForViewer, listSharesByOwner } from "@/lib/data/children";
import { LogoutButton } from "@/components/logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { EditProfileDialog } from "@/components/settings/edit-profile-dialog";
import { PartnerAccessDialog } from "@/components/settings/partner-access-dialog";
import { SettingsChildCard } from "@/components/settings/settings-child-card";

export const metadata: Metadata = { title: "Profil" };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

export default async function SettingsPage() {
  const user = await requireUser();

  const [[row], children, shares] = await Promise.all([
    db
      .select({ phone: users.phone, passwordHash: users.passwordHash, photoKey: users.photoKey })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1),
    listChildrenWithLatestForViewer(user.id),
    listSharesByOwner(user.id),
  ]);

  const owned = children.filter((c) => c.role === "OWNER");
  const shareRows = shares.map((s) => ({
    id: s.share.id,
    childName: s.childName,
    inviteeEmail: s.share.inviteeEmail,
    status: s.share.status,
    expiresAt: s.share.expiresAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* Parent Profile Card */}
      <section className="bg-card flex flex-col gap-4 rounded-2xl border p-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <Avatar className="bg-accent ring-primary/20 size-14 ring-2 after:hidden">
              {row?.photoKey && (
                <AvatarImage
                  src={`/user/photo?v=${encodeURIComponent(row.photoKey)}`}
                  alt={`Foto ${user.name}`}
                />
              )}
              <AvatarFallback className="bg-accent text-accent-foreground text-headline-md">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="bg-[var(--color-status-normal)] ring-card absolute right-0 bottom-0 size-3.5 rounded-full ring-2" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="text-headline-sm truncate">{user.name}</h2>
              <span className="bg-accent text-primary text-label-sm inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-bold">
                <Icon name="verified" className="text-[12px]" />
                PWA Terverifikasi
              </span>
            </div>
            <p className="text-muted-foreground text-body-sm mt-0.5 truncate">{user.email}</p>
            <span className="text-muted-foreground text-label-sm mt-1 inline-flex items-center gap-1">
              {row?.phone && (
                <>
                  <Icon name="smartphone" className="text-[12px]" />
                  {row.phone}
                  <span aria-hidden>•</span>
                </>
              )}
              {owned.length} Profil Anak Terdaftar
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <EditProfileDialog
            name={user.name}
            email={user.email}
            phone={row?.phone ?? null}
            hasPassword={!!row?.passwordHash}
            initials={initials(user.name)}
            photoKey={row?.photoKey ?? null}
          />
          <PartnerAccessDialog childCount={owned.length} shares={shareRows} />
        </div>
      </section>

      {/* Multi-Child Management */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Icon name="child_care" className="text-primary text-[16px]" />
            <span className="text-muted-foreground text-label-sm font-bold uppercase tracking-wider">
              PROFIL ANAK SAYA ({children.length})
            </span>
          </div>
          <Link
            href="/children/new"
            className="bg-accent text-primary text-label-sm inline-flex h-8 items-center gap-1 rounded-full px-3 font-bold active:scale-95"
          >
            <Icon name="add" className="text-[14px]" />
            Tambah Anak
          </Link>
        </div>

        {children.length === 0 ? (
          <div className="bg-card rounded-2xl border p-4 shadow-sm">
            <p className="text-muted-foreground text-body-sm">Belum ada profil anak.</p>
          </div>
        ) : (
          children.map(({ child, latestWeightKg, latestLengthHeightCm, latestHeadCircumferenceCm }) => (
            <SettingsChildCard
              key={child.id}
              child={child}
              latest={{
                weightKg: latestWeightKg,
                lengthHeightCm: latestLengthHeightCm,
                headCircumferenceCm: latestHeadCircumferenceCm,
              }}
            />
          ))
        )}
      </section>

      {/* Referensi & Perhitungan Medis */}
      <section className="flex flex-col gap-2">
        <span className="text-muted-foreground text-label-sm font-bold uppercase tracking-wider px-1">
          REFERENSI &amp; PERHITUNGAN MEDIS
        </span>
        <div className="bg-card rounded-2xl border p-4 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-body-md font-bold block">Standar Kurva Pertumbuhan</span>
              <p className="text-muted-foreground text-body-sm">Standar Baku WHO &amp; Kurva Fenton Preterm</p>
            </div>
            <Icon name="chevron_right" className="text-muted-foreground text-[20px]" />
          </div>

          <div className="bg-border h-px" />

          <div className="flex items-center justify-between">
            <div>
              <span className="text-body-md font-bold block">Jadwal Imunisasi Acuan</span>
              <p className="text-muted-foreground text-body-sm">Jadwal Resmi IDAI 2024 &amp; Kemenkes RI</p>
            </div>
            <Icon name="chevron_right" className="text-muted-foreground text-[20px]" />
          </div>
        </div>
      </section>

      {/* Aplikasi */}
      <section className="flex flex-col gap-2">
        <span className="text-muted-foreground text-label-sm font-bold uppercase tracking-wider px-1">
          APLIKASI &amp; INFORMASI
        </span>
        <div className="bg-card rounded-2xl border p-4 shadow-sm space-y-3.5">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-body-md font-bold">Status PWA</span>
              <span className="bg-accent text-primary text-label-sm rounded px-1.5 py-0.5 font-bold">Aktif</span>
            </div>
            <p className="text-muted-foreground text-body-sm mt-0.5">Bekerja penuh secara offline di perangkat</p>
          </div>

          <div className="bg-border h-px" />

          <div>
            <span className="text-body-md font-bold block">Pasang Aplikasi</span>
            <div className="text-muted-foreground text-body-sm mt-1 space-y-1.5">
              <p>
                <span className="text-foreground font-semibold">Android (Chrome):</span> buka menu
                titik tiga, pilih <em>Tambahkan ke layar utama</em>.
              </p>
              <p>
                <span className="text-foreground font-semibold">iPhone/iPad (Safari):</span> ketuk
                tombol Bagikan, lalu pilih <em>Tambahkan ke Layar Utama</em>.
              </p>
            </div>
          </div>

          <div className="bg-border h-px" />

          <div>
            <span className="text-body-md font-bold block">Tentang</span>
            <div className="text-muted-foreground text-body-sm mt-1 space-y-1">
              <p>
                Tumbuh Kembang Anak adalah alat pencatatan dan pemantauan, bukan alat diagnosis
                medis.
              </p>
              <p>
                Perhitungan usia mengikuti AAP, <em>Age Terminology During the Perinatal Period</em>,
                Pediatrics 2004;114(5):1362–1364.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Logout */}
      <div className="pt-2">
        <LogoutButton
          variant="outline"
          className="w-full h-12 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-body-md"
        />
      </div>

      <footer className="text-muted-foreground text-label-sm pt-2 text-center">
        Tumbuh Kembang Anak • Buku KIA Digital (Next.js PWA)
      </footer>
    </div>
  );
}
