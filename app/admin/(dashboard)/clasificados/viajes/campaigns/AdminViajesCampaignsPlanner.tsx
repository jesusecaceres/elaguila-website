"use client";

import { useMemo, useState } from "react";

import { adminCardBase, adminCtaChipSecondary, adminInputClass } from "@/app/admin/_components/adminTheme";
import { ADMIN_VIAJES_CAMPAIGNS_MOCK } from "@/app/admin/_lib/adminViajesCampaignsMock";

type Lane = "affiliate" | "business" | "editorial";

const LANE_LABEL: Record<Lane, string> = {
  affiliate: "Affiliate cards",
  business: "Business offers",
  editorial: "Editorial / guides",
};

/**
 * Staging UI for attaching inventory ids to campaigns — selections are in-memory only until backend wiring.
 */
export function AdminViajesCampaignsPlanner() {
  const [draftAssignments, setDraftAssignments] = useState<Record<string, Partial<Record<Lane, string>>>>({});

  const campaigns = useMemo(() => ADMIN_VIAJES_CAMPAIGNS_MOCK, []);

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {campaigns.map((c) => (
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

          <div className="mt-4 space-y-2 rounded-xl border border-dashed border-[#D8C79A]/60 bg-[#FFFCF7]/80 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">Staging — plan assignments</p>
            <p className="text-[10px] text-[#7A7164]">Paste internal ids or slugs you intend to attach. Nothing is saved server-side in this pass.</p>
            {(Object.keys(LANE_LABEL) as Lane[]).map((lane) => (
              <label key={lane} className="block">
                <span className="text-[10px] font-bold uppercase text-[#7A7164]">{LANE_LABEL[lane]}</span>
                <input
                  className={`${adminInputClass} mt-1 text-xs`}
                  placeholder={`e.g. ${lane === "affiliate" ? "aff-card-…" : lane === "business" ? "biz-offer-…" : "edit-…"}`}
                  value={draftAssignments[c.id]?.[lane] ?? ""}
                  onChange={(e) =>
                    setDraftAssignments((prev) => ({
                      ...prev,
                      [c.id]: { ...prev[c.id], [lane]: e.target.value },
                    }))
                  }
                />
              </label>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={adminCtaChipSecondary} disabled title="Staged — persistence next phase">
              Save plan (staged)
            </button>
            <span className="text-[11px] text-[#7A7164]">campaign: {c.id}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
