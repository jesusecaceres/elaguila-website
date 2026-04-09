import Link from "next/link";

import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminCardBase, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";
import { ADMIN_VIAJES_CAMPAIGNS_MOCK } from "@/app/admin/_lib/adminViajesCampaignsMock";

export default function AdminViajesCampaignsPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Viajes · merchandising"
        title="Campaigns / Seasonal"
        subtitle="Time-bound buckets for homepage, results, and editorial rails. Slot counts are planning placeholders — assignment UI arrives with backend wiring."
        helperText="Affiliate cards, business offers, and editorial pieces can all point into the same campaign for coherent storytelling without blurring lane disclosures."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ADMIN_VIAJES_CAMPAIGNS_MOCK.map((c) => (
          <div key={c.id} className={`${adminCardBase} flex flex-col p-5`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{c.windowLabel}</p>
                <h3 className="mt-1 text-lg font-bold text-[#1E1810]">{c.titleEs}</h3>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  c.active ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-700"
                }`}
              >
                {c.active ? "Active" : "Planned"}
              </span>
            </div>
            <p className="mt-3 flex-1 text-sm text-[#5C5346]">{c.focus}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl border border-[#E8DFD0]/90 bg-[#FAF7F2]/90 px-2 py-2">
                <p className="font-bold text-[#1E1810]">{c.affiliateSlots}</p>
                <p className="text-[10px] font-semibold uppercase text-[#7A7164]">Affiliate</p>
              </div>
              <div className="rounded-xl border border-[#E8DFD0]/90 bg-[#FAF7F2]/90 px-2 py-2">
                <p className="font-bold text-[#1E1810]">{c.businessSlots}</p>
                <p className="text-[10px] font-semibold uppercase text-[#7A7164]">Business</p>
              </div>
              <div className="rounded-xl border border-[#E8DFD0]/90 bg-[#FAF7F2]/90 px-2 py-2">
                <p className="font-bold text-[#1E1810]">{c.editorialSlots}</p>
                <p className="text-[10px] font-semibold uppercase text-[#7A7164]">Editorial</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={adminCtaChipSecondary} disabled>
                Assign items (soon)
              </button>
              <span className="text-[11px] text-[#7A7164]">id: {c.id}</span>
            </div>
          </div>
        ))}
      </div>

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
