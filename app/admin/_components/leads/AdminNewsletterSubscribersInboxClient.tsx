"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  adminBtnSecondary,
  adminCardBase,
  adminDesktopTableOnly,
  adminFilterRow,
  adminMobileCardList,
  adminTableWrap,
  adminTableZebraRow,
} from "@/app/admin/_components/adminTheme";
import { AdminLaunchLeadRowActions } from "@/app/admin/_components/leads/AdminLaunchLeadRowActions";
import { AdminLaunchLeadMobileCard } from "@/app/admin/_components/leads/AdminLaunchLeadMobileCard";
import { AdminNewsletterSubscriberDetailDrawer } from "@/app/admin/_components/leads/AdminNewsletterSubscriberDetailDrawer";
import { AdminResponsiveTabs } from "@/app/admin/_components/AdminResponsiveTabs";
import type { NewsletterSubscriberRow } from "@/app/admin/_lib/leonixLeadsData";
import {
  buildNewsletterMailtoUrl,
  buildNewsletterReplyContent,
} from "@/app/admin/_lib/leonixLeadReplyTemplates";
import {
  clipLeadText,
  copyTextToClipboard,
  formatBccEmailChunks,
  formatEmailsForBcc,
  formatLeadCreatedParts,
  parseInterestChips,
  subscribedEmailsFromRows,
} from "@/app/admin/_components/leads/adminLeadInboxFormat";

type Folder = "active" | "archived";

