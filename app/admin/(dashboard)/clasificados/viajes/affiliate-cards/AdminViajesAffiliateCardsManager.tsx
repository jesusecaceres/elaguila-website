"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { adminBtnSecondary, adminCtaChipSecondary, adminInputClass } from "@/app/admin/_components/adminTheme";
import { ADMIN_VIAJES_AFFILIATE_OFFERS_MOCK } from "@/app/admin/_lib/adminViajesAffiliateOffersMock";
import type { AdminAffiliateOfferStatus } from "@/app/admin/_lib/adminViajesAffiliateTypes";
import { ADMIN_AFFILIATE_PLACEMENT_LABELS, type AdminAffiliatePlacement } from "@/app/admin/_lib/adminViajesAffiliateTypes";

function statusBadge(status: AdminAffiliateOfferStatus) {
  const map: Record<AdminAffiliateOfferStatus, string> = {
    live: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    draft: "bg-slate-100 text-slate-800 ring-slate-200",
    paused: "bg-amber-100 text-amber-950 ring-amber-200",
    expired: "bg-rose-100 text-rose-900 ring-rose-200",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${map[status]}`}>
      {status}
    </span>
  );
}

export function AdminViajesAffiliateCardsManager() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<AdminAffiliateOfferStatus | "all">("all");
  const [placement, setPlacement] = useState<AdminAffiliatePlacement | "all">("all");
  const [sort, setSort] = useState<"updated" | "rank" | "headline">("updated");

  const rows = useMemo(() => {
    let list = [...ADMIN_VIAJES_AFFILIATE_OFFERS_MOCK];
    if (status !== "all") list = list.filter((r) => r.status === status);
    if (placement !== "all") list = list.filter((r) => r.placements.includes(placement));
    const qq = q.trim().toLowerCase();
    if (qq) {
      list = list.filter(
        (r) =>
          r.headline.toLowerCase().includes(qq) ||
          r.partnerName.toLowerCase().includes(qq) ||
          r.destination.toLowerCase().includes(qq)
      );
    }
    list.sort((a, b) => {
      if (sort === "headline") return a.headline.localeCompare(b.headline);
      if (sort === "rank") return (b.featuredRank || 0) - (a.featuredRank || 0);
      return b.lastUpdated.localeCompare(a.lastUpdated);
    });
    return list;
  }, [q, status, placement, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-md">
          <label className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Search</label>
          <input
            className={adminInputClass}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Partner, headline, destination…"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase text-[#7A7164]">Status</label>
            <select
              className={`${adminInputClass} w-auto min-w-[8rem]`}
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
            >
              <option value="all">All</option>
              <option value="live">Live</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase text-[#7A7164]">Placement</label>
            <select
              className={`${adminInputClass} w-auto min-w-[10rem]`}
              value={placement}
              onChange={(e) => setPlacement(e.target.value as typeof placement)}
            >
              <option value="all">Any</option>
              {(Object.keys(ADMIN_AFFILIATE_PLACEMENT_LABELS) as AdminAffiliatePlacement[]).map((k) => (
                <option key={k} value={k}>
                  {ADMIN_AFFILIATE_PLACEMENT_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase text-[#7A7164]">Sort</label>
            <select
              className={`${adminInputClass} w-auto min-w-[8rem]`}
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
            >
              <option value="updated">Last updated</option>
              <option value="rank">Featured rank</option>
              <option value="headline">Headline A–Z</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#E8DFD0]/90 bg-white/95 shadow-sm">
        <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#E8DFD0]/90 bg-[#FAF7F2]/90 text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
              <th className="px-3 py-3">Partner</th>
              <th className="px-3 py-3">Headline</th>
              <th className="px-3 py-3">Destination</th>
              <th className="px-3 py-3">Origin</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">Duration</th>
              <th className="px-3 py-3">Label</th>
              <th className="px-3 py-3">Expiry</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Feat.</th>
              <th className="px-3 py-3">Placements</th>
              <th className="px-3 py-3">Updated</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-[#F0E8DC]/90 hover:bg-[#FFFCF7]/95">
                <td className="px-3 py-2.5 font-semibold text-[#1E1810]">{r.partnerName}</td>
                <td className="px-3 py-2.5 text-[#2C2416]">{r.headline}</td>
                <td className="px-3 py-2.5 text-[#5C5346]">{r.destination}</td>
                <td className="px-3 py-2.5 text-xs text-[#5C5346]">{r.departureContext}</td>
                <td className="px-3 py-2.5 text-xs">{r.offerType}</td>
                <td className="px-3 py-2.5 font-medium tabular-nums">{r.priceFrom}</td>
                <td className="px-3 py-2.5 text-xs">{r.duration}</td>
                <td className="px-3 py-2.5 text-xs text-[#6B5B2E]">{r.affiliateLabel}</td>
                <td className="px-3 py-2.5 text-xs tabular-nums text-[#5C5346]">{r.expiryDate ?? "—"}</td>
                <td className="px-3 py-2.5">{statusBadge(r.status)}</td>
                <td className="px-3 py-2.5 text-xs">
                  {r.featured ? <span className="font-bold text-amber-800">★ {r.featuredRank || "—"}</span> : "—"}
                </td>
                <td className="px-3 py-2.5 text-[10px] leading-snug text-[#5C5346]">
                  {r.placements.slice(0, 2).map((p) => (
                    <span key={p} className="mr-1 inline-block rounded bg-[#F3EBDD] px-1 py-0.5">
                      {ADMIN_AFFILIATE_PLACEMENT_LABELS[p]}
                    </span>
                  ))}
                  {r.placements.length > 2 ? <span className="text-[#7A7164]">+{r.placements.length - 2}</span> : null}
                </td>
                <td className="px-3 py-2.5 text-xs tabular-nums text-[#5C5346]">{r.lastUpdated}</td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-1">
                    <Link href={`/admin/clasificados/viajes/affiliate-cards/${r.id}/edit`} className="text-xs font-bold text-[#6B5B2E] underline">
                      Edit
                    </Link>
                    <button type="button" className="text-left text-xs font-semibold text-[#5C5346] hover:text-[#1E1810]" disabled>
                      Duplicate
                    </button>
                    <button type="button" className="text-left text-xs font-semibold text-[#5C5346] hover:text-[#1E1810]" disabled>
                      Pause
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[#7A7164]">
        Row actions are UI placeholders until mutations exist. Always label affiliate offers on the public site as commercial partner inventory.
      </p>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/clasificados/viajes/affiliate-cards/new" className={adminCtaChipSecondary}>
          + New affiliate offer
        </Link>
        <button type="button" className={adminBtnSecondary} disabled>
          Export CSV (soon)
        </button>
      </div>
    </div>
  );
}
