import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { pushPublicKey } from "@/lib/push";
import { listChildrenWithLatestForViewer } from "@/lib/data/children";
import { listMeasurements } from "@/lib/data/measurements";
import { listVaccinations } from "@/lib/data/vaccinations";
import { listReminders } from "@/lib/data/vaccine-reminders";
import { hasSubscription, unreadCount } from "@/lib/data/notifications";
import { listRegistryItems, registrySummary } from "@/lib/data/registry";
import { listShopProducts } from "@/lib/data/shop";
import { listFavoriteIds } from "@/lib/data/shop-favorites";
import { listSkippedCatalogKeys } from "@/lib/data/vaccination-skips";
import { evaluateMeasurement } from "@/lib/growth/engine";
import { chronologicalAge, formatAgeDetailed } from "@/lib/growth/age";
import { upcomingVaccines, vaccineSchedule } from "@/lib/immunization/schedule";
import { syncVaccineNotifications } from "@/lib/notifications/vaccine-sync";
import { UserAvatar } from "@/components/layout/account-menu";
import { AgeCard } from "@/components/dashboard/age-card";
import { ChildSwitcher } from "@/components/dashboard/child-switcher";
import { GrowthHighlight } from "@/components/dashboard/growth-highlight";
import { QuickAccess } from "@/components/dashboard/quick-access";
import { PushPrompt } from "@/components/notifications/push-prompt";
import { RegistryStrip } from "@/components/dashboard/registry-strip";
import { ShopStrip } from "@/components/dashboard/shop-strip";
import { StandardsNote } from "@/components/dashboard/standards-note";
import { VaccineSlider } from "@/components/dashboard/vaccine-slider";
import { EmptyState } from "@/components/empty-state";
import { InstallPrompt } from "@/components/install-prompt";
import { MeasurementDialog } from "@/components/measurements/measurement-dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Beranda" };

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const user = await requireUser();
  const { anak } = await searchParams;
  // Lonceng di sapaan butuh ini di kedua cabang, termasuk yang belum punya anak.
  const [items, unread] = await Promise.all([
    listChildrenWithLatestForViewer(user.id),
    unreadCount(user.id),
  ]);

  const greeting = (
    <Greeting name={user.name} photoKey={user.photoKey} unread={unread} />
  );

  if (items.length === 0)
    return (
      <div className="flex flex-col gap-4 pt-2">
        <InstallPrompt />
        {greeting}
        <EmptyState
          icon="child_care"
          title="Belum ada data anak."
          description="Tambahkan profil anak untuk mulai memantau pertumbuhannya."
          action={
            <Button asChild>
              <Link href="/children/new">
                <Icon name="add" className="text-[18px]" />
                Tambah Anak
              </Link>
            </Button>
          }
        />
      </div>
    );

  const selectedId = typeof anak === "string" ? anak : undefined;
  const active = items.find((i) => i.child.id === selectedId) ?? items[0];
  const child = active.child;

  // Hanya anak aktif yang ditarik detailnya — bukan semua anak di carousel.
  const [
    measurements,
    vaccinations,
    skippedKeys,
    reminders,
    registryRows,
    shopProducts,
    favoriteIds,
    pushSubscribed,
  ] = await Promise.all([
    listMeasurements(user.id, child.id, "desc"),
    listVaccinations(user.id, child.id),
    listSkippedCatalogKeys(user.id, child.id),
    listReminders(user.id, child.id),
    // Daftar utuh, bukan registryClaimCount: strip List Kado butuh barangnya, dan
    // badge klaim di Akses Cepat tinggal dijumlahkan dari baris yang sama.
    listRegistryItems(user.id),
    // Katalog milik bersama, jadi tidak ber-scope anak aktif. Lima, sejumlah kolom
    // grid-nya di desktop: yang keenam akan berdiri sendirian di baris kedua.
    listShopProducts({ limit: 5 }),
    listFavoriteIds(user.id),
    // Nilai awal saja; PushPrompt memverifikasinya ke browser setelah terhidrasi.
    hasSubscription(user.id),
  ]);

  const claimCount = registryRows.reduce((n, r) => n + r.claims.length, 0);

  const latest = measurements[0];
  const currentWeightGrams =
    latest?.weightKg != null ? Math.round(Number(latest.weightKg) * 1000) : child.birthWeightGrams;
  const schedule = vaccineSchedule({ child, vaccinations, skippedKeys, currentWeightGrams });

  // Jadwal vaksin tidak punya pemicu waktu di aplikasi ini; pemberitahuannya lahir
  // dari jadwal yang baru saja dihitung. Aman diulang: dedupeKey berisi tanggal
  // target, jadi satu dosis menghasilkan tepat satu pemberitahuan.
  await syncVaccineNotifications(user.id, child.name, child.id, schedule);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <InstallPrompt />

      {/* Setelah InstallPrompt, dan salah satunya selalu diam: di iPhone dalam tab
          push belum mungkin, jadi memasang dulu yang benar. */}
      <PushPrompt subscribed={pushSubscribed} publicKey={pushPublicKey()} />

      {greeting}

      <ChildSwitcher
        activeId={child.id}
        items={items.map(({ child: c }) => ({
          id: c.id,
          name: c.name,
          photoKey: c.photoKey,
          caption: formatAgeDetailed(chronologicalAge(c.dateOfBirth)),
          preterm: c.birthType === "PRETERM",
        }))}
      />

      <AgeCard name={child.name} child={child} />

      {latest ? (
        <GrowthHighlight
          childId={child.id}
          minDate={child.dateOfBirth}
          latest={latest}
          previous={measurements[1]}
          outcomes={evaluateMeasurement(child, latest)}
          intake={{
            weightKg: latest.weightKg != null ? Number(latest.weightKg) : null,
            dateOfBirth: child.dateOfBirth,
            birthType: child.birthType,
            gestationalAgeWeeks: child.gestationalAgeWeeks,
            gestationalAgeDays: child.gestationalAgeDays,
          }}
        />
      ) : (
        <EmptyState
          icon="straighten"
          title="Belum ada pengukuran."
          description={`Catat berat, panjang, dan lingkar kepala ${child.name} untuk mulai grafiknya.`}
          action={<MeasurementDialog childId={child.id} minDate={child.dateOfBirth} />}
        />
      )}

      <QuickAccess childId={child.id} registryClaims={claimCount} />

      <VaccineSlider
        childId={child.id}
        child={child}
        entries={upcomingVaccines(schedule, new Map(reminders.map((r) => [r.catalogKey, r])))}
        givenCount={schedule.filter((e) => e.status === "given").length}
        reminders={reminders}
      />

      {/* Enam terbaru saja — sisanya di /registry, dan strip beranda yang panjang
          membuat orang menggulir melewati katalog di bawahnya. */}
      <RegistryStrip rows={registryRows.slice(0, 5)} summary={registrySummary(registryRows)} />

      <ShopStrip products={shopProducts} favoriteIds={favoriteIds} />

      <StandardsNote />
    </div>
  );
}