type Props = {
  initialActiveRows: NewsletterSubscriberRow[];
  initialArchivedRows: NewsletterSubscriberRow[];
  activeTotal: number;
  archivedTotal: number;
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

function patchRow(prev: NewsletterSubscriberRow[], row: NewsletterSubscriberRow): NewsletterSubscriberRow[] {
  const exists = prev.some((r) => r.id === row.id);
  if (exists) return prev.map((r) => (r.id === row.id ? row : r));
  return [row, ...prev];
}

export function AdminNewsletterSubscribersInboxClient({
  initialActiveRows,
  initialArchivedRows,
  activeTotal,
  archivedTotal,
  limit,
}: Props) {
  const [folder, setFolder] = useState<Folder>("active");
  const [activeRows, setActiveRows] = useState(initialActiveRows);
  const [archivedRows, setArchivedRows] = useState(initialArchivedRows);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [langFilter, setLangFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [lifecycleBusy, setLifecycleBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);

  const rows = folder === "active" ? activeRows : archivedRows;
  const total = folder === "active" ? activeTotal : archivedTotal;

  const sources = useMemo(() => {
    const set = new Set(rows.map((r) => r.source).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [rows]);

  const selected = useMemo(() => {
    const all = [...activeRows, ...archivedRows];
    return all.find((r) => r.id === selectedId) ?? null;
  }, [activeRows, archivedRows, selectedId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (langFilter !== "all" && row.preferred_language !== langFilter) return false;
      if (sourceFilter !== "all" && row.source !== sourceFilter) return false;
      if (!q) return true;
      const hay = [row.email, row.name, row.city, row.zip_code, row.interests].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, statusFilter, langFilter, sourceFilter]);

  function showToast(msg: string, kind: "ok" | "err" = "ok") {
    setToast({ msg, kind });
    window.setTimeout(() => setToast(null), 2800);
  }

  async function copyValue(label: string, value: string) {
    const ok = await copyTextToClipboard(value);
    showToast(ok ? `${label} copied` : `Could not copy ${label}`, ok ? "ok" : "err");
  }

  function openDetail(row: NewsletterSubscriberRow) {
    setSelectedId(row.id);
    setEditNotes(row.internal_notes ?? "");
  }

  async function saveDetail() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/leads/newsletter/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internal_notes: editNotes }),
      });
      const data = (await res.json()) as { ok?: boolean; row?: NewsletterSubscriberRow };
      if (res.ok && data.ok && data.row) {
        const row = data.row;
        if (row.archived_at) {
          setActiveRows((p) => p.filter((r) => r.id !== row.id));
          setArchivedRows((p) => patchRow(p, row));
        } else {
          setArchivedRows((p) => p.filter((r) => r.id !== row.id));
          setActiveRows((p) => patchRow(p, row));
        }
        showToast("Notes saved");
      } else {
        showToast("Could not save", "err");
      }
    } catch {
      showToast("Could not save", "err");
    } finally {
      setSaving(false);
    }
  }

  async function runLifecycle(row: NewsletterSubscriberRow, action: "archive" | "restore" | "delete") {
    if (action === "delete") {
      if (!window.confirm("Soft-delete this subscriber? They will be hidden from active and archived views.")) return;
    }
    setLifecycleBusy(row.id);
    try {
      const res = await fetch(`/api/admin/leads/newsletter/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { ok?: boolean; row?: NewsletterSubscriberRow };
      if (!res.ok || !data.ok || !data.row) {
        showToast("Action failed", "err");
        return;
      }
      const updated = data.row;
      if (action === "delete") {
        setActiveRows((p) => p.filter((r) => r.id !== row.id));
        setArchivedRows((p) => p.filter((r) => r.id !== row.id));
        if (selectedId === row.id) setSelectedId(null);
        showToast("Subscriber deleted (soft)");
      } else if (action === "archive") {
        setActiveRows((p) => p.filter((r) => r.id !== row.id));
        setArchivedRows((p) => patchRow(p.filter((r) => r.id !== row.id), updated));
        if (selectedId === row.id) setSelectedId(null);
        showToast("Subscriber archived");
      } else {
        setArchivedRows((p) => p.filter((r) => r.id !== row.id));
        setActiveRows((p) => patchRow(p.filter((r) => r.id !== row.id), updated));
        setFolder("active");
        showToast("Subscriber restored");
      }
    } catch {
      showToast("Action failed", "err");
    } finally {
      setLifecycleBusy(null);
    }
  }

  async function copyEmails() {
    const emails = formatEmailsForBcc(subscribedEmailsFromRows(filtered));
    if (!emails) {
      showToast("No subscribed emails in view");
      return;
    }
    const ok = await copyTextToClipboard(emails);
    showToast(ok ? "Visible emails copied" : "Could not copy emails");
  }

  async function copyEmailsForBcc() {
    const emails = subscribedEmailsFromRows(filtered);
    if (emails.length === 0) {
      showToast("No subscribed emails in view");
      return;
    }
    const ok = await copyTextToClipboard(formatEmailsForBcc(emails));
    showToast(ok ? "BCC email list copied" : "Could not copy BCC list");
  }

  async function copyBccChunks() {
    const emails = subscribedEmailsFromRows(filtered);
    if (emails.length === 0) {
      showToast("No subscribed emails in view");
      return;
    }
    const text = formatBccEmailChunks(emails);
    const ok = await copyTextToClipboard(text);
    const chunkCount = Math.ceil(emails.length / 50);
    showToast(ok ? `BCC email chunks copied (${chunkCount})` : "Could not copy BCC chunks");
  }

  return (
    <div className="space-y-6">
      <div className={`${adminCardBase} border-[#C9A84A]/40 bg-gradient-to-br from-[#FFFCF7] to-[#F6ECD8] px-4 py-4 text-sm text-[#3D3629]`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-[#7A1E2C]">Sales contact ops</p>
            <p className="mt-1 font-semibold text-[#1E1810]">
              Use this list for Launch 25 follow-up, sales outreach, and manual newsletter operations.
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-xs leading-relaxed text-[#5C5346]">
              <li>
                <strong>Export emails CSV</strong> → best for Google Sheets or Gmail contact import.
              </li>
              <li>
                <strong>Export full CSV</strong> → includes source, language, city, interests, consent, and status.
              </li>
              <li>
                <strong>Copy visible emails</strong> / <strong>Copy emails for BCC</strong> / <strong>Copy BCC chunks</strong> →
                only subscribed emails currently shown by your filters.
              </li>
              <li>
                <strong>Email/Reply</strong> use mailto → manual email client; no server bulk send yet.
              </li>
              <li>Promo delivery status lives on the promo-code record.</li>
            </ul>
          </div>
          <Link
            href="/admin/workspace/promo-codes?code_type=newsletter"
            className={`${adminBtnSecondary} shrink-0 self-start`}
          >
            View newsletter promo codes
          </Link>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-[#7A7164]">
          Newsletter subscribers — use <strong>View</strong> for full details. Archive when done; restore from Archived tab.
          Export/copy are manual operations until campaign sending is built inside Leonix.
        </p>
      </div>

      <AdminResponsiveTabs
        ariaLabel="Newsletter folders"
        items={[
          {
            key: "active",
            label: "Active",
            active: folder === "active",
            onClick: () => setFolder("active"),
            badge: <span className="rounded-full bg-[#F3E6D2] px-1.5 py-0.5 text-xs">{activeTotal}</span>,
          },
          {
            key: "archived",
            label: "Archived",
            active: folder === "archived",
            onClick: () => setFolder("archived"),
            badge: (
              <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-xs text-violet-900">{archivedTotal}</span>
            ),
          },
        ]}
      />

      <div className={adminFilterRow}>
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
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-sm">
            <option value="all">All</option>
            <option value="subscribed">subscribed</option>
            <option value="unsubscribed">unsubscribed</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346]">
          Pref. language
          <select value={langFilter} onChange={(e) => setLangFilter(e.target.value)} className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-sm">
            <option value="all">All</option>
            <option value="es">es</option>
            <option value="en">en</option>
            <option value="both">both</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346]">
          Source
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-sm">
            {sources.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All" : s}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-3">
          <Link href="/api/admin/leads/newsletter/export" className={adminBtnSecondary}>
            Export full CSV
          </Link>
          <Link href="/api/admin/leads/newsletter/emails-export" className={adminBtnSecondary}>
            Export emails CSV
          </Link>
          <button type="button" onClick={() => void copyEmails()} className={adminBtnSecondary}>
            Copy visible emails
          </button>
          <button type="button" onClick={() => void copyEmailsForBcc()} className={adminBtnSecondary}>
            Copy emails for BCC
          </button>
          <button type="button" onClick={() => void copyBccChunks()} className={adminBtnSecondary}>
            Copy BCC chunks
          </button>
          <span className="self-center text-sm text-[#7A7164]">
            Showing {filtered.length} of {rows.length} loaded ({total} {folder}, newest {limit})
          </span>
        </div>
        <p className="text-xs leading-relaxed text-[#5C5346]">
          <strong>No Excel needed:</strong> upload the CSV to Google Drive, then open with Google Sheets. For Gmail
          outreach, use Export emails CSV or copy buttons above — paste into <strong>BCC</strong>, not To. Use BCC chunks
          when the list is long (50 emails per chunk).
        </p>
      </div>

      {toast ? (
        <div className={`${adminCardBase} px-4 py-2 text-sm ${toast.kind === "ok" ? "border-emerald-200 bg-emerald-50/90 text-emerald-950" : "border-rose-200 bg-rose-50/90 text-rose-950"}`}>
          {toast.msg}
        </div>
      ) : null}

      <div className={`${adminTableWrap} ${adminDesktopTableOnly}`}>
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-left text-sm">
            <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2]/90 text-xs font-bold uppercase tracking-wide text-[#5C5346]">
              <tr>
                <th className="px-3 py-3">Created</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3 hidden lg:table-cell">City</th>
                <th className="px-3 py-3">Lang</th>
                <th className="px-3 py-3">Interests</th>
                <th className="px-3 py-3">Source</th>
                <th className="px-3 py-3">Status</th>
                <th className="min-w-[220px] px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[#7A7164]">No subscribers match filters.</td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const reply = buildNewsletterReplyContent(row);
                  const mailto = buildNewsletterMailtoUrl(row);
                  return (
                    <tr key={row.id} className={`align-top ${adminTableZebraRow}`}>
                      <td className="px-3 py-3"><CreatedCell iso={row.created_at} /></td>
                      <td className="px-3 py-3 font-medium break-all text-[#1E1810]">{row.email}</td>
                      <td className="px-3 py-3">
                        <button type="button" onClick={() => openDetail(row)} className="font-semibold text-[#1E1810] underline decoration-[#C9B46A]/40 underline-offset-2">
                          {clipLeadText(row.name, 32) || "—"}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-xs hidden lg:table-cell">{clipLeadText(row.city, 24)}</td>
                      <td className="px-3 py-3 text-xs uppercase">{row.preferred_language}</td>
                      <td className="px-3 py-3"><InterestChips interests={row.interests} /></td>
                      <td className="px-3 py-3 text-xs font-mono">{row.source}</td>
                      <td className="px-3 py-3 text-xs font-semibold capitalize">{row.status}</td>
                      <td className="px-3 py-3">
                        <AdminLaunchLeadRowActions
                          folder={folder}
                          mailtoHref={mailto}
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

      <div className={adminMobileCardList} data-testid="newsletter-mobile-list">
        {filtered.length === 0 ? (
          <p className="rounded-lg border border-[#E8DFD0] bg-[#FAF7F2] px-4 py-8 text-center text-sm text-[#7A7164]">
            No subscribers match filters.
          </p>
        ) : (
          filtered.map((row) => {
            const reply = buildNewsletterReplyContent(row);
            const mailto = buildNewsletterMailtoUrl(row);
            const created = formatLeadCreatedParts(row.created_at);
            return (
              <AdminLaunchLeadMobileCard
                key={row.id}
                createdAt={
                  <>
                    {created.date}
                    {created.time ? ` · ${created.time}` : ""}
                  </>
                }
                statusBadge={
                  <span className="rounded-full bg-[#FAF3E6] px-2 py-0.5 text-[10px] font-bold uppercase capitalize text-[#3D3629]">
                    {row.status}
                  </span>
                }
                title={row.name?.trim() || row.email}
                subtitle={row.name?.trim() ? row.email : undefined}
                wants={
                  <>
                    <InterestChips interests={row.interests} />
                    {row.city ? <span className="mt-1 block text-xs">City: {row.city}</span> : null}
                    <span className="mt-1 block text-xs uppercase">Lang: {row.preferred_language}</span>
                  </>
                }
                source={row.source}
                contactEmail={row.email}
                folder={folder}
                mailtoHref={mailto}
                lifecycleBusy={lifecycleBusy === row.id}
                onView={() => openDetail(row)}
                onCopyReply={() => void copyValue("Reply", reply.body)}
                onEmail={() => void copyValue("Email", row.email)}
                onArchive={() => void runLifecycle(row, "archive")}
                onRestore={() => void runLifecycle(row, "restore")}
                onDelete={() => void runLifecycle(row, "delete")}
              />
            );
          })
        )}
      </div>

      {selected ? (
        <AdminNewsletterSubscriberDetailDrawer
          row={selected}
          folder={folder}
          saving={saving}
          lifecycleBusy={lifecycleBusy === selected.id}
          editNotes={editNotes}
          onClose={() => setSelectedId(null)}
          onEditNotes={setEditNotes}
          onSave={() => void saveDetail()}
          onCopy={(label, value) => void copyValue(label, value)}
          onLifecycle={(action) => void runLifecycle(selected, action)}
        />
      ) : null}
    </div>
  );
}
