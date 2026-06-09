"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { adminBtnSecondary, adminCardBase, adminTableWrap } from "@/app/admin/_components/adminTheme";
import type { NewsletterSubscriberRow } from "@/app/admin/_lib/leonixLeadsData";
import {
  clipLeadText,
  copyTextToClipboard,
  formatLeadWhen,
} from "@/app/admin/_components/leads/adminLeadInboxFormat";

type Props = {
  initialRows: NewsletterSubscriberRow[];
  total: number;
  limit: number;
};

export function AdminNewsletterSubscribersInboxClient({ initialRows, total, limit }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [langFilter, setLangFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [toast, setToast] = useState<string | null>(null);

  const sources = useMemo(() => {
    const set = new Set(initialRows.map((r) => r.source).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [initialRows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialRows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (langFilter !== "all" && row.preferred_language !== langFilter) return false;
      if (sourceFilter !== "all" && row.source !== sourceFilter) return false;
      if (!q) return true;
      const hay = [row.email, row.name, row.city, row.zip_code, row.interests].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [initialRows, search, statusFilter, langFilter, sourceFilter]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }

  async function copyEmails() {
    const emails = filtered
      .filter((r) => r.status === "subscribed" && r.email.trim())
      .map((r) => r.email.trim())
      .join(", ");
    if (!emails) {
      showToast("No subscribed emails in view");
      return;
    }
    const ok = await copyTextToClipboard(emails);
    showToast(ok ? "Visible emails copied" : "Could not copy emails");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-semibold text-[#5C5346]">
          Search
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Email, name, city…"
            className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346]">
          Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="subscribed">subscribed</option>
            <option value="unsubscribed">unsubscribed</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346]">
          Pref. language
          <select
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
            className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="es">es</option>
            <option value="en">en</option>
            <option value="both">both</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346]">
          Source
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-sm"
          >
            {sources.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All" : s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/api/admin/leads/newsletter/export" className={adminBtnSecondary}>
          Export full CSV
        </Link>
        <Link href="/api/admin/leads/newsletter/emails-export" className={adminBtnSecondary}>
          Export newsletter emails CSV
        </Link>
        <button type="button" onClick={() => void copyEmails()} className={adminBtnSecondary}>
          Copy visible emails
        </button>
        <span className="self-center text-sm text-[#7A7164]">
          Showing {filtered.length} of {initialRows.length} loaded ({total} total, newest {limit})
        </span>
      </div>

      {toast ? (
        <div className={`${adminCardBase} border-emerald-200 bg-emerald-50/90 px-4 py-2 text-sm text-emerald-950`}>
          {toast}
        </div>
      ) : null}

      <div className={adminTableWrap}>
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full text-left text-sm">
            <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2]/90 text-xs font-bold uppercase tracking-wide text-[#5C5346]">
              <tr>
                <th className="px-3 py-3">Created</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">City</th>
                <th className="px-3 py-3">ZIP</th>
                <th className="px-3 py-3">Pref. lang</th>
                <th className="px-3 py-3">Interests</th>
                <th className="px-3 py-3">Source</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Consent</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-[#7A7164]">
                    No subscribers match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-b border-[#F0E8D8]/90 bg-white/60">
                    <td className="px-3 py-3 text-xs whitespace-nowrap text-[#5C5346]">
                      {formatLeadWhen(row.created_at)}
                    </td>
                    <td className="px-3 py-3 font-medium break-all text-[#1E1810]">{row.email}</td>
                    <td className="px-3 py-3">{clipLeadText(row.name, 40)}</td>
                    <td className="px-3 py-3 text-xs">{clipLeadText(row.city, 32)}</td>
                    <td className="px-3 py-3 text-xs">{clipLeadText(row.zip_code, 12)}</td>
                    <td className="px-3 py-3 text-xs">{row.preferred_language}</td>
                    <td className="px-3 py-3 text-xs max-w-[200px]" title={row.interests}>
                      {clipLeadText(row.interests, 80)}
                    </td>
                    <td className="px-3 py-3 text-xs font-mono">{row.source}</td>
                    <td className="px-3 py-3 text-xs font-semibold">{row.status}</td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap">{formatLeadWhen(row.consent_timestamp)}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await copyTextToClipboard(row.email);
                          showToast(ok ? "Email copied" : "Could not copy email");
                        }}
                        className="rounded border border-[#E8DFD0] px-2 py-1 text-xs font-semibold hover:bg-[#FAF7F2]"
                      >
                        Copy email
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
