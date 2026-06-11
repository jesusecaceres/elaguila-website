"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  adminBtnSecondary,
  adminCardBase,
  adminTableWrap,
  adminTableZebraRow,
} from "@/app/admin/_components/adminTheme";
import type { NewsletterSubscriberRow } from "@/app/admin/_lib/leonixLeadsData";
import {
  buildNewsletterMailtoUrl,
  buildNewsletterReplyContent,
} from "@/app/admin/_lib/leonixLeadReplyTemplates";
import {
  clipLeadText,
  copyTextToClipboard,
  formatLeadCreatedParts,
  parseInterestChips,
} from "@/app/admin/_components/leads/adminLeadInboxFormat";

type Props = {
  initialRows: NewsletterSubscriberRow[];
  total: number;
  limit: number;
};

function CreatedCell({ iso }: { iso: string }) {
  const parts = formatLeadCreatedParts(iso);
  return (
    <div className="leading-tight">
      <span className="block text-xs font-medium text-[#3D3629]">{parts.date}</span>
      {parts.time ? <span className="block text-[10px] text-[#7A7164]">{parts.time}</span> : null}
    </div>
  );
}

function InterestChips({ interests }: { interests: string }) {
  const chips = parseInterestChips(interests);
  if (chips.length === 0) return <span className="text-xs text-[#7A7164]">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {chips.map((chip) => (
        <span
          key={chip}
          className="inline-flex rounded-full bg-[#F3E6D2] px-2 py-0.5 text-[10px] font-semibold text-[#5C5346] ring-1 ring-[#E8DFD0]"
          title={chip}
        >
          {chip.length > 28 ? `${chip.slice(0, 28)}…` : chip}
        </span>
      ))}
    </div>
  );
}

function LangBadge({ lang }: { lang: string }) {
  return (
    <span className="inline-flex rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-900 ring-1 ring-sky-200">
      {lang}
    </span>
  );
}

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

  async function copyValue(label: string, value: string) {
    const ok = await copyTextToClipboard(value);
    showToast(ok ? `${label} copied` : `Could not copy ${label}`);
  }

  return (
    <div className="space-y-6">
      <p className={`${adminCardBase} border-[#E8DFD0] bg-[#FAF7F2]/90 px-4 py-3 text-sm text-[#3D3629]`}>
        Launch newsletter subscribers. Use <strong>Copy reply</strong> or <strong>Open email</strong> (mailto) — Leonix
        does not bulk-send from this inbox.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-semibold text-[#5C5346]">
          Search
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Email, name, city, interests…"
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
          <table className="min-w-[1100px] w-full table-fixed text-left text-sm">
            <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2]/90 text-xs font-bold uppercase tracking-wide text-[#5C5346]">
              <tr>
                <th className="w-[80px] px-3 py-3">Created</th>
                <th className="w-[160px] px-3 py-3">Email</th>
                <th className="w-[100px] px-3 py-3">Name</th>
                <th className="w-[80px] px-3 py-3 hidden lg:table-cell">City</th>
                <th className="w-[56px] px-3 py-3 hidden xl:table-cell">ZIP</th>
                <th className="w-[72px] px-3 py-3">Lang</th>
                <th className="w-[200px] px-3 py-3">Interests</th>
                <th className="w-[100px] px-3 py-3">Source</th>
                <th className="w-[72px] px-3 py-3">Status</th>
                <th className="w-[180px] px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-[#7A7164]">
                    No subscribers match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const reply = buildNewsletterReplyContent(row);
                  const mailto = buildNewsletterMailtoUrl(row);
                  return (
                    <tr key={row.id} className={`align-top ${adminTableZebraRow}`}>
                      <td className="px-3 py-3">
                        <CreatedCell iso={row.created_at} />
                      </td>
                      <td className="px-3 py-3 font-medium break-all text-[#1E1810]">{row.email}</td>
                      <td className="px-3 py-3">{clipLeadText(row.name, 32)}</td>
                      <td className="px-3 py-3 text-xs hidden lg:table-cell">{clipLeadText(row.city, 24)}</td>
                      <td className="px-3 py-3 text-xs hidden xl:table-cell">{clipLeadText(row.zip_code, 10)}</td>
                      <td className="px-3 py-3">
                        <LangBadge lang={row.preferred_language} />
                      </td>
                      <td className="px-3 py-3">
                        <InterestChips interests={row.interests} />
                      </td>
                      <td className="px-3 py-3 text-xs font-mono">{row.source}</td>
                      <td className="px-3 py-3 text-xs font-semibold capitalize">{row.status}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          <a
                            href={mailto}
                            className="rounded border border-[#E8DFD0] px-2 py-1 text-xs font-semibold hover:bg-[#FAF7F2]"
                          >
                            Open email
                          </a>
                          <button
                            type="button"
                            onClick={() => void copyValue("Reply", reply.body)}
                            className="rounded border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-900 hover:bg-sky-100"
                          >
                            Copy reply
                          </button>
                          <button
                            type="button"
                            onClick={() => void copyValue("Email", row.email)}
                            className="rounded border border-[#E8DFD0] px-2 py-1 text-xs hover:bg-[#FAF7F2]"
                          >
                            Copy email
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
