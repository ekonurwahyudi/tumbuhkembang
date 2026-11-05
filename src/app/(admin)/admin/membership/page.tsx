import type { Metadata } from "next";
import { listMembershipLimits } from "@/lib/data/membership";
import { MembershipLimitForm } from "@/components/admin/membership-limit-form";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Keanggotaan" };

/** Query DB di tingkat atas, dan build Docker tidak punya DB. */
export const dynamic = "force-dynamic";

const TIER_LABEL: Record<string, string> = {
  FREEMIUM: "Freemium",
  VIP: "VIP",
  VVIP: "VVIP",
};

export default async function AdminMembershipPage() {
  const rows = await listMembershipLimits();

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex items-center gap-1.5 px-1">
        <Icon name="badge" className="text-primary text-[16px]" />
        <span className="text-muted-foreground text-label-sm font-bold tracking-wider uppercase">
          BATAS KEANGGOTAAN
        </span>
      </div>

      <p className="text-muted-foreground text-body-sm px-1">
        Batas berlaku untuk semua akun pada paket itu. Kosongkan untuk tanpa batas.
        Perubahan langsung berlaku tanpa pemiliknya login ulang.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {rows.map((row) => (
          <MembershipLimitForm
            key={row.tier}
            tier={row.tier}
            label={TIER_LABEL[row.tier] ?? row.tier}
            registryMax={row.registryMax}
          />
        ))}
      </div>
    </div>
  );
}
