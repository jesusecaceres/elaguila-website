"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  adminBtnSecondary,
  adminCardBase,
  adminTableWrap,
  adminTableZebraRow,
} from "@/app/admin/_components/adminTheme";
import { AdminLaunchLeadRowActions } from "@/app/admin/_components/leads/AdminLaunchLeadRowActions";
import { AdminLeonixLeadDetailDrawer } from "@/app/admin/_components/leads/AdminLeonixLeadDetailDrawer";
import type { LeonixLeadRow } from "@/app/admin/_lib/leonixLeadsData";
import { LEONIX_LEAD_STATUSES } from "@/app/admin/_lib/leonixLeadStatuses";
import {
  buildLeadMailtoUrl,
  buildLeadReplyContent,
  leadNextActionLabel,
} from "@/app/admin/_lib/leonixLeadReplyTemplates";
import {
  inquiryTypeLabel,
  parseInquiryType,
  type InquiryType,
} from "@/app/lib/leonix/inquiryTypes";
import { phoneTelHref } from "@/app/lib/leonix/phoneFormat";
import {
  clipLeadText,
  contactPreferenceBadgeClass,
  copyTextToClipboard,
  formatLeadCreatedParts,
  inquiryTypeBadgeClass,
  leadStatusBadgeClass,
} from "@/app/admin/_components/leads/adminLeadInboxFormat";

type InboxFolder = "active" | "archived";

type OpsView =
  | "all"
  | "needs_reply"
  | "promo"
  | "advertising"
  | "media_kit"
  | "archived";

type Props = {
  initialActiveRows: LeonixLeadRow[];
  initialArchivedRows: LeonixLeadRow[];
  activeTotal: number;
  archivedTotal: number;
  limit: number;
};

const OPS_VIEWS: { id: OpsView; label: string }[] = [
  { id: "all", label: "All Leads" },
  { id: "needs_reply", label: "Needs Reply" },
  { id: "promo", label: "Promo / Print Quotes" },
  { id: "advertising", label: "Advertising Leads" },
  { id: "media_kit", label: "Media Kit Requests" },
  { id: "archived", label: "Archived" },
];

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${leadStatusBadgeClass(status)}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function InquiryBadge({ inquiryType }: { inquiryType: string }) {
  const parsed = parseInquiryType(inquiryType) as InquiryType;
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${inquiryTypeBadgeClass(inquiryType)}`}
      title={inquiryType}
    >
      {inquiryTypeLabel(parsed, "en")}
    </span>
  );
}

function ContactPrefBadge({ method }: { method: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${contactPreferenceBadgeClass(method)}`}
    >
      {method}
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

function matchesOpsView(row: LeonixLeadRow, view: OpsView): boolean {
  if (view === "archived") return Boolean(row.archived_at);
  if (row.archived_at) return false;
  if (view === "all") return true;
  if (view === "needs_reply") {
    const s = row.status.trim().toLowerCase();
    return s === "new" || s === "needs_reply";
  }
  if (view === "promo") {
    return (
      row.inquiry_type === "promotionalProducts" ||
      row.source_cta === "promo_quote" ||
      /promo|print|quote|impres/i.test(`${row.message} ${row.source_page}`)
    );
  }
  if (view === "advertising") return row.inquiry_type === "advertising";
  if (view === "media_kit") return row.inquiry_type === "mediaKit";
  return true;
}

function patchRowInList(prev: LeonixLeadRow[], row: LeonixLeadRow): LeonixLeadRow[] {
  const exists = prev.some((r) => r.id === row.id);
  if (exists) return prev.map((r) => (r.id === row.id ? row : r));
  return [row, ...prev];
}

