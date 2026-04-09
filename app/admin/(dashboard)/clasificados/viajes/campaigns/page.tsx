import Link from "next/link";

import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminCardBase, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";

import { AdminViajesCampaignsPlanner } from "./AdminViajesCampaignsPlanner";

export default function AdminViajesCampaignsPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Viajes · merchandising"
        title="Campaigns / Seasonal"
        subtitle="Time-bound buckets: Verano, Último minuto, Cruceros del mes, Escapadas románticas, Viajes familiares, Renta de autos, and more. Use the staging grid below to plan what attaches where — persistence ships with the next backend phase."
        helperText="Keep affiliate cards, business offers, and editorial pieces in separate lanes when assigning; campaign storytelling should not blur disclosures."
      />

      <AdminViajesCampaignsPlanner />

      <div className={`${adminCardBase} p-5 text-sm text-[#5C5346]`}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#A67C52]">How this feeds Viajes</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>Campaign ids align with affiliate form “seasonal campaign assignment” and future business tagging.</li>
          <li>Homepage + results modules can query by campaign + placement flags without a heavy merch engine.</li>
          <li>Editorial slots reserve space for Leonix guides that amplify a seasonal theme without posing as listings.</li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin/clasificados/viajes/affiliate-cards" className={adminCtaChipSecondary}>
            Affiliate Cards
          </Link>
          <Link href="/admin/clasificados/viajes/business-offers" className={adminCtaChipSecondary}>
            Business Offers
          </Link>
          <Link href="/admin/clasificados/viajes/editorial" className={adminCtaChipSecondary}>
            Editorial / Guides
          </Link>
        </div>
      </div>
    </>
  );
}
