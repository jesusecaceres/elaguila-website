"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  adminBtnSecondary,
  adminCardBase,
  adminTableWrap,
} from "@/app/admin/_components/adminTheme";
import type { LeonixLeadRow } from "@/app/admin/_lib/leonixLeadsData";
import { LEONIX_LEAD_STATUSES } from "@/app/admin/_lib/leonixLeadStatuses";
import { inquiryTypeLabel, parseInquiryType } from "@/app/lib/leonix/inquiryTypes";
import {
  clipLeadText,
  copyTextToClipboard,
  formatLeadWhen,
} from "@/app/admin/_components/leads/adminLeadInboxFormat";

type Props = {
  initialRows: LeonixLeadRow[];
  total: number;
  limit: number;
};

const INQUIRY_FILTER_OPTIONS = [
  "all",
  "advertising",
  "launch",
  "mediaKit",
  "general",
  "promotionalProducts",
  "businessListing",
  "partnership",
] as const;

function leadSummary(row: LeonixLeadRow): string {
  return [
    `Leonix lead — ${row.full_name}`,
    `Business: ${row.business_name || "(none)"}`,
    `Email: ${row.email}`,
    `Phone: ${row.phone || "(none)"}`,
    `Type: ${row.inquiry_type}`,
    `Preferred contact: ${row.preferred_contact_method}`,
    `City/area: ${row.city_area || "(none)"}`,
    `Wants launch updates: ${row.wants_launch_updates ? "yes" : "no"}`,
    `Source page: ${row.source_page}`,
    `Source CTA: ${row.source_cta || "(none)"}`,
    `Lang: ${row.lang}`,
    `Status: ${row.status}`,
    "",
    "Message:",
    row.message,
    row.internal_notes ? `\nInternal notes:\n${row.internal_notes}` : "",
  ]
    .filter((line, i, arr) => !(line === "" && i === arr.length - 1))
    .join("\n");
}