export function AdminLeonixLeadsInboxClient({
  initialActiveRows,
  initialArchivedRows,
  activeTotal,
  archivedTotal,
  limit,
}: Props) {
  const [opsView, setOpsView] = useState<OpsView>("all");
  const [activeRows, setActiveRows] = useState(initialActiveRows);
  const [archivedRows, setArchivedRows] = useState(initialArchivedRows);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [launchFilter, setLaunchFilter] = useState<"all" | "yes" | "no">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [lifecycleBusy, setLifecycleBusy] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editFollowUp, setEditFollowUp] = useState("");

  const folder: InboxFolder = opsView === "archived" ? "archived" : "active";
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
      if (!matchesOpsView(row, opsView)) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
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
        leadNextActionLabel(row),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, opsView, search, statusFilter, launchFilter]);

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
    setEditFollowUp(row.follow_up_at ? row.follow_up_at.slice(0, 10) : "");
  }

  function applyRowUpdate(row: LeonixLeadRow) {
    if (row.archived_at || row.deleted_at) {
      setActiveRows((prev) => prev.filter((r) => r.id !== row.id));
      if (!row.deleted_at) {
        setArchivedRows((prev) => patchRowInList(prev.filter((r) => r.id !== row.id), row));
      } else {
        setArchivedRows((prev) => prev.filter((r) => r.id !== row.id));
      }
    } else {
      setArchivedRows((prev) => prev.filter((r) => r.id !== row.id));
      setActiveRows((prev) => patchRowInList(prev.filter((r) => r.id !== row.id), row));
    }
  }

  async function saveDetail() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/leads/inbox/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          internal_notes: editNotes,
          follow_up_at: editFollowUp.trim() ? editFollowUp.trim() : null,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; row?: LeonixLeadRow };
      if (res.ok && data.ok && data.row) {
        applyRowUpdate(data.row);
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

  async function runLifecycle(
    row: LeonixLeadRow,
    action: "archive" | "restore" | "delete" | "mark_contacted",
  ) {
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
      if (action === "delete") {
        setActiveRows((prev) => prev.filter((r) => r.id !== row.id));
        setArchivedRows((prev) => prev.filter((r) => r.id !== row.id));
        if (selectedId === row.id) setSelectedId(null);
        showToast("Lead deleted (soft)");
      } else       if (action === "archive") {
        setActiveRows((prev) => prev.filter((r) => r.id !== row.id));
        setArchivedRows((prev) => patchRowInList(prev, updated));
        if (selectedId === row.id) setSelectedId(null);
        showToast("Lead archived");
      } else if (action === "restore") {
        setArchivedRows((prev) => prev.filter((r) => r.id !== row.id));
        setActiveRows((prev) => patchRowInList(prev, updated));
        setOpsView("all");
        showToast("Lead restored to inbox");
      } else {
        applyRowUpdate(updated);
        showToast("Marked as contacted");
      }
    } catch {
      showToast("Action failed", "err");
    } finally {
      setLifecycleBusy(null);
    }
  }


  return (
    <div className="space-y-6">
      <div className={`${adminCardBase} border-[#E8DFD0] bg-[#FAF7F2]/90 px-4 py-3 text-sm text-[#3D3629]`}>
        <strong>Launch Leads command center.</strong> Use reply helpers (mailto / copy) — emails are not sent from the
        server. Archive when done; restore from Archived.{" "}
        <Link href="/admin/leads/newsletter" className="font-semibold text-[#6B5B2E] underline">
          Newsletter subscribers →
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {OPS_VIEWS.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => {
              setOpsView(view.id);
              setStatusFilter("all");
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition sm:px-4 sm:py-2 sm:text-sm ${
              opsView === view.id
                ? "border-[#6B5B2E] bg-[#FAF3E6] text-[#2C2416]"
                : "border-[#E8DFD0] text-[#5C5346] hover:bg-[#FAF7F2]"
            }`}
          >
            {view.label}
            {view.id === "archived" ? (
              <span className="ml-1.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] text-violet-900">
                {archivedTotal}
              </span>
            ) : null}
          </button>
        ))}
        <Link
          href="/admin/leads/newsletter"
          className="rounded-full border border-[#E8DFD0] px-3 py-1.5 text-xs font-bold text-[#5C5346] hover:bg-[#FAF7F2] sm:px-4 sm:py-2 sm:text-sm"
        >
          Newsletter Subscribers
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-semibold text-[#5C5346]">
          Search
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, inquiry, source, promo_quote…"
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
                {s.replace(/_/g, " ")}
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
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2]/90 text-xs font-bold uppercase tracking-wide text-[#5C5346]">
              <tr>
                <th className="whitespace-nowrap px-3 py-3">Created</th>
                <th className="whitespace-nowrap px-3 py-3">Status</th>
                <th className="min-w-[130px] px-3 py-3">Lead</th>
                <th className="min-w-[160px] px-3 py-3">Wants</th>
                <th className="whitespace-nowrap px-3 py-3">Contact</th>
                <th className="min-w-[100px] px-3 py-3 hidden md:table-cell">Source</th>
                <th className="min-w-[100px] px-3 py-3">Next action</th>
                <th className="min-w-[220px] px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[#7A7164]">
                    No leads match the current view and filters.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const mailto = buildLeadMailtoUrl(row);
                  const reply = buildLeadReplyContent(row);
                  return (
                    <tr key={row.id} className={`align-top ${adminTableZebraRow}`}>
                      <td className="px-3 py-3">
                        <CreatedCell iso={row.created_at} />
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => openDetail(row)}
                          className="text-left font-semibold text-[#1E1810] underline decoration-[#C9B46A]/40 underline-offset-2 hover:text-[#6B5B2E]"
                        >
                          {clipLeadText(row.full_name, 40)}
                        </button>
                        {row.business_name ? (
                          <span className="mt-0.5 block text-xs text-[#5C5346]">{clipLeadText(row.business_name, 32)}</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <InquiryBadge inquiryType={row.inquiry_type} />
                        <ContactPrefBadge method={row.preferred_contact_method} />
                        <p className="mt-1 text-xs leading-snug text-[#5C5346]" title={row.message}>
                          {clipLeadText(row.message, 64)}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1 text-xs">
                          <a href={mailto} className="font-semibold text-[#6B5B2E] underline">
                            Email
                          </a>
                          {row.phone ? (
                            <a href={phoneTelHref(row.phone)} className="text-[#6B5B2E] underline">
                              Call
                            </a>
                          ) : (
                            <span className="text-[#7A7164]">No phone</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell text-xs" title={`${row.source_page} · ${row.source_cta}`}>
                        <span className="block font-mono text-[10px] text-[#7A7164]">
                          {clipLeadText(row.source_page, 22)}
                        </span>
                        <span
                          className={`font-semibold ${
                            row.source_cta === "promo_quote" ? "text-[#7A1E2C]" : "text-[#3D3629]"
                          }`}
                        >
                          {row.source_cta || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs font-semibold text-[#3D3629]">
                        {leadNextActionLabel(row)}
                      </td>
                      <td className="px-3 py-3">
                        <AdminLaunchLeadRowActions
                          folder={folder}
                          mailtoHref={mailto}
                          phone={row.phone}
                          lifecycleBusy={lifecycleBusy === row.id}
                          onView={() => openDetail(row)}
                          onCopyReply={() => void copyValue("Reply", reply.body)}
                          onEmail={() => void copyValue("Email", row.email)}
                          onArchive={() => void runLifecycle(row, "archive")}
                          onRestore={() => void runLifecycle(row, "restore")}
                          onDelete={() => void runLifecycle(row, "delete")}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected ? (
        <AdminLeonixLeadDetailDrawer
          lead={selected}
          folder={folder}
          saving={saving}
          lifecycleBusy={lifecycleBusy === selected.id}
          editStatus={editStatus}
          editNotes={editNotes}
          editFollowUp={editFollowUp}
          onClose={() => setSelectedId(null)}
          onEditStatus={setEditStatus}
          onEditNotes={setEditNotes}
          onEditFollowUp={setEditFollowUp}
          onSave={() => void saveDetail()}
          onCopy={(label, value) => void copyValue(label, value)}
          onLifecycle={(action) => void runLifecycle(selected, action)}
        />
      ) : null}
    </div>
  );
}