/**
 * Sapaan beranda. Di HP ini juga menggantikan header aplikasi yang disembunyikan
 * (lihat `AppHeader`): avatar pindah ke kiri nama dan menautkan langsung ke
 * /settings, dan lonceng di kanan menggantikan hati yang dulu hanya hiasan —
 * keduanya jalan masuk yang sebelumnya hanya ada di header itu.
 *
 * Di desktop headernya kembali, jadi keduanya `md:hidden`: dua avatar dan dua lonceng
 * dalam satu layar terbaca sebagai dua kendali berbeda untuk tujuan yang sama.
 */
function Greeting({
  name,
  photoKey,
  unread,
}: {
  name: string;
  photoKey?: string | null;
  unread: number;
}) {
  return (
    <header className="flex items-center gap-3">
      {/* Tautan langsung ke /settings, bukan pembuka dropdown: menunya hanya berisi
          Pengaturan, Superadmin, dan Keluar — ketiganya kini ada DI DALAM halaman
          Pengaturan itu sendiri, jadi dropdownnya cuma satu ketukan tambahan menuju
          tempat yang sama.

          size-10, sama dengan loncengnya di ujung lain baris: dua lingkaran sebesar
          sama membingkai sapaan di antaranya. */}
      <Link
        href="/settings"
        aria-label="Profil & pengaturan"
        className="-ml-1.5 shrink-0 md:hidden"
      >
        <UserAvatar name={name} photoKey={photoKey} className="size-10" />
      </Link>

      <div className="min-w-0 flex-1">
        {/* Di HP satu takik lebih kecil (headline-md, 17px): di sini judulnya berbagi
            baris dengan avatar dan lonceng, dan pada 22px nama yang agak panjang
            langsung terpotong. Di desktop ia berdiri sendiri, jadi headline-lg. */}
        <h1 className="text-headline-md md:text-headline-lg truncate">Halo, {name}! 👋</h1>
        <p className="text-muted-foreground text-label-sm md:text-body-sm mt-0.5 truncate">
          Semangat merawat si kecil
        </p>
      </div>

      <Link
        href="/notifikasi"
        aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}
        className="bg-accent text-primary relative grid size-10 shrink-0 place-items-center rounded-full shadow-sm md:hidden"
      >
        <Icon name="notifications" filled className="text-[20px]" />
        {unread > 0 && (
          /* Angkanya tertulis dan ikut di aria-label: warna bukan satu-satunya penanda. */
          <span className="bg-destructive ring-background absolute -top-0.5 -right-0.5 grid min-w-[18px] place-items-center rounded-full px-1 text-[10px] leading-[16px] font-bold text-white ring-2">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
    </header>
  );
}

