"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  adminBtnSecondary,
  adminCardBase,
  adminTableWrap,
  adminTableZebraRow,
} from "@/app/admin/_components/adminTheme";
import type { LeonixLeadRow } from "@/app/admin/_lib/leonixLeadsData";
import { LEONIX_LEAD_STATUSES } from "@/app/admin/_lib/leonixLeadStatuses";
import {
  inquiryTypeLabel,
  parseInquiryType,
  type InquiryType,
} from "@/app/lib/leonix/inquiryTypes";
import {
  clipLeadText,
  copyTextToClipboard,
  formatLeadCreatedParts,
  formatLeadWhen,
  leadStatusBadgeClass,
} from "@/app/admin/_components/leads/adminLeadInboxFormat";

type InboxFolder = "active" | "archived";

type Props = {
  initialActiveRows: LeonixLeadRow[];
  initialArchivedRows: LeonixLeadRow[];
  activeTotal: number;
  archivedTotal: number;
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

function adminInquiryFilterLabel(value: (typeof INQUIRY_FILTER_OPTIONS)[number]): string {
  if (value === "all") return "All inquiry types";
  return inquiryTypeLabel(parseInquiryType(value), "en");
}

function leadSummary(row: LeonixLeadRow): string {
  const inquiryLabel = inquiryTypeLabel(parseInquiryType(row.inquiry_type), "en");
  return [
    `Leonix lead — ${row.full_name}`,
    `Business: ${row.business_name || "(none)"}`,
    `Email: ${row.email}`,
    `Phone: ${row.phone || "(none)"}`,
    `Type: ${inquiryLabel} (${row.inquiry_type})`,
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

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${leadStatusBadgeClass(status)}`}
    >
      {status}
    </span>
  );
}

function CreatedCell({ iso }: { iso: string }) {
  const parts = formatLeadCreatedParts(iso);
  return (
    <div className="leading-tight">
      <span className="block text-xs font-medium text-[#3D3629]">{parts.date}</span>
      {parts.time ? <span className="block text-[10px] text-[#7A7164]">{parts.time}</span> : null}
    </div>
  );
}

export function AdminLeonixLeadsInboxClient({
  initialActiveRows,
  initialArchivedRows,
  activeTotal,
  archivedTotal,
  limit,
}: Props) {
  const [folder, setFolder] = useState<InboxFolder>("active");
  const [activeRows, setActiveRows] = useState(initialActiveRows);
  const [archivedRows, setArchivedRows] = useState(initialArchivedRows);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inquiryFilter, setInquiryFilter] = useState<string>("all");
  const [launchFilter, setLaunchFilter] = useState<"all" | "yes" | "no">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [lifecycleBusy, setLifecycleBusy] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const rows = folder === "active" ? activeRows : archivedRows;
  const total = folder === "active" ? activeTotal : archivedTotal;

  const statusOptions = useMemo(() => {
    if (folder === "archived") return LEONIX_LEAD_STATUSES;
    return LEONIX_LEAD_STATUSES.filter((s) => s !== "archived");
  }, [folder]);

  const selected = useMemo(() => {
    const all = [...activeRows, ...archivedRows];
    return all.find((r) => r.id === selectedId) ?? null;
  }, [activeRows, archivedRows, selectedId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (inquiryFilter !== "all" && row.inquiry_type !== inquiryFilter) return false;
      if (launchFilter === "yes" && !row.wants_launch_updates) return false;
      if (launchFilter === "no" && row.wants_launch_updates) return false;
      if (!q) return true;
      const inquiryLabel = inquiryTypeLabel(parseInquiryType(row.inquiry_type), "en");
      const hay = [
        row.full_name,
        row.email,
        row.business_name,
        row.phone,
        row.city_area,
        row.message,
        row.inquiry_type,
        inquiryLabel,
        row.source_page,
        row.source_cta,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, statusFilter, inquiryFilter, launchFilter]);

  function showToast(msg: string, kind: "ok" | "err" = "ok") {
    setToast({ msg, kind });
    window.setTimeout(() => setToast(null), 2800);
  }

  async function copyValue(label: string, value: string) {
    const ok = await copyTextToClipboard(value);
    showToast(ok ? `${label} copied` : `Could not copy ${label}`, ok ? "ok" : "err");
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
        const row = data.row;
        const updater = (prev: LeonixLeadRow[]) => prev.map((r) => (r.id === row.id ? row : r));
        if (row.archived_at) {
          setActiveRows((prev) => prev.filter((r) => r.id !== row.id));
          setArchivedRows((prev) => {
            const exists = prev.some((r) => r.id === row.id);
            return exists ? updater(prev) : [row, ...prev];
          });
        } else {
          setArchivedRows((prev) => prev.filter((r) => r.id !== row.id));
          setActiveRows((prev) => {
            const exists = prev.some((r) => r.id === row.id);
            return exists ? updater(prev) : [row, ...prev];
          });
        }
        showToast("Lead updated");
      } else {
        showToast("Could not save lead", "err");
      }
    } catch {
      showToast("Could not save lead", "err");
    } finally {
      setSaving(false);
    }
  }

  async function runLifecycle(row: LeonixLeadRow, action: "archive" | "restore" | "delete") {
    if (action === "delete") {
      const confirmed = window.confirm(
        "Soft-delete this lead? It will be hidden from active and archived views. Export CSV will also exclude it.",
      );
      if (!confirmed) return;
    }

    setLifecycleBusy(row.id);
    try {
      const res = await fetch(`/api/admin/leads/inbox/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { ok?: boolean; row?: LeonixLeadRow; error?: string };
      if (!res.ok || !data.ok || !data.row) {
        showToast(data.error ? `Action failed: ${data.error}` : "Action failed", "err");
        return;
      }

      const updated = data.row;
      if (action === "archive") {
        setActiveRows((prev) => prev.filter((r) => r.id !== row.id));
        setArchivedRows((prev) => [updated, ...prev.filter((r) => r.id !== row.id)]);
        showToast("Lead archived");
      } else if (action === "restore") {
        setArchivedRows((prev) => prev.filter((r) => r.id !== row.id));
        setActiveRows((prev) => [updated, ...prev.filter((r) => r.id !== row.id)]);
        showToast("Lead restored to inbox");
      } else {
        setActiveRows((prev) => prev.filter((r) => r.id !== row.id));
        setArchivedRows((prev) => prev.filter((r) => r.id !== row.id));
        if (selectedId === row.id) setSelectedId(null);
        showToast("Lead deleted (soft)");
      }
    } catch {
      showToast("Action failed", "err");
    } finally {
      setLifecycleBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <p className={`${adminCardBase} border-[#E8DFD0] bg-[#FAF7F2]/90 px-4 py-3 text-sm text-[#3D3629]`}>
        Promotional product and print quote requests appear here as leads under{" "}
        <strong>Promotional products / print quote</strong>. Archive when follow-up is complete; restore from the
        Archived folder if needed. Delete is a soft-delete (hidden, not hard-removed).
      </p>

      <div className="flex flex-wrap gap-2 border-b border-[#E8DFD0] pb-1">
        <button
          type="button"
          onClick={() => {
            setFolder("active");
            setStatusFilter("all");
          }}
          className={`rounded-t-lg px-4 py-2 text-sm font-bold transition ${
            folder === "active"
              ? "border border-b-0 border-[#E8DFD0] bg-white text-[#1E1810]"
              : "text-[#7A7164] hover:bg-[#FAF7F2]"
          }`}
        >
          Active inbox
          <span className="ml-2 rounded-full bg-[#F3E6D2] px-2 py-0.5 text-xs font-semibold text-[#5C5346]">
            {activeTotal}
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setFolder("archived");
            setStatusFilter("all");
          }}
          className={`rounded-t-lg px-4 py-2 text-sm font-bold transition ${
            folder === "archived"
              ? "border border-b-0 border-[#E8DFD0] bg-white text-[#1E1810]"
              : "text-[#7A7164] hover:bg-[#FAF7F2]"
          }`}
        >
          Archived
          <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-900">
            {archivedTotal}
          </span>
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-semibold text-[#5C5346]">
          Search
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, inquiry type, source, promo_quote…"
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
            {statusOptions.map((s) => (
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
                {adminInquiryFilterLabel(v)}
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
          Showing {filtered.length} of {rows.length} loaded ({total} {folder}, newest {limit})
        </span>
      </div>

      {toast ? (
        <div
          className={`${adminCardBase} px-4 py-2 text-sm ${
            toast.kind === "ok"
              ? "border-emerald-200 bg-emerald-50/90 text-emerald-950"
              : "border-rose-200 bg-rose-50/90 text-rose-950"
          }`}
        >
          {toast.msg}
        </div>
      ) : null}

      <div className={`${adminTableWrap} w-full max-w-none`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] table-fixed text-left text-sm">
            <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2]/90 text-xs font-bold uppercase tracking-wide text-[#5C5346]">
              <tr>
                <th className="w-[88px] px-3 py-3">Created</th>
                <th className="w-[88px] px-3 py-3">Status</th>
                <th className="w-[100px] px-3 py-3">Name</th>
                <th className="w-[96px] px-3 py-3 hidden lg:table-cell">Business</th>
                <th className="w-[120px] px-3 py-3">Inquiry</th>
                <th className="w-[96px] px-3 py-3 hidden xl:table-cell">Phone</th>
                <th className="w-[140px] px-3 py-3">Email</th>
                <th className="w-[72px] px-3 py-3 hidden xl:table-cell">City</th>
                <th className="w-[64px] px-3 py-3 hidden 2xl:table-cell">Contact</th>
                <th className="w-[140px] px-3 py-3 hidden lg:table-cell">Message</th>
                <th className="w-[120px] px-3 py-3">Source</th>
                <th className="w-[52px] px-3 py-3 hidden xl:table-cell">Launch</th>
                <th className="w-[168px] px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-10 text-center text-[#7A7164]">
                    {folder === "active"
                      ? "No active leads match the current filters."
                      : "No archived leads match the current filters."}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className={`align-top ${adminTableZebraRow}`}>
                    <td className="px-3 py-3">
                      <CreatedCell iso={row.created_at} />
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-3 py-3 font-medium text-[#1E1810]">{clipLeadText(row.full_name, 40)}</td>
                    <td className="px-3 py-3 text-[#3D3629] hidden lg:table-cell">
                      {clipLeadText(row.business_name, 32)}
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold text-[#3D3629]" title={row.inquiry_type}>
                      {inquiryTypeLabel(parseInquiryType(row.inquiry_type) as InquiryType, "en")}
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap hidden xl:table-cell">
                      {row.phone || "—"}
                    </td>
                    <td className="px-3 py-3 text-xs break-all">{row.email}</td>
                    <td className="px-3 py-3 text-xs hidden xl:table-cell">{clipLeadText(row.city_area, 24)}</td>
                    <td className="px-3 py-3 text-xs hidden 2xl:table-cell">{row.preferred_contact_method}</td>
                    <td className="px-3 py-3 text-xs text-[#5C5346] hidden lg:table-cell" title={row.message}>
                      {clipLeadText(row.message, 60)}
                    </td>
                    <td className="px-3 py-3 text-xs" title={`${row.source_page} · ${row.source_cta}`}>
                      <span className="block font-mono text-[11px] text-[#5C5346]">
                        {clipLeadText(row.source_page, 24)}
                      </span>
                      <span
                        className={`block font-semibold ${
                          row.source_cta === "promo_quote" ? "text-[#7A1E2C]" : "text-[#3D3629]"
                        }`}
                      >
                        {row.source_cta || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs hidden xl:table-cell">
                      {row.wants_launch_updates ? "Yes" : "No"}
                    </td>
                    <td className="px-3 py-3">
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
                        {folder === "active" ? (
                          <button
                            type="button"
                            disabled={lifecycleBusy === row.id}
                            onClick={() => void runLifecycle(row, "archive")}
                            className="rounded border border-violet-200 bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-900 hover:bg-violet-100 disabled:opacity-50"
                          >
                            Archive
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={lifecycleBusy === row.id}
                            onClick={() => void runLifecycle(row, "restore")}
                            className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            Restore
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={lifecycleBusy === row.id}
                          onClick={() => void runLifecycle(row, "delete")}
                          className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-900 hover:bg-rose-100 disabled:opacity-50"
                        >
                          Delete
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
            <div>
              <h3 className="text-lg font-bold text-[#1E1810]">{selected.full_name}</h3>
              <StatusBadge status={selected.status} />
            </div>
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
                <dd>
                  {inquiryTypeLabel(parseInquiryType(selected.inquiry_type) as InquiryType, "en")}
                  <span className="mt-0.5 block font-mono text-[11px] text-[#7A7164]">
                    {selected.inquiry_type}
                  </span>
                </dd>
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
              {selected.archived_at ? (
                <div>
                  <dt className="font-bold uppercase text-[#7A7164]">Archived</dt>
                  <dd>{formatLeadWhen(selected.archived_at)}</dd>
                </div>
              ) : null}
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
