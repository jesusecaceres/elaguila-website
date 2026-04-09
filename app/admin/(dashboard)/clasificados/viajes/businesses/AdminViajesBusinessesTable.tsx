"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { adminInputClass } from "@/app/admin/_components/adminTheme";
import { ADMIN_VIAJES_BUSINESSES_MOCK } from "@/app/admin/_lib/adminViajesBusinessesMock";
import type { AdminViajesBusinessStatus } from "@/app/admin/_lib/adminViajesBusinessesTypes";

function statusBadge(s: AdminViajesBusinessStatus) {
  const map: Record<AdminViajesBusinessStatus, string> = {
    active: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    paused: "bg-slate-100 text-slate-800 ring-slate-200",
    pending_review: "bg-amber-100 text-amber-950 ring-amber-200",
  };
  const label: Record<AdminViajesBusinessStatus, string> = {
    active: "Active",
    paused: "Paused",
    pending_review: "Pending review",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${map[s]}`}>
      {label[s]}
    </span>
  );
}

function planBadge(plan: "standard" | "plus") {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
        plan === "plus" ? "bg-[#2A2620] text-[#FAF7F2]" : "bg-[#F3EBDD] text-[#5C4E2E]"
      }`}
    >
      {plan === "plus" ? "Plus" : "Standard"}
    </span>
  );
}

export function AdminViajesBusinessesTable() {
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let list = [...ADMIN_VIAJES_BUSINESSES_MOCK];
    if (qq) {
      list = list.filter(
        (r) =>
          r.businessName.toLowerCase().includes(qq) ||
          r.destinationsServed.some((d) => d.toLowerCase().includes(qq))
      );
    }
    list.sort((a, b) => a.businessName.localeCompare(b.businessName));
    return list;
  }, [q]);

  return (
    <div className="space-y-4">
      <div className="flex max-w-md flex-col gap-2">
        <label className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Search</label>
        <input
          className={adminInputClass}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Business or destination…"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#E8DFD0]/90 bg-white/95 shadow-sm">
        <table className="min-w-[1020px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#E8DFD0]/90 bg-[#FAF7F2]/90 text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
              <th className="px-3 py-3">Business</th>
              <th className="px-3 py-3">Profile status</th>
              <th className="px-3 py-3">Plan</th>
              <th className="px-3 py-3">Destinations</th>
              <th className="px-3 py-3">Languages</th>
              <th className="px-3 py-3">Contact</th>
              <th className="px-3 py-3">Offers</th>
              <th className="px-3 py-3">Trust (placeholder)</th>
              <th className="px-3 py-3">Public profile</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-[#F0E8DC]/90 hover:bg-[#FFFCF7]/95">
                <td className="px-3 py-2.5 font-semibold text-[#1E1810]">{r.businessName}</td>
                <td className="px-3 py-2.5">{statusBadge(r.profileStatus)}</td>
                <td className="px-3 py-2.5">{planBadge(r.plan)}</td>
                <td className="px-3 py-2.5 text-xs text-[#5C5346]">{r.destinationsServed.join(", ")}</td>
                <td className="px-3 py-2.5 text-xs text-[#5C5346]">{r.languages.join(", ")}</td>
                <td className="px-3 py-2.5 text-xs text-[#5C5346]">{r.contactSummary}</td>
                <td className="px-3 py-2.5 tabular-nums font-medium">{r.offersCount}</td>
                <td className="max-w-[220px] px-3 py-2.5 text-xs text-[#5C5346]">{r.trustPlaceholder}</td>
                <td className="px-3 py-2.5">
                  {r.publicProfileSlug ? (
                    <Link
                      href={`/clasificados/viajes/negocio/${r.publicProfileSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#6B5B2E] underline"
                    >
                      Open profile →
                    </Link>
                  ) : (
                    <span className="text-xs text-[#7A7164]">Unpublished</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
