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
import { AdminMediaKitLeadDetailDrawer } from "@/app/admin/_components/leads/AdminMediaKitLeadDetailDrawer";
import type { MediaKitLeadRow } from "@/app/admin/_lib/leonixLeadsData";
import {
  buildMediaKitMailtoUrl,
  buildMediaKitReplyContent,
  LEONIX_MEDIA_KIT_PDF_URL,
} from "@/app/admin/_lib/leonixLeadReplyTemplates";
import { formatLeadPhoneDisplay } from "@/app/lib/leonix/phoneFormat";
import {
  clipLeadText,
  copyTextToClipboard,
  formatLeadCreatedParts,
} from "@/app/admin/_components/leads/adminLeadInboxFormat";

type Folder = "active" | "archived";

type Props = {
  initialActiveRows: MediaKitLeadRow[];
  initialArchivedRows: MediaKitLeadRow[];
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

function patchRow(prev: MediaKitLeadRow[], row: MediaKitLeadRow): MediaKitLeadRow[] {
  const exists = prev.some((r) => r.id === row.id);
  if (exists) return prev.map((r) => (r.id === row.id ? row : r));
  return [row, ...prev];
}

export function AdminMediaKitLeadsClient({
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [lifecycleBusy, setLifecycleBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);

  const rows = folder === "active" ? activeRows : archivedRows;
  const total = folder === "active" ? activeTotal : archivedTotal;

  const selected = useMemo(() => {
    const all = [...activeRows, ...archivedRows];
    return all.find((r) => r.id === selectedId) ?? null;
  }, [activeRows, archivedRows, selectedId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const hay = [row.name, row.email, row.phone, row.business, row.message, row.source].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  function showToast(msg: string, kind: "ok" | "err" = "ok") {
    setToast({ msg, kind });
    window.setTimeout(() => setToast(null), 2800);
  }

  async function copyValue(label: string, value: string) {
    const ok = await copyTextToClipboard(value);
    showToast(ok ? `${label} copied` : `Could not copy ${label}`, ok ? "ok" : "err");
  }

  function openDetail(row: MediaKitLeadRow) {
    setSelectedId(row.id);
    setEditNotes(row.internal_notes ?? "");
  }

  async function saveDetail() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/leads/media-kit/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internal_notes: editNotes }),
      });
      const data = (await res.json()) as { ok?: boolean; row?: MediaKitLeadRow };
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

  async function runLifecycle(row: MediaKitLeadRow, action: "archive" | "restore" | "delete") {
    if (action === "delete") {
      if (!window.confirm("Soft-delete this media kit lead? It will be hidden from active and archived views.")) return;
    }
    setLifecycleBusy(row.id);
    try {
      const res = await fetch(`/api/admin/leads/media-kit/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { ok?: boolean; row?: MediaKitLeadRow };
      if (!res.ok || !data.ok || !data.row) {
        showToast("Action failed", "err");
        return;
      }
      const updated = data.row;
      if (action === "delete") {
        setActiveRows((p) => p.filter((r) => r.id !== row.id));
        setArchivedRows((p) => p.filter((r) => r.id !== row.id));
        if (selectedId === row.id) setSelectedId(null);
        showToast("Lead deleted (soft)");
      } else if (action === "archive") {
        setActiveRows((p) => p.filter((r) => r.id !== row.id));
        setArchivedRows((p) => patchRow(p.filter((r) => r.id !== row.id), updated));
        if (selectedId === row.id) setSelectedId(null);
        showToast("Lead archived");
      } else {
        setArchivedRows((p) => p.filter((r) => r.id !== row.id));
        setActiveRows((p) => patchRow(p.filter((r) => r.id !== row.id), updated));
        setFolder("active");
        showToast("Lead restored");
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
        Media kit requests — <strong>View</strong> for full message. Reply includes{" "}
        <a href={LEONIX_MEDIA_KIT_PDF_URL} className="font-semibold text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
          media kit PDF
        </a>
        . Archive when done; restore from Archived tab.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFolder("active")}
          className={`rounded-full border px-4 py-2 text-sm font-bold ${
            folder === "active" ? "border-[#6B5B2E] bg-[#FAF3E6] text-[#2C2416]" : "border-[#E8DFD0] text-[#5C5346]"
          }`}
        >
          Active
          <span className="ml-1.5 rounded-full bg-[#F3E6D2] px-1.5 py-0.5 text-xs">{activeTotal}</span>
        </button>
        <button
          type="button"
          onClick={() => setFolder("archived")}
          className={`rounded-full border px-4 py-2 text-sm font-bold ${
            folder === "archived" ? "border-[#6B5B2E] bg-[#FAF3E6] text-[#2C2416]" : "border-[#E8DFD0] text-[#5C5346]"
          }`}
        >
          Archived
          <span className="ml-1.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-xs text-violet-900">{archivedTotal}</span>
        </button>
      </div>

      <label className="flex min-w-[200px] max-w-md flex-col gap-1 text-xs font-semibold text-[#5C5346]">
        Search
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, email, business…"
          className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-sm"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <Link href="/api/admin/leads/media-kit/export" className={adminBtnSecondary}>Export CSV</Link>
        <span className="self-center text-sm text-[#7A7164]">
          Showing {filtered.length} of {rows.length} loaded ({total} {folder}, newest {limit})
        </span>
      </div>

      {toast ? (
        <div className={`${adminCardBase} px-4 py-2 text-sm ${toast.kind === "ok" ? "border-emerald-200 bg-emerald-50/90 text-emerald-950" : "border-rose-200 bg-rose-50/90 text-rose-950"}`}>
          {toast.msg}
        </div>
      ) : null}

      <div className={adminTableWrap}>
        <div className="overflow-x-auto">
          <table className="min-w-[1050px] w-full text-left text-sm">
            <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2]/90 text-xs font-bold uppercase tracking-wide text-[#5C5346]">
              <tr>
                <th className="px-3 py-3">Created</th>
                <th className="px-3 py-3">Lead</th>
                <th className="px-3 py-3">Business</th>
                <th className="px-3 py-3">Message</th>
                <th className="px-3 py-3">Source</th>
                <th className="px-3 py-3">Status</th>
                <th className="min-w-[220px] px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[#7A7164]">No media kit leads match the search.</td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const reply = buildMediaKitReplyContent(row);
                  const mailto = buildMediaKitMailtoUrl(row);
                  return (
                    <tr key={row.id} className={`align-top ${adminTableZebraRow}`}>
                      <td className="px-3 py-3"><CreatedCell iso={row.created_at} /></td>
                      <td className="px-3 py-3">
                        <button type="button" onClick={() => openDetail(row)} className="text-left font-semibold text-[#1E1810] underline decoration-[#C9B46A]/40 underline-offset-2">
                          {clipLeadText(row.name, 36)}
                        </button>
                        <span className="mt-0.5 block text-xs break-all text-[#5C5346]">{row.email}</span>
                        {row.phone ? (
                          <span className="mt-0.5 block text-[10px] text-[#7A7164]">{formatLeadPhoneDisplay(row.phone)}</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-[#3D3629]">{clipLeadText(row.business, 32)}</td>
                      <td className="px-3 py-3 text-xs text-[#5C5346]" title={row.message}>{clipLeadText(row.message, 72)}</td>
                      <td className="px-3 py-3 text-xs font-mono">{row.source}</td>
                      <td className="px-3 py-3 text-xs font-semibold">{row.status}</td>
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
        <AdminMediaKitLeadDetailDrawer
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
