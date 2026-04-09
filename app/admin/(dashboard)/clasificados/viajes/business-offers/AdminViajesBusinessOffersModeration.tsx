"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { adminBtnSecondary, adminInputClass } from "@/app/admin/_components/adminTheme";
import { ADMIN_VIAJES_BUSINESS_OFFERS_MOCK } from "@/app/admin/_lib/adminViajesBusinessOffersMock";
import type { AdminViajesBusinessOfferStatus } from "@/app/admin/_lib/adminViajesBusinessOffersTypes";

const STATUS_LABEL: Record<AdminViajesBusinessOfferStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  needs_edits: "Needs edits",
  expired: "Expired",
};

function statusBadge(s: AdminViajesBusinessOfferStatus) {
  const map: Record<AdminViajesBusinessOfferStatus, string> = {
    pending: "bg-amber-100 text-amber-950 ring-amber-200",
    approved: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    rejected: "bg-rose-100 text-rose-900 ring-rose-200",
    needs_edits: "bg-sky-100 text-sky-950 ring-sky-200",
    expired: "bg-stone-200 text-stone-900 ring-stone-300",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${map[s]}`}>
      {STATUS_LABEL[s]}
    </span>
  );
}

function imgModBadge(s: "pending" | "ok" | "flagged") {
  const map = {
    pending: "bg-slate-100 text-slate-800",
    ok: "bg-emerald-50 text-emerald-900",
    flagged: "bg-orange-100 text-orange-950",
  };
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${map[s]}`}>{s}</span>;
}

const stagedBtn =
  "rounded-lg border border-[#E8DFD0]/90 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#5C5346] disabled:cursor-not-allowed disabled:opacity-45";

export function AdminViajesBusinessOffersModeration() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<AdminViajesBusinessOfferStatus | "all">("all");

  const rows = useMemo(() => {
    let list = [...ADMIN_VIAJES_BUSINESS_OFFERS_MOCK];
    if (status !== "all") list = list.filter((r) => r.status === status);
    const qq = q.trim().toLowerCase();
    if (qq) {
      list = list.filter(
        (r) =>
          r.businessName.toLowerCase().includes(qq) ||
          r.headline.toLowerCase().includes(qq) ||
          r.destination.toLowerCase().includes(qq)
      );
    }
    list.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    return list;
  }, [q, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-md">
          <label className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Search</label>
          <input
            className={adminInputClass}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Business, headline, destination…"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold uppercase text-[#7A7164]">Queue</label>
          <select
            className={`${adminInputClass} w-auto min-w-[10rem]`}
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="needs_edits">Needs edits</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-[#7A7164]">
        Per-row actions below are <strong>staged placeholders</strong> for the future moderation API — they do not change data yet.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-[#E8DFD0]/90 bg-white/95 shadow-sm">
        <table className="min-w-[1520px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#E8DFD0]/90 bg-[#FAF7F2]/90 text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
              <th className="px-3 py-3">Business</th>
              <th className="px-3 py-3">Headline</th>
              <th className="px-3 py-3">Destination</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Submitted</th>
              <th className="px-3 py-3">Valid through</th>
              <th className="px-3 py-3">Trust flags</th>
              <th className="px-3 py-3">Contact proof</th>
              <th className="px-3 py-3">Images</th>
              <th className="px-3 py-3">Review notes</th>
              <th className="max-w-[200px] px-3 py-3">Moderation reasoning (stub)</th>
              <th className="px-3 py-3">Staged actions</th>
              <th className="px-3 py-3">Profile / offer</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-[#F0E8DC]/90 hover:bg-[#FFFCF7]/95">
                <td className="px-3 py-2.5">
                  <div className="font-semibold text-[#1E1810]">{r.businessName}</div>
                  {r.firstTimeAdvertiser ? (
                    <span className="mt-1 inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-950">
                      First-time advertiser
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2.5 text-[#2C2416]">{r.headline}</td>
                <td className="px-3 py-2.5 text-xs text-[#5C5346]">{r.destination}</td>
                <td className="px-3 py-2.5">{statusBadge(r.status)}</td>
                <td className="px-3 py-2.5 text-xs tabular-nums text-[#5C5346]">{r.submittedAt}</td>
                <td className="px-3 py-2.5 text-xs tabular-nums text-[#5C5346]">{r.validThrough ?? "—"}</td>
                <td className="px-3 py-2.5 text-[10px] leading-snug text-[#5C5346]">
                  {r.trustFlags.map((t) => (
                    <span key={t} className="mb-1 mr-1 inline-block rounded bg-[#F3EBDD] px-1 py-0.5">
                      {t}
                    </span>
                  ))}
                </td>
                <td className="px-3 py-2.5 text-xs text-[#5C5346]">
                  <div>Web: {r.websiteProvided ? "yes" : "no"}</div>
                  <div>WA: {r.whatsappProvided ? "yes" : "no"}</div>
                </td>
                <td className="px-3 py-2.5">{imgModBadge(r.imageModeration)}</td>
                <td className="max-w-[220px] px-3 py-2.5 text-xs text-[#5C5346]">{r.reviewNotes}</td>
                <td className="max-w-[200px] px-3 py-2.5 text-[10px] leading-snug text-[#5C5346]">
                  {r.moderationReasonStub ?? "—"}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex max-w-[14rem] flex-col gap-1">
                    <button type="button" className={stagedBtn} disabled title="Staged — no API">
                      Approve
                    </button>
                    <button type="button" className={stagedBtn} disabled title="Staged — no API">
                      Reject
                    </button>
                    <button type="button" className={stagedBtn} disabled title="Staged — no API">
                      Request edits
                    </button>
                    <button type="button" className={stagedBtn} disabled title="Staged — no API">
                      Mark expired
                    </button>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-1">
                    {r.businessProfileSlug ? (
                      <Link
                        href={`/clasificados/viajes/negocio/${r.businessProfileSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[#6B5B2E] underline"
                      >
                        Public profile →
                      </Link>
                    ) : (
                      <span className="text-xs text-[#7A7164]">No profile</span>
                    )}
                    {r.publicOfferSlug ? (
                      <Link
                        href={`/clasificados/viajes/oferta/${r.publicOfferSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-[#5C5346] underline"
                      >
                        Live offer →
                      </Link>
                    ) : (
                      <span className="text-xs text-[#7A7164]">Not published</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={adminBtnSecondary} disabled title="Staged — bulk actions need API">
          Bulk approve (staged)
        </button>
        <button type="button" className={adminBtnSecondary} disabled title="Staged — bulk actions need API">
          Bulk request edits (staged)
        </button>
        <p className="text-xs text-[#7A7164]">Bulk queue actions stay disabled until moderation endpoints and persistence exist.</p>
      </div>
    </div>
  );
}
