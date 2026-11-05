import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getChildForViewer } from "@/lib/data/children";
import { listKpspAnswers } from "@/lib/data/kpsp";
import { KPSP_ENABLED_AGES, KPSP_FORMS, KPSP_VERSION } from "@/lib/kpsp/catalog";
import { kpspAge } from "@/lib/kpsp/evaluation";
import { todayYMD } from "@/lib/growth/age";
import { KpspChecklist } from "@/components/kpsp/kpsp-checklist";
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
  const answers = allowed ? await listKpspAnswers(user.id, id, form.ageMonths) : [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 pt-2 pb-8">
      <Link href={`/children/${id}`} className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1 text-sm">
        <Icon name="arrow_back" className="text-[18px]" /> Profil {child.name}
      </Link>

      {!allowed ? (
        <section className="bg-card rounded-2xl p-6 shadow-sm">
          <h1 className="text-headline-sm">Khusus member VIP dan VVIP</h1>
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
