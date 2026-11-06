import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getChildForViewer, listChildrenForViewer } from "@/lib/data/children";
import { listKpspAnswers } from "@/lib/data/kpsp";
import { KPSP_ENABLED_AGES, KPSP_FORMS, KPSP_VERSION } from "@/lib/kpsp/catalog";
import { kpspAge } from "@/lib/kpsp/evaluation";
import { chronologicalAge, formatAgeDetailed, todayYMD } from "@/lib/growth/age";
import { KpspChecklist } from "@/components/kpsp/kpsp-checklist";
import { ChildHero } from "@/components/children/child-hero";
import { ChildPicker } from "@/components/children/child-picker";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Skrining Perkembangan KPSP" };
export const dynamic = "force-dynamic";

export default async function KpspPage({ params, searchParams }: PageProps<"/children/[id]/kpsp">) {
  const { id } = await params;
  const { usia } = await searchParams;
  const user = await requireUser();
  const viewer = await getChildForViewer(user.id, id);
  if (!viewer) notFound();
  const child = viewer.child;
  const age = kpspAge(child, todayYMD());

  // Usia anak hanya menentukan tab mana yang terbuka lebih dulu, bukan apa yang
  // boleh diisi: orang tua bisa membaca dan mencentang formulir usia mana pun.
  const suggested = [...KPSP_ENABLED_AGES].reverse().find((a) => a <= (age?.roundedMonths ?? 0)) ?? KPSP_ENABLED_AGES[0];
  const selected = typeof usia === "string" && KPSP_ENABLED_AGES.some((a) => String(a) === usia)
    ? Number(usia)
    : suggested;
  const form = KPSP_FORMS.find((f) => f.ageMonths === selected)!;

  const allowed = user.membershipTier === "VIP" || user.membershipTier === "VVIP";
  const [answers, siblings] = await Promise.all([
    allowed ? listKpspAnswers(user.id, id, form.ageMonths) : [],
    listChildrenForViewer(user.id),
  ]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 pt-2 pb-8">
      {/* Kartu identitas yang sama dengan halaman profil — termasuk catatan usia
          terkoreksi untuk anak prematur, yang di sini justru menentukan formulir
          usia mana yang terbuka. Di sebelah tombol ubah: ganti anak, supaya tidak
          perlu kembali ke beranda hanya untuk berpindah. */}
      <ChildHero
        child={child}
        action={
          <div className="flex shrink-0 items-center gap-0.5">
            <ChildPicker
              activeId={id}
              items={siblings.map(({ child: c }) => ({
                id: c.id,
                name: c.name,
                photoKey: c.photoKey,
                caption: formatAgeDetailed(chronologicalAge(c.dateOfBirth)),
                href: `/children/${c.id}/kpsp`,
              }))}
            />
            {viewer.role === "OWNER" && (
              <Button asChild variant="ghost" size="icon-sm" aria-label="Ubah profil anak">
                <Link href={`/children/${id}/edit`}>
                  <Icon name="edit" className="text-[18px]" />
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {!allowed ? (
        <section className="bg-card rounded-2xl p-6 shadow-sm">
          <h2 className="text-headline-sm">Khusus member VIP dan VVIP</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Member Freemium belum dapat mengisi skrining KPSP. Hubungi admin untuk perubahan status keanggotaan.
          </p>
        </section>
      ) : (
        <>
          <KpspChecklist
            key={form.ageMonths}
            childId={id}
            name={child.name}
            form={form}
            ages={KPSP_ENABLED_AGES}
            answers={answers.filter((a) => a.catalogVersion === KPSP_VERSION)}
            preterm={child.birthType === "PRETERM"}
          />
          {age && age.roundedMonths < form.ageMonths && (
            <p className="text-muted-foreground px-1 text-xs leading-relaxed">
              {child.name} baru berusia {age.roundedMonths} bulan. Formulir usia {form.ageMonths} bulan tetap
              dapat diisi, tetapi hasilnya baru berarti bila dikerjakan pada usia tersebut.
            </p>
          )}
        </>
      )}

      <p className="text-muted-foreground px-1 text-xs leading-relaxed">
        Pertanyaan disalin dari Buku Bagan SDIDTK Kemenkes RI revisi 22 Agustus 2022. Pra-skrining
        bukan diagnosis. Bila ada kekhawatiran terhadap perkembangan anak, temui dokter atau tenaga
        kesehatan meski hasil skrining tampak sesuai.
      </p>
    </div>
  );
}