export function AdminLeonixLeadsInboxClient({ initialRows, total, limit }: Props) {
  const [rows, setRows] = useState(initialRows);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inquiryFilter, setInquiryFilter] = useState<string>("all");
  const [launchFilter, setLaunchFilter] = useState<"all" | "yes" | "no">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (inquiryFilter !== "all" && row.inquiry_type !== inquiryFilter) return false;
      if (launchFilter === "yes" && !row.wants_launch_updates) return false;
      if (launchFilter === "no" && row.wants_launch_updates) return false;
      if (!q) return true;
      const hay = [row.full_name, row.email, row.business_name, row.phone, row.city_area, row.message]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, statusFilter, inquiryFilter, launchFilter]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }

  async function copyValue(label: string, value: string) {
    const ok = await copyTextToClipboard(value);
    showToast(ok ? `${label} copied` : `Could not copy ${label}`);
  }

  function openDetail(row: LeonixLeadRow) {
    setSelectedId(row.id);
    setEditStatus(row.status);
    setEditNotes(row.internal_notes ?? "");
  }

  async function saveDetail() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/leads/inbox/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus, internal_notes: editNotes }),
      });
      const data = (await res.json()) as { ok?: boolean; row?: LeonixLeadRow };
      if (res.ok && data.ok && data.row) {
        setRows((prev) => prev.map((r) => (r.id === data.row!.id ? data.row! : r)));
        showToast("Lead updated");
      } else {
        showToast("Could not save lead");
      }
    } catch {
      showToast("Could not save lead");
    } finally {
      setSaving(false);
    }
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
            placeholder="Name, email, business, phone…"
            className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810]"
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
            {LEONIX_LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346]">
          Inquiry type
          <select
            value={inquiryFilter}
            onChange={(e) => setInquiryFilter(e.target.value)}
            className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-sm"
          >
            {INQUIRY_FILTER_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v === "all" ? "All" : v}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346]">
          Launch updates
          <select
            value={launchFilter}
            onChange={(e) => setLaunchFilter(e.target.value as "all" | "yes" | "no")}
            className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/api/admin/leads/inbox/export" className={adminBtnSecondary}>
          Export CSV
        </Link>
        <span className="self-center text-sm text-[#7A7164]">
          Showing {filtered.length} of {rows.length} loaded ({total} total, newest {limit})
        </span>
      </div>

      {toast ? (
        <div className={`${adminCardBase} border-emerald-200 bg-emerald-50/90 px-4 py-2 text-sm text-emerald-950`}>
          {toast}
        </div>
      ) : null}

      <div className={`${adminTableWrap} w-full max-w-none`}>
        <div className="overflow-x-auto 2xl:overflow-visible">
          <table className="w-full table-fixed text-left text-sm 2xl:min-w-0">
            <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2]/90 text-xs font-bold uppercase tracking-wide text-[#5C5346]">
              <tr>
                <th className="w-[9%] px-2 py-3 2xl:px-3">Created</th>
                <th className="w-[6%] px-2 py-3">Status</th>
                <th className="w-[8%] px-2 py-3">Name</th>
                <th className="w-[8%] px-2 py-3 hidden lg:table-cell">Business</th>
                <th className="w-[10%] px-2 py-3">Inquiry</th>
                <th className="w-[7%] px-2 py-3 hidden xl:table-cell">Phone</th>
                <th className="w-[11%] px-2 py-3">Email</th>
                <th className="w-[6%] px-2 py-3 hidden xl:table-cell">City</th>
                <th className="w-[5%] px-2 py-3 hidden 2xl:table-cell">Contact</th>
                <th className="w-[12%] px-2 py-3 hidden lg:table-cell">Message</th>
                <th className="w-[10%] px-2 py-3">Source</th>
                <th className="w-[4%] px-2 py-3 hidden xl:table-cell">Launch</th>
                <th className="w-[10%] px-2 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-10 text-center text-[#7A7164]" >
                    No leads match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-b border-[#F0E8D8]/90 bg-white/60 align-top">
                    <td className="px-3 py-3 text-xs whitespace-nowrap text-[#5C5346]">
                      {formatLeadWhen(row.created_at)}
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold uppercase">{row.status}</td>
                    <td className="px-2 py-3 font-medium text-[#1E1810] 2xl:px-3">{clipLeadText(row.full_name, 40)}</td>
                    <td className="px-2 py-3 text-[#3D3629] hidden lg:table-cell 2xl:px-3">{clipLeadText(row.business_name, 32)}</td>
                    <td className="px-2 py-3 text-xs font-semibold text-[#3D3629] 2xl:px-3" title={row.inquiry_type}>
                      {inquiryTypeLabel(parseInquiryType(row.inquiry_type), "en")}
                    </td>
                    <td className="px-2 py-3 text-xs whitespace-nowrap hidden xl:table-cell 2xl:px-3">{row.phone || "—"}</td>
                    <td className="px-2 py-3 text-xs break-all 2xl:px-3">{row.email}</td>
                    <td className="px-2 py-3 text-xs hidden xl:table-cell 2xl:px-3">{clipLeadText(row.city_area, 24)}</td>
                    <td className="px-2 py-3 text-xs hidden 2xl:table-cell 2xl:px-3">{row.preferred_contact_method}</td>
                    <td className="px-2 py-3 text-xs text-[#5C5346] hidden lg:table-cell 2xl:px-3" title={row.message}>
                      {clipLeadText(row.message, 60)}
                    </td>
                    <td className="px-2 py-3 text-xs 2xl:px-3" title={`${row.source_page} · ${row.source_cta}`}>
                      <span className="block font-mono text-[11px] text-[#5C5346]">{clipLeadText(row.source_page, 20)}</span>
                      <span className="block font-semibold text-[#3D3629]">{row.source_cta || "—"}</span>
                    </td>
                    <td className="px-2 py-3 text-xs hidden xl:table-cell 2xl:px-3">{row.wants_launch_updates ? "Yes" : "No"}</td>
                    <td className="px-2 py-3 2xl:px-3">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => openDetail(row)}
                          className="rounded border border-[#E8DFD0] px-2 py-1 text-xs font-semibold hover:bg-[#FAF7F2]"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => copyValue("Email", row.email)}
                          className="rounded border border-[#E8DFD0] px-2 py-1 text-xs hover:bg-[#FAF7F2]"
                        >
                          Email
                        </button>
                        {row.phone ? (
                          <button
                            type="button"
                            onClick={() => copyValue("Phone", row.phone)}
                            className="rounded border border-[#E8DFD0] px-2 py-1 text-xs hover:bg-[#FAF7F2]"
                          >
                            Phone
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => copyValue("Summary", leadSummary(row))}
                          className="rounded border border-[#E8DFD0] px-2 py-1 text-xs hover:bg-[#FAF7F2]"
                        >
                          Summary
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected ? (
        <div
          className={`${adminCardBase} fixed inset-x-4 bottom-4 z-50 max-h-[85vh] overflow-y-auto border-[#6B5B2E]/30 p-5 shadow-2xl sm:inset-x-auto sm:right-6 sm:left-auto sm:w-[min(520px,calc(100vw-2rem))]`}
          role="dialog"
          aria-label="Lead details"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-[#1E1810]">{selected.full_name}</h3>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="rounded border border-[#E8DFD0] px-2 py-1 text-xs font-semibold"
            >
              Close
            </button>
          </div>
          <dl className="mt-4 grid gap-2 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase text-[#7A7164]">Email</dt>
              <dd className="break-all">{selected.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-[#7A7164]">Phone</dt>
              <dd>{selected.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-[#7A7164]">Business</dt>
              <dd>{selected.business_name || "—"}</dd>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <dt className="text-xs font-bold uppercase text-[#7A7164]">Inquiry type</dt>
                <dd className="font-mono text-xs">{selected.inquiry_type}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-[#7A7164]">Preferred contact</dt>
                <dd>{selected.preferred_contact_method}</dd>
              </div>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-[#7A7164]">City / area</dt>
              <dd>{selected.city_area || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-[#7A7164]">Website / social</dt>
              <dd className="break-all">{selected.website_or_social || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-[#7A7164]">Business category</dt>
              <dd>{selected.business_category || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-[#7A7164]">Message</dt>
              <dd className="whitespace-pre-wrap rounded-lg bg-[#FAF7F2] p-3 text-[#3D3629]">{selected.message}</dd>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="font-bold uppercase text-[#7A7164]">Source page</dt>
                <dd>{selected.source_page}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase text-[#7A7164]">Source CTA</dt>
                <dd>{selected.source_cta || "—"}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase text-[#7A7164]">Language</dt>
                <dd>{selected.lang}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase text-[#7A7164]">Launch updates</dt>
                <dd>{selected.wants_launch_updates ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase text-[#7A7164]">Consent</dt>
                <dd>{selected.consent_to_contact ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase text-[#7A7164]">Created</dt>
                <dd>{formatLeadWhen(selected.created_at)}</dd>
              </div>
            </div>
          </dl>

          <div className="mt-4 space-y-3 border-t border-[#E8DFD0] pt-4">
            <label className="block text-xs font-bold uppercase text-[#5C5346]">
              Status
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm"
              >
                {LEONIX_LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold uppercase text-[#5C5346]">
              Internal notes
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                disabled={saving}
                rows={4}
                maxLength={4000}
                className="mt-1 w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm"
                placeholder="Call outcome, follow-up date, deal stage…"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void saveDetail()}
                disabled={saving}
                className="rounded-lg bg-[#6B5B2E] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save status & notes"}
              </button>
              <button
                type="button"
                onClick={() => copyValue("Summary", leadSummary(selected))}
                className={adminBtnSecondary}
              >
                Copy summary
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
